// Request AzureAd credentials for the user
AzureAd.requestCredential = (...args) => {
  // support both (options, callback) and (callback).
  const isFirstArgFunction = typeof args[0] === 'function';
  const options = isFirstArgFunction ? {} : args[0] || {};
  const callback = isFirstArgFunction ? args[0] : args[1];

  const config =
    options.config || AzureAd.getConfiguration({ returnNullIfMissing: true });
  if (!config) {
    callback && callback(new ServiceConfiguration.ConfigError());
    return;
  }

  const tenant = options.tenant || 'common';
  const scope = options.scope ? options.scope.join(' ') : 'user.read';

  const loginStyle = OAuth._loginStyle('azureAd', config, options);
  const credentialToken = Random.secret();

  const queryParams = {
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: OAuth._redirectUri('azureAd', config),
    scope,
    response_mode: 'query',
    state: OAuth._stateParam(loginStyle, credentialToken, null, {
      tenantId: config.tenantId,
      clientId: config.clientId,
    }),
    prompt: options.loginPrompt || 'login',
  };

  if (options.login_hint) {
    queryParams.login_hint = options.login_hint;
  }
  if (options.domain_hint) {
    queryParams.domain_hint = options.domain_hint;
  }

  const queryParamsEncoded = Object.entries(queryParams).map(
    ([key, value]) => `${key}=${encodeURIComponent(value)}`
  );

  const baseUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?`;
  const loginUrl = baseUrl + queryParamsEncoded.join('&');

  OAuth.launchLogin({
    loginStyle,
    loginUrl,
    credentialToken,
    loginService: 'azureAd',
    credentialRequestCompleteCallback: callback,
    popupOptions: { height: 600 },
  });
};
