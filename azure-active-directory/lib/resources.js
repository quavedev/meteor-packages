AzureAd.resources = {};

const resources = {};

function saveTokensForUser(user, friendlyName, tokens) {
  user.azureAdResources[friendlyName] = tokens;
  const modifier = { $set: {} };
  modifier.$set[`azureAdResources.${friendlyName}`] =
    user.azureAdResources[friendlyName];

  Meteor.users.update(user._id, modifier);
}

function isAccessTokenMissingOrExpired(user, friendlyName) {
  return (
    !user.azureAdResources[friendlyName].accessToken ||
    new Date() >= new Date(user.azureAdResources[friendlyName].expiresOn * 1000)
  );
}

function checkUserIsDefined(user) {
  if (!user) {
    throw new Meteor.Error(
      'azure-active-directory:User required',
      'The supplied user is null or undefined'
    );
  }
}

function ensureAzureAdResourcesOnUser(user, friendlyName) {
  if (!user.azureAdResources) {
    user.azureAdResources = {};
  }
  if (!user.azureAdResources[friendlyName]) {
    user.azureAdResources[friendlyName] = {};
  }
}

function checkResourceExists(friendlyName) {
  if (!(friendlyName in resources)) {
    const details = `Could not find a resource with the friendly name '${friendlyName}'.`;
    throw new Meteor.Error(
      'azure-active-directory:Resource not registered',
      details
    );
  }
}

function getTokensForResource(user, friendlyName) {
  return AzureAd.http.getAccessTokensBase(resources[friendlyName], {
    grant_type: 'refresh_token',
    refresh_token:
      user.azureAdResources[friendlyName].refreshToken ||
      user.services.azureAd.refreshToken,
  });
}

AzureAd.resources.registerResource = (friendlyName, resourceUri) => {
  resources[friendlyName] = resourceUri;
};

AzureAd.resources.getOrUpdateUserAccessToken = (friendlyName, user) => {
  checkResourceExists(friendlyName);
  checkUserIsDefined(user);
  ensureAzureAdResourcesOnUser(user, friendlyName);

  if (isAccessTokenMissingOrExpired(user, friendlyName)) {
    const tokens = getTokensForResource(user, friendlyName);
    saveTokensForUser(user, friendlyName, tokens);
  }

  return user.azureAdResources[friendlyName].accessToken;
};
