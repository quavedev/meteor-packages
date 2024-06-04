/* global Package */

Package.describe({
  name: 'quave:collection-hooks',
  summary:
    'Extends Mongo.Collection with before/after hooks for insert/update/upsert/remove/find/findOne',
  version: '1.3.2',
  git: 'https://github.com/quavedev/meteor-packages',
});

Package.onUse(function (api) {
  api.versionsFrom(['2.12']);

  api.use(['mongo', 'tracker', 'ejson', 'minimongo', 'ecmascript']);

  api.use('zodern:types@1.0.11', 'server');

  api.use(['accounts-base'], ['client', 'server'], { weak: true });

  api.mainModule('client.js', 'client');
  api.mainModule('server.js', 'server');

  api.export('CollectionHooks');
});

Package.onTest(function (api) {
  // var isTravisCI = process && process.env && process.env.TRAVIS

  api.versionsFrom(['2.12']);

  api.use([
    'quave:collection-hooks',
    'accounts-base',
    'accounts-password',
    'mongo',
    'tinytest',
    'test-helpers',
    'ecmascript',
  ]);

  api.mainModule('tests/client/main.js', 'client');
  api.mainModule('tests/server/main.js', 'server');
});
