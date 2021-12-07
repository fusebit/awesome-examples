## Linear-Slack-Congratulations bot

This is a slack bot that congratulates people on slack when they complete an issue on Linear. 

# Setup

Dependencies:
1. slackConnector
2. linearConnector with webhook configured

Setup:
1. Create a new integration with linear connector.
2. Create a new slack connector and attach it to the integration.
3. Copy paste ./integration.js to the integration.
4. Configure a prod Linear bot with webhook enabled.
5. Run through the Install process.
6. Close an issue and try it out!