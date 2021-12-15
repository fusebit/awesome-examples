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

## Deployment

```
yarn deploy
```
