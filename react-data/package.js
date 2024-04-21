/* global Package */
Package.describe({
  name: 'quave:react-data',
  summary: 'Utilities to manage data with React',
  version: '4.0.6',
  git: 'https://github.com/quavedev/meteor-packages/tree/main/react-data',
});

Package.onUse((api) => {
  api.versionsFrom('2.15');

  api.use('ecmascript');

  api.use('react-meteor-data@2.6.1');

  api.mainModule('common.js');
  api.mainModule('react-data.js', 'client');
});
