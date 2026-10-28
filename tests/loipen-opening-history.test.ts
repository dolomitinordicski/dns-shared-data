import assert from 'node:assert/strict';
import test from 'node:test';
import { findDNSOpeningStart } from '../src/loipen-opening-history.js';
const row = (date: string, openKm: number) => ({ date, openKm, verification: 'website-counter-captured' });
test('starts on first daily increase after initial baseline, not on collection start', () => {
  assert.equal(findDNSOpeningStart([row('2026-10-29',0),row('2026-10-30',0),row('2026-11-01',1),row('2026-11-02',3)]),'2026-11-01');
});
test('does not invent opening from first nonzero baseline', () => {
  assert.equal(findDNSOpeningStart([row('2026-10-29',5)]), null);
});
test('rejects gaps represented as fabricated zeros or duplicate dates', () => {
  assert.throws(() => findDNSOpeningStart([row('2026-10-29',0),row('2026-10-29',0)]));
});
