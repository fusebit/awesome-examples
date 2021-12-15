# A Utility Fusebit Function for Sharing Integrations

## Description

### Link Sharing

This utility function allows, with a single url, a user to share an integration in a read-only mode, but with
run support, with the public through a single link.

If the browser is sent to this
[url](https://api.us-west-1.on.fusebit.io/v1/run/sub-025ba376ff9d4ec5/share/share/edit?integrationId=sampleIntegration): `/edit?integrationId=sampleIntegration`, the browser is redirected to a view of the Fusebit Editor which allows them to observe and press the Run button for the integration.  This works for any integration that's published to the same account that this function is published to.

### Pre-made Sharing

If an integration is created to solve a problem on Stack Overflow, [loading](https://api.us-west-1.on.fusebit.io/v1/run/sub-025ba376ff9d4ec5/share/share/stackoverflow?integrationId=sampleIntegration&format=0):
`/stackoverflow?integrationId=sampleIntegration&format=0` (or `format=1`) will return a sample Stack Overflow
markdown blob, suitable for pasting into an answer.

*Note*: Make sure you add the `javascript` tag to the answer so that the formatting works right.

Format #0:

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
|<a href="https://fusebit.io"><kbd>View in Fusebit <img src="https://cdn.fusebit.io/assets/logo/logo-orange.png" width="15" height="15"></kbd></a> |
| ----: |
````
![image](https://user-images.githubusercontent.com/3607121/146102320-e5eeb447-493d-4a96-83cb-507b4669e189.png)

Format #1:

````
| Example Implementation &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<a href="https://api.us-west-1.on.fusebit.io/v1/run/sub-025ba376ff9d4ec5/share/share/edit?integrationId=sampleIntegration"><kbd>View in Fusebit <img src="https://cdn.fusebit.io/assets/logo/logo-orange.png" width="15" height="15"></kbd></a> |
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

![image](https://user-images.githubusercontent.com/3607121/146102421-66520208-6d8d-47c9-b373-ea09d7a8082b.png)

# Deployment

```
yarn deploy
```
