const {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
} = require('@aws-sdk/client-s3');
const { fromIni } = require('@aws-sdk/credential-provider-ini');
const fs = require('fs');
const path = require('path');

class S3Deployer {
  constructor(args) {
    // TODO validate args
    this.bucket = args.bucket;

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
        console.log(`Deleting ${key}`);
        return { Key: key };
      });

    if (unknownKeys) {
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

    const request = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fs.createReadStream(file),
    });

    await this.client.send(request);

    console.log(`uploaded ${key}`);

    return key;
  }
}

module.exports = async function (hexo, args) {
  const deployer = new S3Deployer(args);

  const keys = await deployer.uploadDir(hexo.public_dir);

  if (args.delete_unknown) {
    await deployer.deleteUnknown(keys);
  }
};
