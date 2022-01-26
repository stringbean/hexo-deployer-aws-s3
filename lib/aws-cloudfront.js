const {
  CloudFrontClient,
  CreateInvalidationCommand,
} = require('@aws-sdk/client-cloudfront');
const { fromIni } = require('@aws-sdk/credential-provider-ini');
const { magenta } = require('picocolors');

class CloudFrontInvalidator {
  /**
   * @param {Hexo} hexo
   * @param args
   */
  constructor(hexo, args) {
    this.hexo = hexo;

    const profile = args.profile || 'default';

    this.distribution = args.cloudfront_distribution;

    this.client = new CloudFrontClient({
      region: args.region,
      credentials: fromIni({ profile }),
    });
  }

  async invalidateDistribution() {
    this.hexo.log.info(
      `Invalidating CloudFront distribution ${magenta(this.distribution)}`,
    );

    const reference = new Date().toISOString();

    const invalidateRequest = new CreateInvalidationCommand({
      DistributionId: this.distribution,
      InvalidationBatch: {
        CallerReference: reference,
        Paths: {
          Items: ['/*'],
          Quantity: 1,
        },
      },
    });

    await this.client.send(invalidateRequest);
  }
}

module.exports = {
  CloudFrontInvalidator: CloudFrontInvalidator,
};
