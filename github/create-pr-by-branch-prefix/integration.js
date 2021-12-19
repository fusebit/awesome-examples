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

router.post('/api/tenant/:tenantId/pr/batch', async (ctx) => {
  const githubClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const userClient = githubClient.user();

  console.log('Fetching branches...');
  const branches = await userClient.paginate(userClient.rest.repos.listBranches, {
    owner: ownerId,
    repo: reposId,
  });

  console.log(`Filtering ${branches.length} retrieved branches`);
  const prefixedBranches = branches.filter((branch) => branch.name.startsWith(branchPrefix));
  console.log(`${prefixedBranches.length} branches match the filter`);

  console.log('Creating pull requests...');
  const result = await Promise.allSettled(
    prefixedBranches.map((branch) => {
      return userClient.rest.pulls.create({
        title: `Fusebit Generated PR from ${branch.name}`,
        head: branch.name,
        base: targetBranch,
        owner: ownerId,
        repo: reposId,
      });
    })
  );

  console.log('Done!');
  ctx.body = result;
});

module.exports = integration;
