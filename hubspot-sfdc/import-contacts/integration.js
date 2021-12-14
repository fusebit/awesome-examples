const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

const router = integration.router;

const connectorName = 'hubspotConnector';

router.post('/api/tenant/:tenantId/sync', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const hubspotClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const sfdcClient = await integration.tenant.getSdkByTenant(ctx, 'my-connector-734', ctx.params.tenantId);
  const contacts = await hubspotClient.crm.contacts.getAll();
  await Promise.all(contacts.map(async (contact) => {
    const res = await sfdcClient.sobject('Contact').create({LastName: contact.properties.lastname || 'Super Cool Name', Email: contact.properties.email, FirstName: contact.properties.firstname})
  }))
  ctx.body = `Successfully performed initial import from hubSpot to SFDC.`;
});

integration.event.on('/:componentName/webhook/:eventtype', async (ctx) => {
    const hubspotClient = await integration.service.getSdk(ctx, connectorName, ctx.req.body.installIds[0])
    const sfdcClient = await integration.service.getSdk(ctx, 'my-connector-734', ctx.req.body.installIds[0]);
    const contacts = await hubspotClient.crm.contacts.getAll();
    await Promise.all(contacts.map(async (contact) => {
      try {
        const res = await sfdcClient.sobject('Contact').create({LastName: contact.properties.lastname || 'Super Cool Name', Email: contact.properties.email, FirstName: contact.properties.firstname})
      } catch (_) {}
    }))
});

module.exports = integration;
