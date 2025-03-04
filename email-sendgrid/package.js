/* global Package Npm */

Package.describe({
  name: 'quave:email-sendgrid',
  summary: 'SendGrid support',
  version: '1.0.0',
  git: 'https://github.com/quavedev/meteor-packages/tree/main/email-sendgrid',
});

Npm.depends({
  '@sendgrid/mail': '8.1.4',
});

Package.onUse(api => {
  api.versionsFrom('2.13.3');

  api.use(['email@2.0.0||3.0.0'], ['server']);

  api.use('ecmascript');
  api.use('quave:settings@1.0.0');

  api.mainModule('server.js', 'server');
});
