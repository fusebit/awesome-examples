const fusebitPortal = "https://manage.fusebit.io/callback";

module.exports = async (ctx) => {
  const url = new URL(fusebitPortal);

  const interationPath = `/account/${ctx.params.accountId}/subscription/${ctx.params.subscriptionId}/integration/${ctx.query.integrationId}/edit`;

  url.searchParams.set("silentAuth", false);
  url.searchParams.set("requestedPath", integrationPath);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("expires_in", "86400");
  url.searchParams.set("token_type", "Bearer");
  url.hash = `#access_token=${ctx.fusebit.functionAccessToken}`;

  return { status: 302, headers: { location: url.toString() } };
};
