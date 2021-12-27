const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

const router = integration.router;

const hubspotConnector = 'hubspotConnector';
const sfdcConnector = 'my-connector-734';

router.post('/api/tenant/:tenantId/sync', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const hubspotClient = await integration.tenant.getSdkByTenant(ctx, hubspotConnector, ctx.params.tenantId);
  const sfdcClient = await integration.tenant.getSdkByTenant(ctx, sfdcConnector, ctx.params.tenantId);
  const contacts = await hubspotClient.crm.contacts.getAll();
  await Promise.all(
    contacts.map(async (contact) => {
      const res = await sfdcClient.sobject('Contact').create({
        LastName: contact.properties.lastname,
        Email: contact.properties.email,
        FirstName: contact.properties.firstname,
      });
    })
  );
  ctx.body = `Successfully performed initial import from hubSpot to SFDC.`;
});

integration.event.on('/:componentName/webhook/:eventtype', async (ctx) => {
  const hubspotClient = await integration.service.getSdk(ctx, hubspotConnector, ctx.req.body.installIds[0]);
  const sfdcClient = await integration.service.getSdk(ctx, sfdcConnector, ctx.req.body.installIds[0]);
  const contact = await hubspotClient.crm.contacts.basicApi.getById(ctx.req.body.data.objectId);
  await sfdcClient.sobject('Contact').create({
    LastName: contact.properties.lastname,
    Email: contact.properties.email,
    FirstName: contact.properties.firstname,
  });
});

module.exports = integration;
