/* global Package */

Package.describe({
  name: 'quave:logged-user-react',
  summary: 'Logged user utilities for React apps',
  version: '2.0.1-beta300.7',
  git: 'https://github.com/quavedev/logged-user-react'
});

Package.onUse(api => {
  api.versionsFrom(['2.5.3', '3.0-beta.7']);

  api.use('ecmascript');

  api.use('quave:react-meteor-data@3.0.0-beta300.7');

  api.mainModule('logged-user-react.js', 'client');
});
