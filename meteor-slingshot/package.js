Package.describe({
  name: 'quave:slingshot',
  summary: 'Directly post files to cloud storage services, such as AWS-S3.',
  version: '2.0.2',
  git: 'https://github.com/quavedev/meteor-packages',
});

Package.onUse(function (api) {
  api.versionsFrom(['METEOR@1.0', '3.0.2']);

  api.use(['underscore', 'check']);
  api.use(['tracker', 'reactive-var'], 'client');

  api.addFiles(['lib/restrictions.js', 'lib/validators.js']);

  api.addFiles('lib/upload.js', 'client');

  api.addFiles(
    [
      'lib/directive.js',
      'lib/storage-policy.js',
      'services/cloudflare-r2.js',
      'services/aws-s3.js',
      'services/google-cloud.js',
      'services/rackspace.js',
    ],
    'server'
  );

  api.export('Slingshot');
});

Package.onTest(function (api) {
  api.use(['tinytest', 'underscore', 'quave:slingshot']);
  api.addFiles('test/aws-s3.js', 'server');
});
