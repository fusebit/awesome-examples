const superagent = require('superagent');

const fusebitPortal = 'https://manage.fusebit.io/callback';

const integrationsFeedUrl = 'http://manage.fusebit.io/feed/connectorsFeed.json';

module.exports = async (ctx) => {
  switch (ctx.path.toLowerCase()) {
    case '/edit':
      return renderEdit(ctx);
    case '/stackoverflow':
      return renderStackOverflow(ctx);
    case '/integrationsfeed.json':
      return createIntegrationFeedEntry(ctx);
    default:
      return {
        body: Buffer.from('Select either /edit or /stackoverflow').toString('base64'),
        bodyEncoding: 'base64',
        headers: { 'Content-Type': 'text/plain' },
      };
  }
};

const getApiPath = (ctx) => `${ctx.fusebit.endpoint}/v2/account/${ctx.accountId}/subscription/${ctx.subscriptionId}`;

const getIntegrationPath = (ctx) => `${getApiPath(ctx)}/integration/${ctx.query.integrationId}`;

const getConnectorPath = (ctx, connectorId) => `${getApiPath(ctx)}/connector/${connectorId}`;

const getForkQueryString = (ctx) => `forkEditFeedUrl=${ctx.baseUrl}/integrationsFeed.json?integrationId=${ctx.query.integrationId}`;

const getEditUrl = (ctx) => `${ctx.baseUrl}/edit?integrationId=${ctx.query.integrationId}`;

const renderEdit = (ctx) => {
  const url = new URL(fusebitPortal);

  const integrationPath = `/account/${ctx.accountId}/subscription/${ctx.subscriptionId}/integration/${ctx.query.integrationId}/edit?${getForkQueryString(ctx)}`;

  url.searchParams.set('silentAuth', false);
  url.searchParams.set('requestedPath', integrationPath);
  url.searchParams.set('scope', 'openid profile email');
  url.searchParams.set('expires_in', '86400');
  url.searchParams.set('token_type', 'Bearer');
  url.hash = `#access_token=${ctx.fusebit.functionAccessToken}`;

  return { status: 302, headers: { location: url.toString() }, body: { targetUrl: url.toString() } };
};

const format = [
  {
    header: '| Example Implementation |\n| ---- |',
    footer:
      '|<a href="{{ENTITY_URL}}"><kbd>View in Fusebit <img src="https://cdn.fusebit.io/assets/logo/logo-orange.png" width="15" height="15"></kbd></a> |\n| ----: |',
  },
  {
    header:
      '| Example Implementation &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<a href="{{ENTITY_URL}}"><kbd>View in Fusebit <img src="https://cdn.fusebit.io/assets/logo/logo-orange.png" width="15" height="15"></kbd></a> |\n| ---- | ---: |',
    footer: '',
  },
];

const renderStackOverflow = async (ctx, integrationId) => {
  const url = `${ctx.fusebit.endpoint}/v2/account/${ctx.accountId}/subscription/${ctx.subscriptionId}/integration/${ctx.query.integrationId}`;
  const entity = await superagent.get(url).set('Authorization', `Bearer ${ctx.fusebit.functionAccessToken}`);

  const fmt = ctx.query.format !== undefined ? format[ctx.query.format] : format[1];

  const result = [fmt.header, '``` javascript', `${entity.body.data.files['integration.js']}`, '```', fmt.footer]
    .join('\n')
    .replace('{{ENTITY_URL}}', getEditUrl(ctx));

  return {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
    bodyEncoding: 'base64',
    body: Buffer.from(result).toString('base64'),
  };
};

const getIntegrationEntity = async (ctx) => {
    const response = await superagent
      .get(getIntegrationPath(ctx))
      .set('Authorization', `Bearer ${ctx.fusebit.functionAccessToken}`);
    return response.body;
}

const getConnectorEntity = async (ctx, connectorId) => {
  const response = await superagent
    .get(getConnectorPath(ctx, connectorId))
    .set('Authorization', `Bearer ${ctx.fusebit.functionAccessToken}`);
  return response.body;
}

const getIntegrationsFeed = async (ctx) => {
  const response = await superagent
    .get(integrationsFeedUrl)
    .set('Authorization', `Bearer ${ctx.fusebit.functionAccessToken}`);
  return response.body;
}

const createIntegrationFeedEntry = async (ctx) => {

  const int = await getIntegrationEntity(ctx);
  const cons = await Promise.all(
    int.data.components
      .filter((component) => component.entityType === 'connector')
      .map(async (connector) => getConnectorEntity(ctx, connector.name))
  );

  const firstConnectorHandler = cons?.[0].data.handler;
  const integrationsFeed = await getIntegrationsFeed(ctx);
  const firstFeedMatch = integrationsFeed.find(
    feed => {
      return Object.values(feed.configuration.entities).some(
        entity => entity.data.handler === firstConnectorHandler
      )
    }
  )
    || integrationsFeed.find(feed => !Object.values(feed.configuration.entities).length) ;

  const integrationId = `${int.id}-forked-${Math.floor(Math.random() * 100)}`;

  const body = [{
    id: integrationId,
    smallIcon: firstFeedMatch?.smallIcon,
    largeIcon: firstFeedMatch?.largeIcon,
    name: `Forking ${int.id}`,
    description: "",
    tags: {
      fork: int.id
    },
    resources:{},
    configuration: {
      schema:{
        "type": "object",
        "properties": {
          [integrationId]: {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "minLength": 3
              }
            }
          },
          ...cons.reduce((map, con) => {
            map[con.id] = {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "minLength": 3
                }
              }
            };
            return map;
          },{}),
          ui: {
            "type": "object",
            "properties": {
              "toggle": {
                "type": "boolean",
                "description": "The \"toggle\" option renders boolean values as a toggle."
              }
            }
          }
        }
      },
      uischema:{
        "type": "VerticalLayout",
        "elements": [
          {
            "type": "Control",
            "scope": `#/properties/${integrationId}/properties/id`,
            "label": "Integration Name"
          },
          {
            "type": "Control",
            "label": "Customize Connector Names",
            "scope": "#/properties/ui/properties/toggle",
            "options": {
              "toggle": true
            }
          },
          ...cons.map((con) => {
            return {
              "type": "Control",
              "scope": `#/properties/${con.id}/properties/id`,
              "label": con.id,
              "rule": {
                "effect": "SHOW",
                "condition": {
                  "scope": "#/properties/ui/properties/toggle",
                  "schema": {
                    "const": true
                  }
                }
              }
            }
          })
        ]
      },
      entities: {
        ...cons.reduce((map, con) => {
          map[con.id] = {
            "entityType": "connector",
            "data": {
              "configuration": {
                "mode": {
                  "useProduction": false
                },
                "scope": "",
                "clientId": "<% global.consts.random %>",
                "clientSecret": "<% global.consts.random %>",
                "refreshErrorLimit": 100000,
                "refreshInitialBackoff": 100000,
                "refreshWaitCountLimit": 100000,
                "refreshBackoffIncrement": 100000,
                "accessTokenExpirationBuffer": 500
              },
              "files": con.data.files,
              "handler": con.data.handler
            },
            "id": "<% this.id %>",
            "tags": {
              "fusebit.service": con.tags["fusebit.service"]
            }
          }
          return map;
        }, {}),
        [integrationId]: {
          "entityType": "integration",
          "data": {
            "configuration": {},
            "files": int.data.files,
            "handler": int.data.handler,
            "components": int.data.components.map(com => {
              if (cons.some(con => con.id === com.name)) {
                com.entityId = `<% global.entities.${com.name}.id %>`
              }
              return com;
            }),
            "componentTags": int.data.componentTags
          },
          "id": "<% this.id %>",
          "tags": {
            "fuebit.service": int.tags["fusebit.service"]
          }
        }
      }
    },
  }];

  return {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
    body
  };
}

