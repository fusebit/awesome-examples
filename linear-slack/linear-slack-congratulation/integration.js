const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

const slackConnector = 'slack-e2e-linear';

integration.event.on('/:componentName/webhook/:eventtype', async (ctx) => {
  if (ctx.params.eventtype === 'Issue.update' && ctx.req.body.data.data.state.name === 'Done') {
    const slackClient = await integration.service.getSdk(ctx, slackConnector, ctx.req.body.installIds[0]);
    const result = await slackClient.chat.postMessage({
      text: `Congratulations, ${ctx.req.body.data.data.assignee.name} for completing a new issue!`,
      channel: 'bot-linear',
    });
  }
});

module.exports = integration;
