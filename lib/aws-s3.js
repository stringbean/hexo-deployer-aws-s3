const {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
  GetBucketWebsiteCommand,
  PutBucketWebsiteCommand,
} = require('@aws-sdk/client-s3');
const { fromIni } = require('@aws-sdk/credential-provider-ini');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const { CloudFrontInvalidator } = require('./aws-cloudfront');
const { magenta } = require('picocolors');

class S3Deployer {
  /**
   * @param {Hexo} hexo
   * @param args
   */
  constructor(hexo, args) {
    // TODO validate args
    this.hexo = hexo;
    this.bucket = args.bucket;
    this.config = args;

    const profile = args.profile || 'default';

    this.client = new S3Client({
      region: args.region,
      credentials: fromIni({ profile }),
    });
  }

  async uploadDir(dir) {
    const files = await this._findFiles(dir);

    const uploads = files.map((f) => this._uploadFile(dir, f));
    return await Promise.all(uploads);
  }

  async deleteUnknown(knownKeys) {
    // list all objects in bucket
    const listRequest = new ListObjectsCommand({ Bucket: this.bucket });
    const listResponse = await this.client.send(listRequest);
    const bucketKeys = listResponse.Contents.map((object) => object.Key);

    // find keys that we have not just deployed
    const unknownKeys = bucketKeys
      .filter((key) => !knownKeys.includes(key))
      .map((key) => {
        return { Key: key };
      });

    if (unknownKeys.length) {
      // TODO batch to 1000 keys
      // delete unknown keys
      const deleteRequest = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: unknownKeys,
        },
      });

      await this.client.send(deleteRequest);
    }
  }

  async updateRedirectRules(redirects, hostName) {
    this.hexo.log.info('Applying redirect rules');

    // fetch the existing config, so we can repopulate index & error document settings
    const getRequest = new GetBucketWebsiteCommand({ Bucket: this.bucket });
    const getResponse = await this.client.send(getRequest);

    const IndexDocument = getResponse.IndexDocument;
    const ErrorDocument = getResponse.ErrorDocument;

    // create the redirect rules in the right format
    const redirectRules = redirects.map((redirect) => {
      this.hexo.log.debug(
        `Adding redirect from ${magenta(redirect.from)} to ${magenta(
          redirect.to,
        )}`,
      );

      // strip any leading slashes from the from & to
      const from = redirect.from.replace(/^\//, '');
      const to = redirect.to.replace(/^\//, '');

      return {
        Condition: {
          KeyPrefixEquals: from,
        },
        Redirect: {
          ReplaceKeyWith: to,
          HostName: hostName,
        },
      };
    });

    // update the configuration
    const putRequest = new PutBucketWebsiteCommand({
      Bucket: this.bucket,
      WebsiteConfiguration: {
        IndexDocument,
        ErrorDocument,
        RoutingRules: redirectRules,
      },
    });

    await this.client.send(putRequest);
  }

  async findRedirects() {
    const configRedirects = this._extractConfigRedirects();
    const postRedirects = await this._scanPostRedirects();

    return [...configRedirects, ...postRedirects];
  }

  _extractConfigRedirects() {
    const redirectConfig = this.hexo.config.deploy.redirects;

    if (!redirectConfig) {
      return [];
    }

    return Object.entries(redirectConfig).map((entry) => {
      const [from, to] = entry;

      return { from, to };
    });
  }

  async _scanPostRedirects() {
    // ensure that the db is loaded
    await this.hexo.load();
    const posts = this.hexo.model('Post').toArray();

    return posts
      .filter(
        (post) =>
          post.redirect_from &&
          (post.published || this.hexo.config.render_drafts),
      )
      .flatMap((post) => {
        let fromPaths = post.redirect_from;

        if (!Array.isArray(fromPaths)) {
          fromPaths = [fromPaths];
        }

        return fromPaths.map((from) => {
          return { from, to: post.path };
        });
      });
  }

  async _findFiles(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    const files = await Promise.all(
      entries.map((entry) => {
        const entryPath = path.resolve(dir, entry.name);
        return entry.isFile() ? entryPath : this._findFiles(entryPath);
      }),
    );

    return Array.prototype.concat(...files);
  }

  async _uploadFile(parentDir, file) {
    const key = path.relative(parentDir, file);
    const mimeType = mime.getType(file) || 'application/octet-stream';

    const cacheExpiry = this.config.cache_policies?.[mimeType];

    const cachePolicy = cacheExpiry
      ? `public, max-age=${cacheExpiry}`
      : undefined;

    const request = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fs.createReadStream(file),
      ContentType: mimeType,
      CacheControl: cachePolicy,
    });

    await this.client.send(request);

    this.hexo.log.info(`Uploaded: ${magenta(key)}`);

    return key;
  }
}

/**
 * @param {Hexo} hexo
 * @param args
 * @return {Promise<void>}
 */
module.exports = async function (hexo, args) {
  const deployer = new S3Deployer(hexo, args);

  const keys = await deployer.uploadDir(hexo.public_dir);

  if (args.delete_unknown) {
    await deployer.deleteUnknown(keys);
  }

  const redirects = await deployer.findRedirects();

  if (redirects.length) {
    await deployer.updateRedirectRules(redirects, args.host_name);
  }

  if (args.cloudfront_distribution) {
    const invalidator = new CloudFrontInvalidator(hexo, args);
    await invalidator.invalidateDistribution();
  }
};
