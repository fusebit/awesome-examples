const superagent = require('superagent');

const fusebitPortal = 'https://manage.fusebit.io/callback';

module.exports = async (ctx) => {
  if (ctx.path.toLowerCase() === '/') {
    return {
      body: Buffer.from('Select either /edit or /stackoverflow').toString('base64'),
      bodyEncoding: 'base64',
      headers: { 'Content-Type': 'text/plain' },
    };
  }
  if (ctx.path.toLowerCase() === '/edit') {
    return renderEdit(ctx);
  }

  if (ctx.path.toLowerCase() === '/stackoverflow') {
    return renderStackOverflow(ctx);
  }

  return { status: 200, body: { message: 'Use /edit or /stackoverflow' } };
};

const getEditUrl = (ctx) => `${ctx.baseUrl}/edit?integrationId=${ctx.query.integrationId}&tenantId=${ctx.query.tenantId}`;

const renderEdit = (ctx) => {
  const url = new URL(fusebitPortal);

  const integrationPath = `/account/${ctx.accountId}/subscription/${ctx.subscriptionId}/integration/${ctx.query.integrationId}/edit`;

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
