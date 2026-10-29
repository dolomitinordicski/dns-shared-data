/** Offline validation of the *actual* Data Entry digitalPassInventory.ts export.
 * Validates all product ranges, without approving or writing anything to Firestore. */
import { createHash } from 'node:crypto';
const integer = n => Number.isSafeInteger(n) && n >= 1;
const id = s => typeof s === 'string' && s.trim() === s && s.length > 0 && s.length <= 128;
export function previewDigitalPassNumbering(exported) {
  if (!exported || exported.schema !== 'dns.digital-pass-inventory.v1' ||
    exported.seasonId !== '2026-27' || exported.approved !== false ||
    !id(exported.revision) || !Array.isArray(exported.rows) || exported.rows.length === 0)
    throw new Error('INVALID_NUMBERING_EXPORT');
  const rows = exported.rows.map(r => {
    if (!r || !id(r.itemCode) || !id(r.organizationId) ||
        !integer(r.from) || !integer(r.to) || r.to < r.from ||
        !Number.isSafeInteger(r.to + 1)) throw new Error('INVALID_NUMBERING_ROW');
    return { itemCode:r.itemCode, organizationId:r.organizationId, from:r.from, to:r.to };
  }).sort((a,b) => a.from-b.from);
  let eligible=0, total=0;
  for(let i=0;i<rows.length;i++){
    if(i>0 && rows[i].from<=rows[i-1].to) throw new Error('AMBIGUOUS_NUMBERING');
    const qty=rows[i].to-rows[i].from+1;
    total+=qty;
    if(!Number.isSafeInteger(total)) throw new Error('NUMBERING_TOTAL_OVERFLOW');
    if(rows[i].itemCode==='sk-dns') eligible+=qty;
  }
  if(!eligible) throw new Error('NO_DNS_SEASONAL_TICKETS');
  const sourceSha256=createHash('sha256').update(JSON.stringify({
    schema:exported.schema, seasonId:exported.seasonId, rows,
  })).digest('hex');
  return {
    schema:exported.schema, seasonId:exported.seasonId, sourceRevision:exported.revision,
    totalQuantity:total, eligibleDnsSeasonalQuantity:eligible, sourceSha256,
    rows, approved:false,
  };
}
