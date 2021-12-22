const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const superagent = require('superagent');

function getMarkdownLink(contents) {
  const regex = /\[([^\[\]]*)\]\((.*?)\)/gm;
  return contents.match(regex);
}

function parseMarkdownLink(link) {
  const [, title, url] = /\[(.+)\]\((https?:\/\/[^\s]+)(?: "(.+)")?\)|(https?:\/\/[^\s]+)/ig.exec(link);
  return { title, url };
}

/**
 * 
 * @param {EventContext} ctx  The context object provided by the route function
 * @param {string} message 
 * @param {string} title 
 * @param {object} sender 
 * @param {number} color Embed color in hexadecimal 
 * @param {string} footerText 
 * @param {string} url 
 * @param {object} thumbnail 
 */
async function sendDiscordMessage(ctx, message, title, sender, color, footerText, url, thumbnail = {}) {
  const discordConnectorName = 'discord';
    const discordClient = await integration.service.getSdk(ctx, discordConnectorName, ctx.req.body.installIds[0]);
    await superagent.post(discordClient.fusebit.credentials.webhook.url).send({
      embeds: [
        {
          type: 'rich',
          title: title,
          description: message,
          color: color || 0xff00b3,
          author: {
            name: sender.login,
            icon_url: sender.avatar_url
          },
          footer: {
            text: footerText
          },
          url,
          thumbnail,
        }
      ]
    });
  }


  integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
    const { data: { action, comment, pull_request, sender, issue, changes, commits, repository } } = ctx.req.body.data;
    const element = pull_request || issue;
    const elementType = pull_request ? 'Pull request' : 'Issue';
    const actions = {
      closed: {
        name: `${elementType} ${element.merged ? 'merged' : action} ${element.title}`,
        color: element.merged ? 0x8957e5 : 0xda3633,
      },
      reopened: {
        name: `${elementType} ${action} ${element.title}`
      },
      opened: {
        name: `${elementType} ${action} ${element.title}`
      },
    };
  
    if (commits) {
      const messages = [];
      commits.forEach(commit => {
        messages.push(`:green_circle: +:${commit.added.length} :red_circle: -: ${commit.removed.length} :notepad_spiral: Modified files: ${commit.modified.length} \n Message: ${commit.message}`);
      });
      await sendDiscordMessage(ctx, messages.join('\n -------------- \n'), `${messages.length} commits pushed at ${repository.full_name}`, sender, 0xff00b3, '', repository.html_url);
      return;
    }
  
    if (comment) {
      const markdownLink = getMarkdownLink(comment.body);
      const image = markdownLink ? { url: parseMarkdownLink(markdownLink[0]).url } : null;
      await sendDiscordMessage(ctx, comment.body, `New comment at ${element.title}`, sender, 0x00FFFF, '', comment.html_url, image);
      return;
    }
  
    if (changes) {
      await sendDiscordMessage(ctx, `from ${changes.title.from} to ${element.title}`, `${elementType} description updated`, sender, 0x00FFFF, '', element.html_url);
      return;
    }
  
    if (actions[action]) {
      await sendDiscordMessage(ctx, '', actions[action].name, sender, actions[action].color, '', element.html_url);
    }
  
  });

module.exports = integration;
