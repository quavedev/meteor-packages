/* global Package Npm */

Package.describe({
  name: 'quave:email-resend',
  summary: 'Resend support',
  version: '0.1.0',
  git: 'https://github.com/quavedev/meteor-packages/tree/main/email-resend',
});

Npm.depends({
  resend: '6.12.4',
});

Package.onUse((api) => {
  api.versionsFrom('2.13.3');

  api.use(['email@2.0.0||3.0.0'], ['server']);

  api.use('ecmascript');
  api.use('quave:settings@1.0.0');

  api.mainModule('server.js', 'server');
});
