Package.describe({
  name: 'quave:profile',
  version: '1.0.2',
  summary: 'Profile the server runtime of Meteor',
  git: 'http://github.com/quavedev/profile',
  documentation: 'README.md',
});

Npm.depends({
  'aws-sdk': '2.696.0',
  'v8-profiler-next': '1.3.0',
});

Package.onUse((api) => {
  api.versionsFrom('METEOR@1.10.2');

  api.use(['ecmascript', 'underscore'], ['server']);

  api.use('quave:settings@1.0.0');

  api.mainModule('main.js', 'server');
});
