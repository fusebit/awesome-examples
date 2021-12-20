const { Integration } = require('@fusebit-int/framework');
const superagent = require('superagent');

const integration = new Integration();
const router = integration.router;

const asanaConnectorName = 'asanaConnector';
const discordConnectorName = 'discordConnector';

// Create a Webhook when a new task is added from a specific project
router.post('/api/tenant/:tenantId/webhooks', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const asanaClient = await integration.tenant.getSdkByTenant(ctx, asanaConnectorName, ctx.params.tenantId);
  const me = await asanaClient.users.me();
  const workspace = me.workspaces[0].gid;
  const projects = await asanaClient.projects.getProjects({ workspace });
  // Pick resource to receive events for
  const projectName = 'Demo Project';
  const selectedProject = projects.data.filter((d) => d.name === projectName);

  if (selectedProject.length) {
    const asanaWebhookClient = await integration.webhook.getSdkByTenant(ctx, asanaConnectorName, ctx.params.tenantId);
    const webhook = await asanaWebhookClient.create(selectedProject[0].gid, {
      filters: [
        {
          action: 'added',
          resource_type: 'task',
        },
      ],
    });
    ctx.body = webhook;
  }
});

// Subscribe to the webhook event
integration.event.on('/asanaConnector/webhook/added', async (ctx) => {
  const discordClient = await integration.service.getSdk(ctx, discordConnectorName, ctx.req.body.installIds[0]);
  // Check if there is a channel webhook configured, otherwise we can't publish to Discord
  if (!discordClient.fusebit.credentials.webhook) {
    return;
  }
  const {
    user,
    parent,
    resource: { resource_type, gid },
  } = ctx.req.body.data;
  // Ensure this event is for a task created from a project
  if (resource_type !== 'task' && parent.resource_type !== 'project') {
    return;
  }
  const asanaClient = await integration.service.getSdk(ctx, asanaConnectorName, ctx.req.body.installIds[0]);
  // Get information about the created task
  const task = await asanaClient.tasks.getTask(gid);
  if (!task) {
    return;
  }

  // Get information about the user that created the task
  const taskCreatedByUser = await asanaClient.users.getUser(user.gid);
  // Publish to discord the newly created task
  const projectId = task.projects[0].gid;
  const taskId = task.gid;
  const taskUrl = `https://app.asana.com/0/${projectId}/${taskId}/f`;
  await superagent.post(discordClient.fusebit.credentials.webhook.url).send({
    embeds: [
      {
        type: 'rich',
        title: ':pencil: New Asana task created',
        description: `${task.name}`,
        color: 0xff00b3,
        url: taskUrl,
        fields: [
          {
            name: 'Created by',
            value: taskCreatedByUser.name,
          },
        ],
      },
    ],
  });
});

module.exports = integration;
