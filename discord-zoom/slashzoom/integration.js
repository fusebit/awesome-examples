const { Integration } = require('@fusebit-int/framework');
const superagent = require('superagent');

const integration = new Integration();

const router = integration.router;
const discordConnector = 'discord';
const zoomConnector = 'zoom'

// Create a new global command. New global commands will be available in all guilds after 1 hour.
router.post('/api/tenant/:tenantId/slash-command', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const discordSdk = await integration.tenant.getSdkByTenant(ctx, discordConnector, ctx.params.tenantId);
  const command = {
    name: 'zoom1',
    type: 1,
    description: 'Create a zoom meeting',
  };
  const response = await discordSdk.bot.post(
    `/v8/applications/${discordSdk.fusebit.credentials.applicationId}/commands`,
    command
  );
  ctx.body = response;
});

// Respond to a Slash command
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  const {
    data: { data: event },
  } = ctx.req.body;
  const {
    data: { application_id, token },
  } = ctx.req.body;

  const zoomSdk = await integration.service.getSdk(ctx, zoomConnector, ctx.req.body.installIds[0])
  const meeting = await zoomSdk.post('/users/me/meetings', {
    type: 1,
    pre_schedule: false,
    duration: 60,
    default_password: true
  })
  await superagent.post(`https://discord.com/api/v8/webhooks/${application_id}/${token}`).send({
    content: meeting.start_url,
  });
});

module.exports = integration;
