Package.describe({
  name: 'quave:unblock',
  version: '1.0.0',
  summary: 'Unblock Meteor methods and publications by default',
  git: 'https://github.com/quavedev/meteor-packages/tree/main/unblock',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('3.0.3');
  api.use(['ecmascript', 'meteor'], 'server');
  api.mainModule('server.js', 'server');
});

Package.onTest((api) => {
  api.use(['ecmascript', 'meteor', 'tinytest'], 'server');
  api.use('quave:unblock', 'server');
  api.addFiles('server-tests.js', 'server');
});
