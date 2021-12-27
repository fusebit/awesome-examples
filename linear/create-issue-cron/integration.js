// Fusebit Linear Integration
//
// This simple Linear integration allows you to call Linear APIs on behalf of the tenants of your
// application. Fusebit manages the Linear authorization process and maps tenants of your application
// to their Linear credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model
const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from within your application.
const router = integration.router;

const connectorName = 'linearConnector';
const cronStorageKey = 'linear-cron-key';

// Add a tenant to the cron task, supplying an array of Team Keys as a body argument
router.post('/api/cron/tenant/:tenantId', async (ctx) => {
  const storageItem = await integration.storage.getData(ctx, cronStorageKey);
  const data = storageItem ? storageItem.data : {};
  const linearSdk = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const tenantTeamIds = await Promise.all(
    ctx.req.body.teamKeys.map(async (teamKey) => {
      const team = await linearSdk.teams({
        filter: {
          key: {
            eq: teamKey,
          },
        },
      });
      return team.nodes[0].id;
    })
  );

  data[ctx.params.tenantId] = tenantTeamIds;
  await integration.storage.setData(ctx, cronStorageKey, { data });
  ctx.body = data;
});

// Remove a tenant from the cron task
router.delete('/api/cron/tenant/:tenantId', async (ctx) => {
  const storageItem = await integration.storage.getData(ctx, cronStorageKey);
  const data = storageItem ? storageItem.data : {};
  delete data[ctx.params.tenantId];
  await integration.storage.setData(ctx, cronStorageKey, { data, version: storageItem.version });
  ctx.body = data;
});

// Remove all tenants from the cron task
router.delete('/api/cron/tenant', async (ctx) => {
  await integration.storage.setData(ctx, cronStorageKey, { data: {} });
  ctx.body = [];
});

// List the tenants used in the cron task
router.get('/api/cron/tenant', async (ctx) => {
  const storageItem = await integration.storage.getData(ctx, cronStorageKey);
  const tenantIds = Object.keys(storageItem.data || {});
  ctx.body = tenantIds;
});

// Execute the cron task
integration.cron.on('/create_linear_issue', async (ctx) => {
  const title = `Fusebit Generated Issue: ${new Date().toDateString()}`;

  const storageItem = await integration.storage.getData(ctx, cronStorageKey);
  const data = storageItem ? storageItem.data : {};

  const result = await Promise.allSettled(
    Object.entries(data).map(async ([tenantId, teamIds = []]) => {
      const linearSdk = await integration.tenant.getSdkByTenant(ctx, connectorName, tenantId);
      return teamIds.map((teamId) => {
        return linearSdk.issueCreate({
          title,
          teamId,
        });
      });
    })
  );

  console.log('Cron Result: ', result);
});

module.exports = integration;
