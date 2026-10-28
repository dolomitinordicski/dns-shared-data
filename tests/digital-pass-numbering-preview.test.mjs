import test from 'node:test';
import assert from 'node:assert/strict';
import { previewDigitalPassNumbering } from '../server/digital-pass-numbering-preview.mjs';

const sample = () => ({startNumber:100,nextNumber:106,totalQuantity:6,rows:[
  {itemId:'weekly',itemCode:'wk-area',organizationId:'area-a',quantity:2,from:100,to:101},
  {itemId:'season',itemCode:'sk-dns',organizationId:'area-a',quantity:4,from:102,to:105},
]});
test('Data Entry numbering is validated across products and remains unapproved',()=>{
  const p=previewDigitalPassNumbering(sample());
  assert.equal(p.eligibleDnsSeasonalQuantity,4);
  assert.equal(p.approved,false);
  assert.equal(p.sourceSha256.length,64);
  assert.equal(p.rows.length,2);
  assert.equal(previewDigitalPassNumbering(sample()).sourceSha256,p.sourceSha256);
});
test('reject overlapping or discontinuous numbering',()=>{
  const a=sample();a.rows[1].from=101;
  assert.throws(()=>previewDigitalPassNumbering(a),/INVALID_NUMBERING_ROW/);
  const b=sample();b.rows[1].from=103;b.rows[1].to=106;b.nextNumber=107;
  assert.throws(()=>previewDigitalPassNumbering(b),/INVALID_NUMBERING_ROW/);
});
test('reject inconsistent totals, duplicate article-organization and missing DNS product',()=>{
  const a=sample();a.totalQuantity=5;
  assert.throws(()=>previewDigitalPassNumbering(a),/NUMBERING_TOTAL_MISMATCH/);
  const b=sample();b.rows[1].itemId='weekly';b.rows[1].organizationId='area-a';
  assert.throws(()=>previewDigitalPassNumbering(b),/DUPLICATE_NUMBERING_ALLOCATION/);
  const c=sample();c.rows[1].itemCode='sk-area';
  assert.throws(()=>previewDigitalPassNumbering(c),/NO_DNS_SEASONAL_TICKETS/);
});
