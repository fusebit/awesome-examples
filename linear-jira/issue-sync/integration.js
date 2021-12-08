const { NodeHtmlMarkdown } = require('node-html-markdown');
const nhm = new NodeHtmlMarkdown();
const md2adf = require('md-to-adf');

const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

const jiraConnectorName = 'Jira-Sync-Connector';
const linearConnectorName = 'Linear-Sync-Connector';

integration.router.get('/api/:tenantId/webhooks', async (ctx) => {
  const atlassianClient = await integration.tenant.getSdkByTenant(ctx, jiraConnectorName, ctx.params.tenantId);
  const atlassianWebhookClient = await integration.webhook.getSdkByTenant(ctx, jiraConnectorName, ctx.params.tenantId);

  const resources = await atlassianClient.getAccessibleResources('jira');
  const jiraCloud = resources[0];
  const webhooks = await atlassianWebhookClient.list(jiraCloud.id);
  ctx.body = webhooks;
});

integration.router.post('/api/:tenantId/webhooks', async (ctx) => {
  const atlassianClient = await integration.tenant.getSdkByTenant(ctx, jiraConnectorName, ctx.params.tenantId);
  const atlassianWebhookClient = await integration.webhook.getSdkByTenant(ctx, jiraConnectorName, ctx.params.tenantId);

  const resources = await atlassianClient.getAccessibleResources('jira');
  const jiraCloud = resources[0];

  // Remove any existing webhooks while testing
  await atlassianWebhookClient.deleteAll(jiraCloud.id);

  // Define the webhooks you want to register (https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-webhooks/#api-rest-api-3-webhook-post)
  const webhookDetails = [ { "jqlFilter":'project = "FD"', "events": [ "jira:issue_created", "jira:issue_updated" ] } ];

  // Use our Fusebit Webhook SDK to register webhooks, we will automatically configure the Webhook URL for you
  await atlassianWebhookClient.create(jiraCloud.id, webhookDetails);
  // Verify existing webhooks, and return them
  const webhooks = await atlassianWebhookClient.list(jiraCloud.id);
  ctx.body = webhooks;
});

const Constants = {
  jiraToLinearFieldMap: {
    summary: 'title',
    description: 'description'
  },
  linearToJiraFieldMap: {
    title: 'summary',
    description: 'description'
  },
  Types: {
    Issues: {
      updated: 0,
      created: 1
    }
  }
};
Constants.linearTypeMap = {
  'jira:issue_updated': Constants.Types.Issues.updated,
  'jira:issue_created': Constants.Types.Issues.created
};
Constants.jiraTypeMap = {
  'Issue.update': Constants.Types.Issues.updated,
  'Issue.create': Constants.Types.Issues.created
}

const WebhookUtilities = {
  getJiraClient: async function(ctx) {
    const atlassianClient = await integration.service.getSdk(ctx, jiraConnectorName, ctx.req.body.installIds[0]);
    const resources = await atlassianClient.getAccessibleResources('jira');
    if (resources.length === 0) {
      ctx.throw(404, 'No Matching Account found in Atlassian');
    }
    const jiraCloud = resources[0];
    this.cachedJiraClient = atlassianClient.jira(jiraCloud.id);
    return this.cachedJiraClient;
  },
  getLinearClient: async function (ctx) {
    return await integration.service.getSdk(ctx, linearConnectorName, ctx.req.body.installIds[0]);
  },

  associateItems: async (ctx, type, linearItem, jiraItem) => {
    const data = {
      linearItem,
      jiraItem,
      type
    }
    return await Promise.all([
      integration.storage.setData(ctx, linearItem.id, {data}),
      integration.storage.setData(ctx, jiraItem.id, {data}),
    ]);
  },
  getAssociatedItems: async (ctx, id) => {
    return await integration.storage.getData(ctx, id) || { data: {} };
  },

  normalizeJiraEvent: async function(ctx, type, jiraItem, event = false) {
    let itemData = jiraItem;
    const normalizedItem = {};
    if (event) {
      itemData = jiraItem.issue;
      normalizedItem.changelog = jiraItem.changelog.items
    }

    switch (type) {
      case Constants.Types.Issues.created:
      case Constants.Types.Issues.updated:
        const jiraClient = await this.getJiraClient(ctx);
        const fetchedJiraItem = await jiraClient.get(`/issue/${itemData.id}?expand=renderedFields`);
        const renderedDescription = fetchedJiraItem.renderedFields.description;
        const markdownDescription = nhm.translate(renderedDescription);
        fetchedJiraItem.description = markdownDescription;
        Object.assign(normalizedItem, {
          summary: fetchedJiraItem.fields.summary,
          description: fetchedJiraItem.description,
          id: fetchedJiraItem.id,
        })
        return normalizedItem;
      default:
        console.log('event type not recognized');
        break;
    }
  },
  normalizeLinearEvent: async (ctx, type, linearItem, event = false) => {
    let itemData = linearItem;
    const normalizedItem = {};

    if (event) {
      normalizedItem.updatedFrom = linearItem.updatedFrom;
      itemData = linearItem.data;
    }
    Object.assign(normalizedItem, {
      title: itemData.title,
      description: itemData.description,
      id: itemData.id
    });
    return normalizedItem;
  },

  refreshLinearItem: async function (ctx, type, id) {
    const linearClient = await this.getLinearClient(ctx);
    const rawLinearIssues = await linearClient.issues()
    return rawLinearIssues.nodes.find(issue => {
      return issue.id === id;
    });
  },
  refreshJiraItem: async function (ctx, type, id) {
    const jiraClient = await this.getJiraClient(ctx);
    switch (type) {
      case Constants.Types.Issues.created:
      case Constants.Types.Issues.updated:
        const fetchedJiraItem =  await jiraClient.get(`/issue/${id}?expand=renderedFields`);
        const renderedDescription = fetchedJiraItem.renderedFields.description;
        const markdownDescription = nhm.translate(renderedDescription);
        fetchedJiraItem.description = markdownDescription;
        return {
          summary: fetchedJiraItem.fields.summary,
          description: fetchedJiraItem.fields.description,
          id: fetchedJiraItem.id,
        };
      default:
        console.log('unknown event type');
        return;
    }
  },

  hasChanges: async function(ctx, newLinearItem, newJiraItem) {
    // only update inside webhooks if there is a difference between the two issues.
    // this is necessary to prevent infinite update loops
    const { data } = await this.getAssociatedItems(ctx, newLinearItem.id);
    const { linearItem, jiraItem } = data;
    if (!linearItem || !jiraItem) {
      return true;
    }
    const titleUpdated = linearItem.title !== newLinearItem.title || jiraItem.summary !== newJiraItem.summary;
    const linearDescriptionUpdated = linearItem.description !== newLinearItem.description
    const jiraDescriptionUpdated = JSON.stringify(jiraItem.description) !== JSON.stringify(newJiraItem.description);
    return titleUpdated || linearDescriptionUpdated || jiraDescriptionUpdated;
  },
  createLinearChangeObject: async (jiraItem) => {
    return jiraItem.changelog.reduce((acc, cur) => {
      acc[Constants.jiraToLinearFieldMap[cur.field]] = jiraItem[cur.field];
      return acc;
    }, {});
  },
  createJiraChangeObject: async (linearItem) => {
    const fields = Object.keys(linearItem.updatedFrom || Constants.linearToJiraFieldMap);
    return fields.reduce((acc, cur) => {
      if (Constants.linearToJiraFieldMap[cur]) {
        acc[Constants.linearToJiraFieldMap[cur]] = linearItem[cur];
      }
      if (cur === 'description') {
        acc['description'] = md2adf(linearItem.description);
      }
      return acc;
    }, {});
  },

  updateJiraItem: async function (ctx, type, linearItem, jiraItem) {
    const hasChanges = await this.hasChanges(ctx, linearItem, jiraItem);
    if (!hasChanges) {
      console.log('no changes to propagate');
      return;
    }
    const jiraClient = await this.getJiraClient(ctx);
    switch (type) {
      case Constants.Types.Issues.created:
      case Constants.Types.Issues.updated:
        const updates = await this.createJiraChangeObject(linearItem);
        jiraClient.put(`/issue/${jiraItem.id}`, { fields: updates })
        break;
      default:
        console.log('unknown update type');
        break;
    }
    const refreshedJiraItem = await this.refreshJiraItem(ctx, type, jiraItem.id);
    const normalizedJiraItem = await this.normalizeJiraEvent(ctx, type, refreshedJiraItem);
    return await this.associateItems(ctx, type, linearItem, normalizedJiraItem);
  },
  updateLinearItem: async function (ctx, type, linearItem, jiraItem) {
    const linearClient = await integration.service.getSdk(ctx, linearConnectorName, ctx.req.body.installIds[0]);

    // quit out if no changes exist
    const hasChanges = await this.hasChanges(ctx, linearItem, jiraItem);
    if (!hasChanges) {
      console.log('no changes, quitting');
      return;
    }
    const updates = await this.createLinearChangeObject(jiraItem);
    switch (type) {
      case Constants.Types.Issues.created:
      case Constants.Types.Issues.updated:
        await linearClient.issueUpdate(linearItem.id, updates);
        break;
      default:
        console.log('event type unrecognized');
        break;
    }
    const refreshedLinearItem = await this.refreshLinearItem(ctx, type, linearItem.id);
    const normalizedLinearItem = await this.normalizeLinearEvent(ctx, type, refreshedLinearItem);
    return await this.associateItems(ctx, type, normalizedLinearItem, jiraItem);
  },

  findMatchingJiraItem: async function (ctx, type, linearItem) {
    const jiraClient = await this.getJiraClient(ctx);
    switch (type) {
      case Constants.Types.Issues.created:
      case Constants.Types.Issues.updated:
        const jql = encodeURIComponent(`summary ~ "${linearItem.title}"`);
        const jiraIssueRaw = await jiraClient.get(`/search?jql=${jql}`);
        if (!jiraIssueRaw.issues || !jiraIssueRaw.issues.length) {
          console.log('no matching issue found')
          return;
        }
        return await this.normalizeJiraEvent(ctx, type, jiraIssueRaw.issues[0], false);
      default:
        return;
    }
  },
  findMatchingLinearItem: async function (ctx, type, jiraItem) {
    const linearClient = await this.getLinearClient(ctx);
    switch (type) {
      case Constants.Types.Issues.created:
      case Constants.Types.Issues.updated:
        const rawLinearIssues = await linearClient.issues();
        const summaryChangelogEntry = jiraItem.changelog.find(change => change.field === 'summary');
        return rawLinearIssues.nodes.find(issue => {
          if (summaryChangelogEntry && !!summaryChangelogEntry.fromString) {
            return issue.title === summaryChangelogEntry.fromString;
          }
          return issue.title === jiraItem.summary;
        });
      default:
        return {};
    }
  }
}

integration.event.on(`/:connectorName/webhook/:eventType`, async (ctx, next) => {
  console.log('event log: ', {...ctx.params});
  next();
});

const handleLinearIssue = (type) => async (ctx) => {
  try {
    // normalize incoming data
    const linearItem = await WebhookUtilities.normalizeLinearEvent(ctx, type, ctx.req.body.data, true);

    // retrieve data in storage
    const { data: storageItem } = await WebhookUtilities.getAssociatedItems(ctx, linearItem.id);
    let { jiraItem } = storageItem;

    // create entry if none exists
    if (!jiraItem) {
      jiraItem = await WebhookUtilities.findMatchingJiraItem(ctx, type, linearItem);
    }

    if (!jiraItem) {
      console.log('no matching jira item');
      return;
    }

    // push updates to jira
    await WebhookUtilities.updateJiraItem(ctx, type, linearItem, jiraItem);
  } catch (e) {
    console.error(e);
  }
}
integration.event.on(`/${linearConnectorName}/webhook/Issue.update`, handleLinearIssue(Constants.Types.Issues.updated));
integration.event.on(`/${linearConnectorName}/webhook/Issue.create`, handleLinearIssue(Constants.Types.Issues.created))

const handleJiraIssue = (type) => async (ctx) => {
  try {
    // normalize incoming data
    const jiraItem = await WebhookUtilities.normalizeJiraEvent(ctx, type, ctx.req.body.data, true);

    // retrieve data in storage
    const { data: storageItem } = await WebhookUtilities.getAssociatedItems(ctx, jiraItem.id);
    let { linearItem } = storageItem;

    // create entry if none exists
    if (!linearItem) {
      linearItem = await WebhookUtilities.findMatchingLinearItem(ctx, type, jiraItem);
      if (!linearItem) {
        ctx.throw('no linear items found');
        return;
      }
    }

    // push updates to jira
    await WebhookUtilities.updateLinearItem(ctx, type, linearItem, jiraItem);
  } catch (e) {
    console.log('jira webhook error: ', e)
  }
}
integration.event.on(`/${jiraConnectorName}/webhook/jira\\:issue_updated`, handleJiraIssue(Constants.Types.Issues.updated));
integration.event.on(`/${jiraConnectorName}/webhook/jira\\:issue_created`, handleJiraIssue(Constants.Types.Issues.created));

integration.router.get('/api/testDeploy', async (ctx) => {
  ctx.body = {updated: true}
})
module.exports = integration;
