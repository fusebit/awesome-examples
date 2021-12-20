const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

integration.event.on('/:componentName/webhook/issue_comment.created', async (ctx) => {
  const {
    data: { comment, repository, issue, installation },
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
      const { _issue } = await linearClient.issueCreate({ teamId: team.id, title, description });
      const linearIssue = await linearClient.issue(_issue.id);
      // Reply to GitHub that the issue was created on Linear
      const issueBody = `Issue created: <a href="${linearIssue.url}">${linearIssue.identifier}</a>`;
      const githubClient = await integration.service.getSdk(ctx, 'github', ctx.req.body.installIds[0]);
      // Authenticate as the GitHub App installation to create a reply comment
      const githubInstallationClient = await githubClient.installation(installation.id);
      const { data: { html_url } } = await githubInstallationClient.rest.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        body: issueBody,
      });
      // Add a Linear comment with the GitHub comment URL
      await linearClient.commentCreate({  issueId: _issue.id, body: `GitHub issue: ${html_url}` });
    }
  }
});

module.exports = integration;
