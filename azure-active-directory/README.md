# azure-active-directory

An implementation of the Azure Active Directory OAuth 2.0 flow.

This package is forked from the original djluck/azure-active-directory.

## Usage

### Single Tenant
If you are using this package for single tenant (i.e only your organization) you just need to add
the following service configuration.

```js
ServiceConfiguration.configuration.insert({
    "_id": "_id",
    "service": "azureAd",
    "clientId": "client_id",
    "secret": "secret_key",
    "tenantId": "tenant_id",
    "loginStyle": "popup or redirect",
})
```

Then, make sure to have this information on the client and log in with `Meteor.loginWithAzure`.

### Multitenant
If you want to use it for multiple organizations, you need to implement it in the following way:

- Create a collection to store the configurations for each domain.
- Publish to the client the configuration you want.
- Overwrite `OAuth._stateParam` to accept additional things to add to the state (like tenantId).
- Call `loginWithAzure({ config: { ...configHere } })`
- On the server, overwrite `AzureAd.getConfiguration({ tenantId, state })` where in this case `tenantId` will be null
- Then you need to decode the `state base 64` string and get the `tenantId` from it.

Example: 
```js
AzureAd.getConfiguration = ({ tenantId, state: stateBase64 }) => {
    try {
        const decodedString = !tenantId && Buffer.from(stateBase64, 'base64').toString('utf-8');
        const { tenantId: tenantIdFromState } = JSON.parse(decodedString);
        const config = SSOConfigs.findOne({ tenant_id: tenantId || tenantIdFromState });

        return {
            ...config,
            tenantId: config.tenant_id,
            tenant: config.tenant_id,
            clientId: config.client_id,
        };
    } catch (e) {
        console.error('ERROR DECODING SSO STATE');
        throw e;
    }
};
```
