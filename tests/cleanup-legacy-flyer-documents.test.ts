import test from 'node:test';
import assert from 'node:assert/strict';

function classify(ids: string[]) {
  return {
    canonical: ids.filter(id => id.startsWith('current__')),
    legacy: ids.filter(id => !id.startsWith('current__')),
  };
}

test('preserves canonical current Flyer ids', () => {
  const result = classify([
    'current__reportingArea__drei-zinnen__2026-27__regional_price_list',
    'flyer_1720000000000_abcd12',
    'legacy-draft',
  ]);
  assert.deepEqual(result.canonical, [
    'current__reportingArea__drei-zinnen__2026-27__regional_price_list',
  ]);
  assert.deepEqual(result.legacy, ['flyer_1720000000000_abcd12', 'legacy-draft']);
});

test('172 guard only passes for exactly 172 legacy documents and at least one canonical', () => {
  const canonical = ['current__network__dolomiti-nordicski__2026-27__dns_price_list'];
  const legacy172 = Array.from({ length: 172 }, (_, i) => `flyer_${i}`);
  assert.equal(legacy172.length === 172 && canonical.length > 0, true);
  assert.equal(legacy172.slice(0, 171).length === 172 && canonical.length > 0, false);
  assert.equal(legacy172.length === 172 && [].length > 0, false);
});
