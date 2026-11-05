import { DNS_LOIPEN_REGION_IDS, type DNSLoipenCounters } from './loipen-html-adapter.js';

/** Official DNS network total is the sum of eight regional counters. */
export function aggregateDNSCarouselCounters(items: readonly DNSLoipenCounters[]) {
  const expected = new Set(Object.values(DNS_LOIPEN_REGION_IDS));
  if (items.length !== expected.size) throw new Error('All eight DNS areas required');
  const seen = new Set<string>();
  const totals = { areaCount: expected.size, openTrails: 0, totalTrails: 0, openKm: 0, totalKm: 0 };
  for (const item of items) {
    if (!expected.has(item.areaId) || seen.has(item.areaId) ||
        DNS_LOIPEN_REGION_IDS[item.sourceRegionId] !== item.areaId) {
      throw new Error('Duplicate or mismatched area');
    }
    seen.add(item.areaId);
    if ([item.openTrails, item.totalTrails, item.openKm, item.totalKm].some(v => !Number.isFinite(v) || v < 0) ||
        item.openTrails > item.totalTrails || item.openKm > item.totalKm) {
      throw new Error('Invalid counters');
    }
    totals.openTrails += item.openTrails;
    totals.totalTrails += item.totalTrails;
    totals.openKm += item.openKm;
    totals.totalKm += item.totalKm;
  }
  return totals;
}
