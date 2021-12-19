// Fusebit GitHub Integration
//
// This simple GitHub integration allows you to call GitHub APIs on behalf of the tenants of your
// application. Fusebit manages the GitHub authorization process and maps tenants of your application
// to their GitHub credentials, so that you can focus on implementing the integration logic.
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
const connectorName = 'githubappConnector';

// TODO: Replace the below value with the owner id and repos id of the desired repos
const ownerId = 'REPLACE WITH OWNER NAME';
const reposId = 'REPLACE WITH REPOSITORY NAME';
const branchPrefix = 'client-';
const targetBranch = 'main';

integration.event.on(`/${connectorName}/webhook/branch.created`, async (ctx) => {
  const { data: event } = ctx.req.body.data;
  const branchRef = event.ref;

  // Branch refs are of format `refs/heads/{branchName}`
  const branchName = branchRef.split('/').slice(2).join('/');

  if (branchName.startsWith(branchPrefix)) {
    const githubClient = await integration.service.getSdk(ctx, connectorName, ctx.req.body.installIds[0]);
    const userClient = githubClient.user();

    await userClient.rest.pulls.create({
      title: `Fusebit Generated PR from ${branchName}`,
      head: branchName,
      base: targetBranch,
      owner: ownerId,
      repo: reposId,
    });
  }
});

module.exports = integration;
