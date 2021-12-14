/**
 * @param ctx {FusebitContext}
 */
module.exports = async (ctx) => {
  // const url = new URL("https://manage.fusebit.io/callback");
  const url = new URL("http://localhost:3000/callback");
  url.searchParams.set("silentAuth", false);
  url.searchParams.set(
    "requestedPath",
    "/account/acc-6d026dbd88af4eaf/subscription/sub-025ba376ff9d4ec5/integration/linear-growth/edit"
  );
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("expires_in", "86400");
  url.searchParams.set("token_type", "Bearer");
  url.hash = `#access_token=${ctx.fusebit.functionAccessToken}`;
  return { body: url.toString() };
};
