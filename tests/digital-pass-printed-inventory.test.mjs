import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { previewDigitalPassNumbering } from '../server/digital-pass-numbering-preview.mjs';
import { resolveSeasonPassAssignment } from '../server/digital-pass-inventory-resolver.mjs';

const snapshot = JSON.parse(readFileSync(new URL('../data/digital-pass-inventory-2026-27.canonical.review.json', import.meta.url), 'utf8'));
test('printed DNS Data Entry ranges map exactly onto canonical IDs', () => {
  assert.equal(snapshot.approved, false);
  assert.equal(snapshot.rows.length, 86);
  const preview = previewDigitalPassNumbering(snapshot);
  assert.equal(preview.totalQuantity, 24415);
  assert.equal(preview.eligibleDnsSeasonalQuantity, 4460);
  assert.equal(new Set(snapshot.rows.map(row=>row.organizationId)).size, 16);
  const rows = [...snapshot.rows].sort((a,b)=>a.from-b.from);
  let next = 1;
  for (const row of rows) { assert.equal(row.from, next); next = row.to + 1; }
  assert.equal(next, 24416);
});
test('resolver requires approval and maps first and last DNS season card', () => {
  assert.throws(()=>resolveSeasonPassAssignment({passNumber:'019621',seasonId:'2026-27',productCode:'sk-dns',snapshot}),/UNAPPROVED_NUMBERING_SNAPSHOT/);
  for (const [passNumber,organizationId] of [['019621','antholzertal'],['024080','dolomiti-nordicski']]) {
    const result = resolveSeasonPassAssignment({passNumber,seasonId:'2026-27',productCode:'sk-dns',snapshot:{...snapshot,approved:true}});
    assert.equal(result.organizationId,organizationId);
    assert.equal(result.printedNumber,passNumber);
  }
  assert.throws(()=>resolveSeasonPassAssignment({passNumber:'019620',seasonId:'2026-27',productCode:'sk-dns',snapshot:{...snapshot,approved:true}}),/NOT_ELIGIBLE/);
});
