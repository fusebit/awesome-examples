# A Utility Fusebit Function for Sharing Integrations

## Description

### Link Sharing

This utility function allows, with a single url, a user to share an integration in a read-only mode, but with
run support, with the public through a single link.

If the browser is sent to this
[url](https://api.us-west-1.on.fusebit.io/v1/run/sub-c2eaf0578e7140ca/share/share/edit?integrationId=so-70392539): `/edit?integrationId=so-70392539`, the browser is redirected to a view of the Fusebit Editor which allows them to observe and press the Run button for the integration. This works for any integration that's published to the same account that this function is published to.

#### Tenant ID Adjustment

The default tenant ID for an install or an identity is based on the `usr-123456` of the logged in user.
However, when sharing via this tool, the tenant ID used will be `user-1`.  Use the `setTenantId.mjs` script to
change the tenant ID for an identity and install pair to match:

```
Set the tenantId for an install and an identity to `user-1`.

Usage: ./setTenantId.mjs [integrationId] [ins-123456] [connectorId] [idn-123456]
```

Example:
```
$ ./setTenantId.mjs so-70392539 ins-af929a06df9f44ea1e157659907a1d74 so-70392539 idn-b4fbf6ab95824c3d73f65d2cfda953a8
```

### Pre-made Sharing

If an integration is created to solve a problem on Stack Overflow, [loading](https://api.us-west-1.on.fusebit.io/v1/run/sub-c2eaf0578e7140ca/share/share/stackoverflow?integrationId=so-70392539&format=0):
`/stackoverflow?integrationId=so-70392539&format=0` (or `format=1`) will return a sample Stack Overflow
markdown blob, suitable for pasting into an answer.

#### Format #0:

##### Example Markdown

````
| Example Implementation |
| ---- |
```
const { Integration } = require("@fusebit-int/framework");

const integration = new Integration();
const router = integration.router;

router.post("/api/tenant/:tenantId/test", async (ctx) => {
  ctx.body = `Hello World: ${ctx.params.tenantId}`;
});

module.exports = integration;

```
|<a href="https://api.us-west-1.on.fusebit.io/v1/run/sub-c2eaf0578e7140ca/share/share/edit?integrationId=so-70392539"><kbd>View in Fusebit <img src="https://cdn.fusebit.io/assets/logo/logo-orange.png" width="15" height="15"></kbd></a> |
| ----: |
````

##### Example Rendering

![image](https://user-images.githubusercontent.com/3607121/146102320-e5eeb447-493d-4a96-83cb-507b4669e189.png)

#### Format #1:

##### Example Markdown

````
| Example Implementation &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<a href="https://api.us-west-1.on.fusebit.io/v1/run/sub-c2eaf0578e7140ca/share/share/edit?integrationId=so-70392539"><kbd>View in Fusebit <img src="https://cdn.fusebit.io/assets/logo/logo-orange.png" width="15" height="15"></kbd></a> |
| ---- | ---: |
```
const { Integration } = require("@fusebit-int/framework");

const integration = new Integration();
const router = integration.router;

router.post("/api/tenant/:tenantId/test", async (ctx) => {
  ctx.body = `Hello World: ${ctx.params.tenantId}`;
});

module.exports = integration;

```
````

##### Example Rendering

![image](https://user-images.githubusercontent.com/3607121/146102421-66520208-6d8d-47c9-b373-ea09d7a8082b.png)

# Deployment

```
yarn deploy
```
