Package.describe({
  summary: 'Proper MongoDB aggregations support for Meteor',
  version: '1.4.4',
  git: 'https://github.com/sakulstra/meteor-aggregate',
  name: 'sakulstra:aggregate'
});

Package.onUse(function(api) {
  configurePackage(api);
});

Package.onTest(function(api) {
  configurePackage(api);
  api.use(['tinytest', 'accounts-password', 'random'], ['server']);

  // common before
  api.addFiles(['test.js'], ['server']);
});

function configurePackage(api) {
  api.versionsFrom('METEOR@1');
  api.use(['mongo'], ['server']);

  // common before
  api.addFiles(['index.js'], ['server']);
}
