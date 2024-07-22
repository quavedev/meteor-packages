AzureAd.resources.graph = {
  friendlyName: 'graph',
  resourceUri: 'https://graph.microsoft.com/',
};

AzureAd.resources.graph.getUser = accessToken =>
  AzureAd.http.callAuthenticated(
    'GET',
    `${AzureAd.resources.graph.resourceUri}v1.0/me`,
    accessToken
  );

if (Meteor.isServer) {
  Meteor.startup(() => {
    AzureAd.resources.registerResource(
      AzureAd.resources.graph.friendlyName,
      AzureAd.resources.graph.resourceUri
    );
  });
}
