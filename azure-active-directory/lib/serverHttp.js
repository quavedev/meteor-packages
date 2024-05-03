AzureAd.http = {};

AzureAd.http.call = (method, url, options) => {
  let response;

  try {
    response = HTTP.call(method, url, options);
  } catch (err) {
    const details = JSON.stringify({
      url,
      options,
      method,
    });
    throw new Meteor.Error('azure-active-directory:failed HTTP request', err.message, details);
  }

  if (response.data.error) {
    const reason = response.data.error;
    const details = JSON.stringify({
      statusCode: response.statusCode,
      url,
      options,
      method,
    });
    throw new Meteor.Error(
      'azure-active-directory:invalid HTTP response',
      `Url=${reason}`,
      details,
    );
  } else {
    return response.data;
  }
};

AzureAd.http.callAuthenticated = (method, url, accessToken, options = {}) =>
  AzureAd.http.call(method, url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
  });

AzureAd.http.getAccessTokensBase = (
  additionalRequestParams,
  tenantId,
  rootUrlFromRequest,
  state,
) => {
  const config = AzureAd.getConfiguration({ tenantId, state });
  const tenant = config.tenant || 'common';

  const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token/`;
  const baseParams = {
    client_id: config.clientId,
    client_secret: OAuth.openSecret(config.secret),
    redirect_uri: OAuth._redirectUri('azureAd', config, null, null, rootUrlFromRequest),
  };
  const requestBody = Object.assign({}, baseParams, additionalRequestParams);
  const response = AzureAd.http.call('POST', url, { params: requestBody });

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresIn: response.expires_in,
    expiresOn: response.expires_on,
    scope: response.scope,
    resource: response.resource,
  };
};
