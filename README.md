# Hexo S3 Deployer

![npm version](https://img.shields.io/npm/v/@string-bean/hexo-deployer-aws-s3)
![License](https://img.shields.io/npm/l/@string-bean/hexo-deployer-aws-s3)

Plugin for deploying [Hexo](https://hexo.io) sites to Amazon S3.

This is an alternative to the existing [hexo-deployer-s3](https://github.com/nt3rp/hexo-deployer-s3) and
[hexo-deployer-s3-cloudfront](https://github.com/Wouter33/hexo-deployer-s3-cloudfront) plugins that has been written
from the ground up to use the new AWS SDK v3.

## Installation

```shell
npm install -S @string-bean/hexo-deployer-aws-s3
```

## Usage

Add the following section to your Hexo `_config.yml`:

```yaml
deploy:
  type: aws-s3
  region: us-east-1
  bucket: example-bucket
```

And then deploy using `hexo deploy`.

## Options

| Name             | Default    | Description                                                          |
|------------------|------------|----------------------------------------------------------------------|
| `region`         | _required_ | AWS region that the bucket is hosted in.                             |
| `bucket`         | _required_ | AWS bucket to upload to.                                             | 
| `profile`        | `default`  | AWS credentials profile to use (see [Named Profiles][aws-profiles]). |
| `delete_unknown` | `false`    | If `true` then any unknown files will be deleted from the bucket.    |

[aws-profiles]: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html