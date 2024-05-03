Package.describe({
  summary: 'Login service for Azure Active Directory',
  version: '1.5.0',
  name: 'quave:accounts-azure-active-directory',
  git: 'https://github.com/quavedev/meteor-packages',
});

Package.onUse((api) => {
  api.versionsFrom('2.3');

  api.use('accounts-base', ['client', 'server']);
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);
  api.use('accounts-oauth', ['client', 'server']);
  api.use('quave:azure-active-directory@1.5.0', ['client', 'server']);

  api.addFiles('azure_ad_login_buttons.css', 'client');

  api.addFiles('azure_ad.js');
});
