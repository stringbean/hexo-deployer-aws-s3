/* global hexo */

const s3Deployer = require('./lib/aws-s3');

hexo.extend.deployer.register('aws-s3', (args) => s3Deployer(hexo, args));
