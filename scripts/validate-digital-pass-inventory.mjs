/** Offline validation before a DNS administrator approves the PRINTED inventory.
 * This utility never writes to Firestore or approves a snapshot. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const snapshot = JSON.parse(readFileSync(process.argv[2], 'utf8'));
if (snapshot.schema !== 'dns.digital-pass-inventory.v1' || snapshot.seasonId !== '2026-27' || snapshot.approved !== false ||
  typeof snapshot.revision !== 'string' || !snapshot.revision || !Array.isArray(snapshot.rows) || !snapshot.rows.length) throw new Error('INVALID_INVENTORY');
const rows = [...snapshot.rows].sort((a,b) => a.from-b.from);
for (const [i,r] of rows.entries()) {
  if (!Number.isSafeInteger(r.from) || !Number.isSafeInteger(r.to) || r.from < 1 || r.to < r.from || !r.itemCode || !r.organizationId ||
    i > 0 && r.from <= rows[i-1].to) throw new Error('INVALID_OR_OVERLAPPING_ROW');
}
console.log(JSON.stringify({ revision:snapshot.revision, seasonId:snapshot.seasonId, rows:rows.length,
  dnsSeasonQuantity:rows.filter(r=>r.itemCode==='sk-dns').reduce((sum,r)=>sum+r.to-r.from+1,0),
  checksum:createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'), approved:false },null,2));
