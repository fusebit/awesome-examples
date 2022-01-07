const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

const router = integration.router;
const connectorName = 'stackoverflowConnector';

const createRssHeader = (ctx, lastBuildDate) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Fusebit Stack Overflow</title>
    <description>.</description>
    <copyright></copyright>
    <language>en</language>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <lastBuildDate>${new Date(lastBuildDate * 1000).toUTCString()}</lastBuildDate>
    <link>https://www.fusebit.io</link>
    <atom:link href="${ctx.state.params.baseUrl}${ctx.url}" rel="self" type="application/rss+xml" />
`;
}

const createRssTrailer = () => {
  return `
  </channel>
</rss>`;
}

const convertQuestionToRss = (question) => {
  return `
    <item>
      <guid isPermaLink="true">${question.link}</guid>
      <title>${question.title}</title>
      <description>${question.tags.join(', ')}</description>
      <pubDate>${new Date(question.creation_date * 1000).toUTCString()}</pubDate>
      <author>${encodeURIComponent(question.owner.display_name)}@stackoverflow.com (${question.owner.display_name})</author>
      <link>${question.link}</link>
      <content:encoded>${question.tags.join(', ')}</content:encoded>
    </item>
`;
}

router.get('/api/tenant/:tenantId/test5', async (ctx) => {
  try {
    const tags = ctx.request.query['tags'];
    const stackoverflowClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

    const items = (await stackoverflowClient.site('stackoverflow').get(`/questions?sort=creation&order=desc&tagged=${tags}&pagesize=100`)).items;

    let lastBuildDate = 0;
    items.forEach((item) => lastBuildDate = item.creation_date > lastBuildDate ? item.creation_date : lastBuildDate)

    const rss = `${createRssHeader(ctx, lastBuildDate)}${items.map((item) => convertQuestionToRss(item)).join('')}${createRssTrailer()}`;

    ctx.body = Buffer.from(rss, 'utf8');
    ctx.set('content-type', 'application/rss+xml');
  } catch (err) {
    console.log(err);
  }
});

module.exports = integration;
