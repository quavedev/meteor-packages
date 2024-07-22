/* global Package */
Package.describe({
  name: 'quave:react-data',
  summary: 'Utilities to manage data with React',
  version: '4.1.2',
  git: 'https://github.com/quavedev/meteor-packages/tree/main/react-data',
});

Package.onUse((api) => {
  api.versionsFrom('2.16');

  api.use('ecmascript');

  api.use('react-meteor-data@2.7.2||3.0.0');

  api.mainModule('server.js', 'server');
  api.mainModule('client.js', 'client');
});
