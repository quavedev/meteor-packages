Package.describe({
  summary: 'Azure Active Directory OAuth flow',
  version: '1.5.0',
  name: 'quave:azure-active-directory',
  git: 'https://github.com/quavedev/meteor-packages',
});

Package.onUse((api) => {
  api.versionsFrom('2.3');

  api.use('oauth2', ['client', 'server']);
  api.use('oauth', ['client', 'server']);
  api.use('http', ['server']);
  api.use('service-configuration', ['client', 'server']);
  api.use('random', 'client');
  api.use('accounts-base', ['client', 'server']);

  api.export('AzureAd');

  api.addFiles(['lib/azureAd.js']);
  api.addFiles(
    ['lib/resources.js', 'lib/serverHttp.js', 'resources/graph.js'],
    'server'
  );
  api.addFiles('azure_ad_server.js', 'server');
  api.addFiles('azure_ad_client.js', 'client');
});
