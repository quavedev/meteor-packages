Package.describe({
  summary:
    'Allows you to define and run scheduled jobs across multiple servers.',
  version: '2.0.6',
  name: 'quave:synced-cron',
  git: 'https://github.com/quavedev/meteor-synced-cron.git',
});

Npm.depends({ '@breejs/later': '4.1.0' });

Package.onUse(function (api) {
  api.versionsFrom(['METEOR@2.12', 'METEOR@3.0-rc.2']);

  api.use('ecmascript');

  api.use(['check', 'mongo', 'logging'], 'server');

  api.addFiles(['synced-cron-server.js'], 'server');

  api.export('SyncedCron', 'server');
});

Package.onTest(function (api) {
  api.use(['check', 'mongo'], 'server');
  api.use(['tinytest', 'logging']);

  api.addFiles(['synced-cron-server.js', 'synced-cron-tests.js'], ['server']);
});
