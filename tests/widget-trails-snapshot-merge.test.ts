import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeApprovedWidgetTrails } from '../src/widget-trails-snapshot-merge.js';
import type { DNSPublicWidgetSnapshot } from '../src/public-widget.js';

const old: DNSPublicWidgetSnapshot = {
  schemaVersion: 1,
  revision: 'old',
  publishedAt: '2026-10-28T10:00:00Z',
  seasonId: '2026-27' as DNSPublicWidgetSnapshot['seasonId'],
  areaId: 'gsiesertal-welsberg-taisten' as DNSPublicWidgetSnapshot['areaId'],
  areaName: { de: 'Gsiesertal', it: 'Val Casies', en: 'Gsies Valley' },
  logo: null,
  pricing: { status: 'available', updatedAt: '2026-10-28T09:00:00Z', items: [] },
  weather: { status: 'available', observedAt: '2026-10-28T08:00:00Z', temperatureC: 2, snowDepthCm: 10 },
  trails: { status: 'unavailable', observedAt: null, openKm: null, totalKm: null }
};
const meta = { areaId: 'gsiesertal-welsberg-taisten', seasonId: '2026-27',
  revision: 'next', publishedAt: '2026-10-28T12:00:00Z' };
const valid = { status: 'available' as const, observedAt: '2026-10-28T11:00:00Z', openKm: 0, totalKm: 40 };

test('updates only approved trails and metadata, preserving existing fields', () => {
  const next = mergeApprovedWidgetTrails(old, valid, meta);
  assert.deepEqual(next.trails, valid);
  assert.deepEqual(next.pricing, old.pricing);
  assert.deepEqual(next.weather, old.weather);
  assert.deepEqual(next.logo, old.logo);
});
test('rejects unverifiable observations', () => {
  assert.throws(() => mergeApprovedWidgetTrails(old, {...valid, observedAt: null}, meta), /timestamp/);
  assert.throws(() => mergeApprovedWidgetTrails(old, {...valid, observedAt: '2026-10-28T13:00:00Z'}, meta), /timestamp/);
});
test('rejects scope mismatch and invalid distances', () => {
  assert.throws(() => mergeApprovedWidgetTrails(old, valid, {...meta, areaId: 'drei-zinnen'}), /scope/);
  assert.throws(() => mergeApprovedWidgetTrails(old, {...valid, openKm: 41}, meta), /exceed/);
});
