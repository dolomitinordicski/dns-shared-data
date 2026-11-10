/** Server-side projection of Data Entry's persisted ticket matrix.
 * No snapshot writes, browser rows, labels or sales counts are trusted here. */
import { createHash } from 'node:crypto';
const season = '2026-27';
const fail = () => { throw Error('DATA_ENTRY_NUMBERING_UNAVAILABLE'); };
const identifier = x => typeof x === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(x);
function ids(value) {
  if (!Array.isArray(value) || !value.length || value.length > 500
      || value.some(x => !identifier(x)) || new Set(value).size !== value.length) fail();
  return value;
}
function records(value) {
  if (!Array.isArray(value)) fail();
  const result = new Map();
  for (const row of value) {
    if (!row || !identifier(row.id) || result.has(row.id)) fail();
    result.set(row.id, row);
  }
  return result;
}
export function dataEntryNumberingStart(value) {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,11}$/.test(value)) fail();
  const start = Number(value);
  if (!Number.isSafeInteger(start)) fail();
  return start;
}
export function buildDataEntryInventory({ seasonId = season, startNumber, form, items, organizations, orders, lines }) {
  if (seasonId !== season || !Number.isSafeInteger(startNumber) || startNumber < 1) fail();
  if (!form || form.seasonId !== seasonId || form.category !== 'ticket') fail();
  const itemIds = ids(form.catalogItemIds), orgIds = ids(form.organizationIds);
  const catalog = records(items), orgs = records(organizations), headers = records(orders), cells = records(lines);
  const orderedItems = itemIds.map(id => {
    const item = catalog.get(id);
    if (!item || item.category !== 'ticket' || !identifier(item.code) || !Number.isFinite(item.displayOrder)) fail();
    return item;
  }).sort((a,b) => a.displayOrder - b.displayOrder); // stable ties: same form order as Data Entry
  for (const id of orgIds) {
    if (!orgs.has(id) || orgs.get(id).active === false) fail();
    const order = headers.get(`${seasonId}__ticket__${id}`);
    if (order && (order.seasonId !== seasonId || order.category !== 'ticket' || order.organizationId !== id
        || !['draft','submitted','confirmed','fulfilled'].includes(order.status))) fail();
  }
  let cursor = startNumber;
  const rows = [];
  for (const item of orderedItems) for (const organizationId of orgIds) {
    const orderId = `${seasonId}__ticket__${organizationId}`;
    const line = cells.get(`${orderId}__${item.id}`);
    if (!line) continue; // Data Entry leaves unreported/missing cells unnumbered.
    if (line.seasonId !== seasonId || line.organizationId !== organizationId
        || line.catalogItemId !== item.id || line.ticketOrderId !== orderId) fail();
    const quantity = line.quantity ?? 0;
    if (!Number.isSafeInteger(quantity) || quantity < 0 || (quantity > 0 && !headers.has(orderId))) fail();
    if (quantity === 0) continue;
    if (!Number.isSafeInteger(cursor + quantity)) fail();
    rows.push({ itemCode:item.code, organizationId, from:cursor, to:cursor + quantity - 1 });
    cursor += quantity;
  }
  if (!rows.some(r => r.itemCode === 'sk-dns')) fail();
  const digest = createHash('sha256').update(JSON.stringify({ seasonId, startNumber, rows })).digest('hex');
  return {
    schema:'dns.digital-pass-inventory.v1', seasonId, revision:'data-entry-' + seasonId + '-' + digest,
    // Compatibility with the resolver. Derived only from persisted Core data and
    // accepted by the HTTP adapter only when its revision matches server config.
    approved:true, rows,
    source:{ system:'DNS-Data-Entry', collection:'ticketOrderLines', formId:seasonId+'-ticket', startNumber },
  };
}
export async function loadDataEntryInventory({ db, startNumber, seasonId = season }) {
  if (seasonId !== season || !Number.isSafeInteger(startNumber) || startNumber < 1) fail();
  return db.runTransaction(async tx => {
    const formDoc = await tx.get(db.collection('orderFormConfigs').doc(seasonId+'-ticket'));
    if (!formDoc.exists) fail();
    const form = formDoc.data();
    if (form.seasonId !== seasonId || form.category !== 'ticket') fail();
    const itemIds = ids(form.catalogItemIds), orgIds = ids(form.organizationIds);
    if (itemIds.length * orgIds.length > 1000) fail();
    const read = async (collection, keys) => {
      const docs = await Promise.all(keys.map(id => tx.get(db.collection(collection).doc(id))));
      return docs.flatMap((doc,index) => doc.exists ? [{ ...doc.data(), id:keys[index] }] : []);
    };
    const [items, organizations, orders, lines] = await Promise.all([
      read('orderCatalogItems',itemIds), read('organizations',orgIds),
      read('ticketOrders',orgIds.map(id=>seasonId+'__ticket__'+id)),
      read('ticketOrderLines',orgIds.flatMap(id=>itemIds.map(item=>seasonId+'__ticket__'+id+'__'+item))),
    ]);
    return buildDataEntryInventory({seasonId,startNumber,form,items,organizations,orders,lines});
  });
}
