import test from 'node:test';
import assert from 'node:assert/strict';
import { previewDigitalPassNumbering } from '../server/digital-pass-numbering-preview.mjs';
const sample=()=>({schema:'dns.digital-pass-inventory.v1',seasonId:'2026-27',revision:'data-entry-export-1',approved:false,rows:[
 {itemCode:'wk-area',organizationId:'org-a',from:100,to:101},
 {itemCode:'sk-dns',organizationId:'org-a',from:102,to:105},
]});
test('validates the actual Data Entry JSON export and keeps it unapproved',()=>{
 const p=previewDigitalPassNumbering(sample());
 assert.equal(p.eligibleDnsSeasonalQuantity,4);
 assert.equal(p.totalQuantity,6);
 assert.equal(p.approved,false);
 assert.equal(p.sourceSha256.length,64);
 assert.equal(previewDigitalPassNumbering(sample()).sourceSha256,p.sourceSha256);
});
test('rejects overlap, invalid source schema and inappropriate approval',()=>{
 const a=sample();a.rows[1].from=101;
 assert.throws(()=>previewDigitalPassNumbering(a),/AMBIGUOUS_NUMBERING/);
 const b=sample();b.approved=true;
 assert.throws(()=>previewDigitalPassNumbering(b),/INVALID_NUMBERING_EXPORT/);
 const c=sample();c.schema='other';
 assert.throws(()=>previewDigitalPassNumbering(c),/INVALID_NUMBERING_EXPORT/);
});
test('rejects missing DNS seasonal product and invalid range',()=>{
 const a=sample();a.rows[1].itemCode='sk-area';
 assert.throws(()=>previewDigitalPassNumbering(a),/NO_DNS_SEASONAL_TICKETS/);
 const b=sample();b.rows[0].to=99;
 assert.throws(()=>previewDigitalPassNumbering(b),/INVALID_NUMBERING_ROW/);
});
