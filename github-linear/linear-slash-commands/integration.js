const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

integration.event.on('/:componentName/webhook/issue_comment.created', async (ctx) => {
  const {
    data: { comment, repository, issue },
  } = ctx.req.body.data;
  const commentText = comment.body;
  const isLinearCommand = commentText.match(/^\/linear/g).length > 0;
  if (isLinearCommand) {
    const linearClient = await integration.service.getSdk(ctx, 'linear', ctx.req.body.installIds[0]);
    const [titlePart, description] = commentText.split('\n');
    const title = titlePart.replace('/linear', '');
    const teams = await linearClient.teams();
    const team = teams.nodes[0];
    if (team.id) {
      try {
        const { _issue } = await linearClient.issueCreate({ teamId: team.id, title, description });
        const linearIssue = await linearClient.issue(_issue.id);
        // Reply to GitHub that the issue was created on Linear
        const issueBody = `Issue created: <a href="${linearIssue.url}" target="_blank">${linearIssue.identifier}</a>`;
        const githubClient = await integration.service.getSdk(ctx, 'github', ctx.req.body.installIds[0]);
        await githubClient.rest.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: issue.number,
          body: issueBody,
        });
      } catch (e) {
        console.log('Failed to create Linear Issue', e);
        throw e;
      }
    }
  }
});

module.exports = integration;
