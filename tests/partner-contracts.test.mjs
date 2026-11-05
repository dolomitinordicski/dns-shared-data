import assert from 'node:assert/strict';
import test from 'node:test';
import { countActivePartnerEstablishments, summarizePartnerBeds } from '../dist/partner-contracts.js';

const establishment = { establishmentId:'hotel-a', active:true, reportingAreaId:'area-a' };
const partnership = { establishmentId:'hotel-a', status:'active', effectiveFrom:'2026-01-01' };
const capacity = { establishmentId:'hotel-a', beds:10, validFrom:'2026-01-01' };
const count = (rows, asOf) => countActivePartnerEstablishments(rows, [establishment], 'area-a', asOf);
const beds = (rows, asOf) => summarizePartnerBeds([establishment], rows, asOf);

test('counts a duplicated active partnership once and excludes inactive/wrong-area rows', () => {
  assert.equal(count([partnership, partnership], '2026-01-01'), 1);
  assert.equal(count([{...partnership,status:'suspended'}], '2026-01-01'), 0);
  assert.equal(countActivePartnerEstablishments([partnership], [{...establishment,active:false}], 'area-a', '2026-01-01'), 0);
  assert.equal(countActivePartnerEstablishments([partnership], [establishment], 'area-b', '2026-01-01'), 0);
});

test('compares timezone offsets chronologically for both aggregations', () => {
  const future='2025-12-31T23:45:00-01:00'; // 00:45 UTC
  const asOf='2026-01-01T00:30:00Z';
  assert.equal(count([{...partnership,effectiveFrom:future}], asOf), 0);
  assert.equal(beds([{...capacity,validFrom:future}], asOf).withUnknownBeds, 1);
  assert.equal(count([{...partnership,effectiveFrom:'2026-01-01T01:00:00+01:00'}], asOf), 1);
  assert.equal(beds([{...capacity,validFrom:'2026-01-01T01:00:00+01:00'}], asOf).knownBeds, 10);
});

test('uses inclusive starts and exclusive ends, including equivalent instants', () => {
  const end='2026-01-02T01:00:00+01:00';
  assert.equal(count([{...partnership,effectiveTo:end}], '2026-01-01T00:00:00Z'), 1);
  assert.equal(count([{...partnership,effectiveTo:end}], '2026-01-02'), 0);
  assert.equal(beds([{...capacity,validTo:end}], '2026-01-02').withUnknownBeds, 1);
});

test('rejects invalid dates and timezone-less timestamps', () => {
  for (const date of ['not-a-date','2026-02-30','2026-13-01','2026-01-01T12:00:00']) {
    assert.throws(() => count([partnership], date), /Invalid partner date/);
    assert.throws(() => beds([capacity], date), /Invalid partner date/);
    assert.throws(() => count([{...partnership,effectiveFrom:date}], '2026-03-01'), /Invalid partner date/);
    assert.throws(() => beds([{...capacity,validFrom:date}], '2026-03-01'), /Invalid partner date/);
  }
});

test('rejects empty/reversed date intervals', () => {
  for (const end of ['2026-01-01','2025-12-31']) {
    assert.throws(() => count([{...partnership,effectiveTo:end}], '2026-01-01'), /Invalid partner date interval/);
    assert.throws(() => beds([{...capacity,validTo:end}], '2026-01-01'), /Invalid partner date interval/);
  }
});

test('keeps unknown beds distinct from zero and rejects overlaps/invalid capacity', () => {
  assert.deepEqual(beds([{...capacity,beds:0}], '2026-01-01'), {knownBeds:0,withKnownBeds:1,withUnknownBeds:0});
  assert.equal(beds([{...capacity,beds:null}], '2026-01-01').withUnknownBeds, 1);
  assert.throws(() => beds([capacity,capacity], '2026-01-01'), /Overlapping/);
  for (const value of [-1,1.5,NaN]) assert.throws(() => beds([{...capacity,beds:value}], '2026-01-01'), /Invalid capacity/);
});
