const { Integration } = require('@fusebit-int/framework');

const { renderGraph } = require('./renderGraph');
const { isDone, iterate, getItems, cleanup } = require('./chunked');

const integration = new Integration();

const router = integration.router;

const connectorName = 'linearConnector';

/* Utility function to do a bunch of processing to get the number of estimated points closed per user per cycle. */
const getCycleEstimates = async (ctx, tenantId, taskId) => {
  const [issues, linearClient] = await Promise.all([
    getItems(ctx, tenantId, taskId),
    integration.tenant.getSdkByTenant(ctx, connectorName, tenantId),
  ]);

  let [cycles, users] = await Promise.all([linearClient.cycles(), linearClient.users()]);

  cycles = cycles.nodes;
  users = users.nodes;

  // Pivot the data to record the number of tickets resolved per cycle per user
  const idToNumber = {};
  cycles.forEach((cycle) => (idToNumber[cycle.id] = cycle.number));

  const assigneeCycleCount = {};

  issues.forEach((issue) => {
    if (!issue._assignee?.id || !issue._cycle?.id || !issue.estimate) {
      return;
    }
    const assignee = (assigneeCycleCount[issue._assignee.id] = assigneeCycleCount[issue._assignee.id] || []);
    assignee[idToNumber[issue._cycle.id]] = (assignee[idToNumber[issue._cycle.id]] || 0) + issue.estimate;
  });

  const result = {};
  Object.entries(assigneeCycleCount).forEach(([id, values]) => {
    result[users.find((user) => user.id == id).displayName] = values;
  });

  return result;
};

/* Return a png showing the individual contributions per cycle. */
router.get('/api/tenant/:tenantId/task/:taskId/graph', async (ctx) => {
  const estimates = await getCycleEstimates(ctx, ctx.params.tenantId, ctx.params.taskId);

  // Create data in the format that renderGraph expects
  const table = [];
  let personIdx = 0;
  Object.entries(estimates).forEach(([name, values]) => {
    let idx = 0;
    // Iterate through sparse array
    for (let idx = 0; idx < values.length; idx++) {
      table.push({ x: idx, y: values[idx] || 0, c: personIdx });
    }
    personIdx = personIdx + 1;
  });

  // Render a png graph into a buffer
  const buffer = await renderGraph(table);

  ctx.body = buffer;
  ctx.set('Content-Type', 'image/png');
});

/* Report on the completion of a particular data loading task. */
router.get('/api/tenant/:tenantId/task/:taskId/status', async (ctx) => {
  ctx.body = { done: await isDone(ctx, ctx.params.tenantId, ctx.params.taskId) };
});

/* Clean up data that's no longer needed. */
router.delete('/api/tenant/:tenantId/task/:taskId', async (ctx) => {
  ctx.body = { deleted: await cleanup(ctx, ctx.params.tenantId, ctx.params.taskId) };
});

// Support a paginated-load of all of the issues in Linear.
router.post('/api/tenant/:tenantId/task/', async (ctx) => {
  const linearClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const url = ctx.state.params.baseUrl + `/api/tenant/${ctx.params.tenantId}/task/`;

  console.log(`Running task... ${JSON.stringify(ctx.query)}`);

  const taskId = await iterate(ctx, ctx.params.tenantId, url, async (cursor) => {
    let issues = await linearClient.issues({
      filter: {
        state: { name: { eq: 'Done' } },
      },
      after: cursor,
      first: 250,
    });
    console.log(`Loaded ${issues.nodes.length} issues...`);
    return { items: issues.nodes, cursor: issues.pageInfo.endCursor };
  });

  ctx.body = { taskId };
});

module.exports = integration;
