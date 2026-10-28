/** Offline, read-only validation of the Data Entry TicketNumberingResult export.
 * This does NOT approve or write an inventory snapshot to Firestore. */
import { createHash } from 'node:crypto';

const integer = n => Number.isSafeInteger(n) && n >= 1;
const id = s => typeof s === 'string' && s.trim() === s && s.length > 0 && s.length <= 128;

export function previewDigitalPassNumbering(exported, { seasonId = '2026-27' } = {}) {
  if (seasonId !== '2026-27' || !exported || !Array.isArray(exported.rows) ||
      !integer(exported.startNumber) || !integer(exported.nextNumber) ||
      !Number.isSafeInteger(exported.totalQuantity) || exported.totalQuantity <= 0 ||
      exported.rows.length === 0) throw new Error('INVALID_NUMBERING_EXPORT');

  // Data Entry allocates sequential ranges in article display order, then organization order.
  // Validate *all* products; overlapping an area ticket with a DNS seasonal is unsafe.
  let next = exported.startNumber;
  let total = 0;
  let eligible = 0;
  const rows = [];
  const seen = new Set();
  for (const r of exported.rows) {
    if (!r || !id(r.itemId) || !id(r.itemCode) || !id(r.organizationId) ||
        !integer(r.from) || !integer(r.to) || !integer(r.quantity) ||
        r.from !== next || r.to < r.from || r.to - r.from + 1 !== r.quantity ||
        r.to > Number.MAX_SAFE_INTEGER - 1)
      throw new Error('INVALID_NUMBERING_ROW');
    const pair = r.itemId + '\0' + r.organizationId;
    if (seen.has(pair)) throw new Error('DUPLICATE_NUMBERING_ALLOCATION');
    seen.add(pair);
    rows.push({ itemId:r.itemId, itemCode:r.itemCode, organizationId:r.organizationId,
      from:r.from, to:r.to, quantity:r.quantity });
    if (r.itemCode === 'sk-dns') eligible += r.quantity;
    next = r.to + 1;
    total += r.quantity;
  }
  if (next !== exported.nextNumber || total !== exported.totalQuantity ||
      total !== exported.nextNumber - exported.startNumber)
    throw new Error('NUMBERING_TOTAL_MISMATCH');
  if (!eligible) throw new Error('NO_DNS_SEASONAL_TICKETS');

  const digest = createHash('sha256').update(JSON.stringify({
    seasonId, startNumber:exported.startNumber, nextNumber:next, rows,
  })).digest('hex');
  return {
    seasonId, productCode:'sk-dns', startNumber:exported.startNumber,
    nextNumber:next, totalQuantity:total, eligibleDnsSeasonalQuantity:eligible,
    sourceSha256:digest, rows,
    // Deliberately not approved: requires DNS verification against the printer numbering
    // and source order revision before assigning an immutable production revision.
    approved:false,
  };
}
