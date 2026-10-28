import assert from 'node:assert/strict';
import test from 'node:test';
import { DNS_LOIPEN_REGION_IDS, type DNSLoipenCounters } from '../src/loipen-html-adapter.js';
import { aggregateDNSCarouselCounters } from '../src/widget-carousel-aggregation.js';

const regions = Object.entries(DNS_LOIPEN_REGION_IDS).map(([sourceRegionId, areaId]) => ({
  sourceRegionId: Number(sourceRegionId) as DNSLoipenCounters['sourceRegionId'],
  areaId: areaId as DNSLoipenCounters['areaId'], openTrails: 1, totalTrails: 4, openKm: 3, totalKm: 10
}));
test('aggregates eight distinct areas', () => {
  assert.deepEqual(aggregateDNSCarouselCounters(regions), {
    areaCount: 8, openTrails: 8, totalTrails: 32, openKm: 24, totalKm: 80
  });
});
test('rejects incomplete and duplicated region sets', () => {
  assert.throws(() => aggregateDNSCarouselCounters(regions.slice(1)), /eight/);
  assert.throws(() => aggregateDNSCarouselCounters([...regions.slice(0,7), regions[0]]), /Duplicate/);
});
test('rejects mismatched IDs and invalid counters', () => {
  assert.throws(() => aggregateDNSCarouselCounters([{ ...regions[0], areaId: regions[1].areaId }, ...regions.slice(1)]), /mismatched/);
  assert.throws(() => aggregateDNSCarouselCounters([{ ...regions[0], openKm: 11 }, ...regions.slice(1)]), /Invalid/);
});
