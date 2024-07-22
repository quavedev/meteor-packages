Accounts.oauth.registerService('azureAd');

if (Meteor.isClient) {
  const loginWithAzureAd = (...args) => {
    // support both (options, callback) and (callback).
    const isFirstArgFunction = typeof args[0] === 'function';
    const options = isFirstArgFunction ? {} : args[0] || {};
    const callback = isFirstArgFunction ? args[0] : args[1];

    // eslint-disable-next-line max-len
    const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(
      callback
    );
    AzureAd.requestCredential(options, credentialRequestCompleteCallback);
  };
  Accounts.registerClientLoginFunction('azureAd', loginWithAzureAd);
  Meteor.loginWithAzureAd = (...args) =>
    Accounts.applyLoginFunction('azureAd', args);
} else {
  const fieldsForLoggedInusers = AzureAd.allowlistFields
    .concat(['accessToken', 'expiresAt'])
    .map(subfield => `services.azureAd.${subfield}`);
  const fieldsForOtherUsers = AzureAd.allowlistFields
    .filter(
      allowlistField => !['mail', 'userPrincipalName'].includes(allowlistField)
    )
    .map(subfield => `services.azureAd.${subfield}`);

  Accounts.addAutopublishFields({
    forLoggedInUser: fieldsForLoggedInusers,
    forOtherUsers: fieldsForOtherUsers,
  });
}
