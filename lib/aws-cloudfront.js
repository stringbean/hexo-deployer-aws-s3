const {
  CloudFrontClient,
  CreateInvalidationCommand,
} = require('@aws-sdk/client-cloudfront');
const { fromIni } = require('@aws-sdk/credential-provider-ini');

class CloudFrontInvalidator {
  constructor(args) {
    const profile = args.profile || 'default';

    this.distribution = args.cloudfront_distribution;

    this.client = new CloudFrontClient({
      region: args.region,
      credentials: fromIni({ profile }),
    });
  }

  async invalidateDistribution() {
    console.log(`Invalidating CloudFront distribution ${this.distribution}`);

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
