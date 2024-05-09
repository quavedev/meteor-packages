Package.describe({
  summary: 'Proper MongoDB aggregations support for Meteor',
  version: '2.0.0',
  git: 'https://github.com/quavedev/meteor-packages/',
  name: 'quave:aggregate',
});

Package.onUse(function (api) {
  configurePackage(api);
});

Package.onTest(function (api) {
  configurePackage(api);
  api.use(['tinytest', 'accounts-password', 'random'], ['server']);

  // common before
  api.addFiles(['test.js'], ['server']);
});

function configurePackage(api) {
  api.versionsFrom(['METEOR@2.12', '3.0-rc.0']);
  api.use(['mongo'], ['server']);

  // common before
  api.addFiles(['index.js'], ['server']);
}
