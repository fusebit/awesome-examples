## GitHub-Linear-Slash-Commands bot

This is a Discord integration that writes in a specific channel when the following GitHub Events occurs:
- A new Issue / Pull request is created / updated
- A new Issue / Pull request comment is added
- An Issue / Pull request is closed / reopened / merged
- A new commit(s) is pushed

### Dependencies:

1. GitHub App Connector with webhook configured
2. Discord with default configuration

### Setup

1. Create a new Integration with GitHub App connector. [Read documentation](https://developer.fusebit.io/docs/githubapp)
2. Create a new Discord Connector and attach it to the created Integration. [Read documentation](https://developer.fusebit.io/docs/discord)
3. Copy paste ./integration.js to the integration.
4. Configure a GitHub App Connector with production credentials enabled.
5. Set Issues permissions to read on the GitHub Application
6. Subscribe to the following events:
    - Commit comment
    - Issue comment
    - Issues
    - Pull request
    - Pull request review comment
    - Push
7. Run through the Install process.
8. Create a new Pull request / Issue, add comments, update the status.
