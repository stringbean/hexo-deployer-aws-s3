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

### CloudFront Invalidation

After deploying to S3 the plugin can optionally invalidate a CloudFront distribution to force a cache refresh. To do
this, add the CloudFront distribution ID to your Hexo config:

```yaml
deploy:
  type: aws-s3
  region: us-east-1
  bucket: example-bucket
  cloudfront_distribution: EXAMPLE123
```

### Redirect Rules

Adding S3 [webpage redirects][s3-redirects] is supported via entries in the Hexo config and via page front-matter.

:warning: Any existing webpage redirects configured for the S3 bucket will get overwritten by the redirects generated
by this plugin.

#### Via Front-Matter

With a `permalink` setting of `:year/:month/:day/:title/` and the following front-matter:

```yaml
---
title: Exciting Post
date: 2022-01-01 12:00:00
redirect_from: old-path.html
---
```

A redirect from `old-path.html` to `2022/01/01/exciting-post` will be generated.

#### Via Config

Additionally, redirects can be specified directly in the Hexo config:

```yaml
deploy:
  type: aws-s3
  redirects:
    'old.html': 'new-post'
    'another.html': 'pages/something/new'
```

Will generate the following redirects:

- `old.html` to `new-post`.
- `another.html` to `pages/something/new`.

### Cache Policies

Cache expiry durations can be defined on a per MIME type basis and are defined in seconds. Any unmatched MIME types will
be served without a cache header.

For example:

```yaml
deploy:
  type: aws-s3
  cache_policies:
    text/css: 86400 # 24 hours
```

Will serve the following header for CSS files:

```text
Cache-Control: public, max-age=86400;
```

## Options

| Name                      | Default    | Description                                                                           |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| `region`                  | _required_ | AWS region that the bucket is hosted in.                                              |
| `bucket`                  | _required_ | AWS bucket to upload to.                                                              |
| `profile`                 | `default`  | AWS credentials profile to use (see [Named Profiles][aws-profiles]).                  |
| `delete_unknown`          | `false`    | If `true` then any unknown files will be deleted from the bucket.                     |
| `cloudfront_distribution` | _none_     | CloudFront distribution ID to invalidate on deploy.                                   |
| `redirects`               | _none_     | Mappings of from path → destination path that will get converted into redirect rules. |
| `host_name`               | _none_     | Domain name of the S3 website that will be used for redirects.                        |
| `cache_policies`          | _none_     | Map of MIME types to cache-expiry duration (in seconds).                              |

[aws-profiles]: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html
[s3-redirects]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/how-to-page-redirect.html
