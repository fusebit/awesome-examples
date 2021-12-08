const superagent = require('superagent');

const { Integration } = require('@fusebit-int/framework');

const REQUEST_DELAY = 5000;

const integration = new Integration();

const getStorageKey = (tenantId, taskId) => `/${tenantId}/${taskId}`;

const isDone = async (ctx, tenantId, taskId) => {
  try {
    await integration.storage.getData(ctx, `/${tenantId}/${taskId}/done`);
    return true;
  } catch (error) {
    return false;
  }
};

const cleanup = async (ctx, tenantId, taskId) => {
  const entries = await integration.storage.listData(ctx, getStorageKey(tenantId, taskId));
  await Promise.all(entries.items.map((storageId) => integration.storage.deleteData(ctx, storageId)));
  return entries.items.length;
};

const getItems = async (ctx, tenantId, taskId) => {
  const data = await integration.storage.listData(ctx, getStorageKey(tenantId, taskId));

  const storageIds = data.items.filter((item) => !item.storageId.includes('done')).map((entry) => entry.storageId);
  const storage = await Promise.all(storageIds.map((storageId) => integration.storage.getData(ctx, storageId)));

  return storage.map((item) => item.data.items).flat();
};

/** Asychronously load paged data into Fusebit storage
 *
 * Load a set of paged data into Fusebit storage for subsequent processing.
 */
const iterate = async (ctx, tenantId, url, loadNextPage) => {
  let taskId = ctx.query.taskId || Math.floor(Math.random() * 1000000);
  let segment = ctx.query.segment || 0;
  let cursor = ctx.query.cursor;

  const { items, cursor: nextCursor } = await loadNextPage(cursor);

  // Start the load for the next page.
  const nextUrl = new URL(url);
  nextUrl.searchParams.set('taskId', taskId);
  nextUrl.searchParams.set('segment', Number(segment) + 1);
  nextUrl.searchParams.set('cursor', nextCursor);

  // Start the next page loading while the current page is being saved to storage, waiting a minimum to allow the request to fully dispatch.
  const startNextPage = async () => superagent.post(nextUrl.toString());
  const markDone = async () =>
    integration.storage.setData(ctx, `${getStorageKey(tenantId, taskId)}/done`, { data: { done: true } });
  const saveCurrentPage = async () =>
    Promise.all([
      integration.storage.setData(ctx, `${getStorageKey(tenantId, taskId)}/${segment}`, { data: { items } }),
      new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY)),
    ]);

  console.log(`Loaded ${items.length} items, with nextCursor: ${nextCursor}`);
  await Promise.race([nextCursor ? startNextPage() : markDone(), saveCurrentPage()]);

  return taskId;
};

module.exports = { isDone, cleanup, iterate, getItems };
