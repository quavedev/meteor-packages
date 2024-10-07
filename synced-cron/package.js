Package.describe({
  summary:
    'Allows you to define and run scheduled jobs across multiple servers.',
  version: '2.0.9',
  name: 'quave:synced-cron',
  git: 'https://github.com/quavedev/meteor-synced-cron.git',
});

Npm.depends({ '@breejs/later': '4.1.0' });

Package.onUse(function (api) {
  api.versionsFrom(['2.12', '3.0.3']);

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
