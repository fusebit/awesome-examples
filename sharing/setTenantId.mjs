#!/usr/bin/env zx

const superagent = require('superagent');

const usage = () => {
  console.log('\nSet the tenantId for an install and an identity to `user-1`.\n');
  console.log(`Usage: ${argv._[0]} [integrationId] [ins-123456] [connectorId] [idn-123456]`);
  process.exit(-1);
};

if (argv._.length != 5) {
  console.log(`ERROR: Got ${argv._.length - 1} parameters, expected 4`);
  usage();
}

const integrationId = argv._[1];
const installId = argv._[2];
const connectorId = argv._[3];
const identityId = argv._[4];

if (!installId.match('ins-.*')) {
  console.log(`ERROR: Non-matching install id: ${installId}`);
  usage();
}

if (!identityId.match('idn-.*')) {
  console.log(`ERROR: Non-matching identity id: ${identityId}`);
  usage();
}

const token = (await $`fuse token -o raw`).stdout.trim();
const profile = JSON.parse((await $`fuse profile get -o json`).stdout);

const baseUrl = `${profile.baseUrl}/v2/account/${profile.account}/subscription/${profile.subscription}`;
const integrationUrl = `${baseUrl}/integration/${integrationId}`;
const connectorUrl = `${baseUrl}/connector/${connectorId}`;

const makeRequest = async (method, url) => superagent[method](url).set('Authorization', `Bearer ${token}`);

const install = await makeRequest('put', `${integrationUrl}/install/${installId}/tag/fusebit.tenantId/user-1`);
const identity = await makeRequest('put', `${connectorUrl}/identity/${identityId}/tag/fusebit.tenantId/user-1`);
console.log(`Install: `, install.body);
console.log(`Identity: `, identity.body);
