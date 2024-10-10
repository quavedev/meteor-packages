/* global Package */
Package.describe({
  name: 'quave:collections',
  version: '3.0.1',
  summary: 'Utility package to create Meteor collections in a standard way',
  git: 'https://github.com/quavedev/meteor-packages/tree/main/collections',
});

Npm.depends({
  'lodash.isempty': '4.4.0',
  'lodash.isequal': '4.5.0',
  'lodash.isobject': '3.0.2',
});

Package.onUse((api) => {
  api.versionsFrom('3.0.3');

  api.use(['ecmascript', 'mongo', 'minimongo', 'ejson']);
  api.use('zodern:types');
  api.imply('mongo');

  api.use('quave:settings@1.0.0');

  api.mainModule('collections.js');
});
