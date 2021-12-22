## GitHub-Linear-Slash-Commands bot

This is a Linear slash command that allow Linear issue creation from a GitHub issue comment using /linear.

# Setup

Dependencies:

1. githubappConnector with webhook configured
2. linearConnector

Setup:

1. Create a new Integration with GitHub App connector.
2. Create a new Linear Connector and attach it to the created Integration.
3. Copy paste ./integration.js to the integration.
4. Configure a GitHub App Connector with production credentials enabled.
5. Set Issues permissions to read & write on the GitHub Application
6. Subscribe to the Issue comment event.
7. Configure a Linear application with production credentials enabled.
8. Enable production credentials for the Linear Connector, add the following scopes: read issues:create comments:create
9. Run through the Install process.
10. Comment an Issue using /linear [title] [description].
    Ensure the slash command is added at the beginning of the comment.
