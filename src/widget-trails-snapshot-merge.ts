import type { DNSPublicWidgetSnapshot } from './public-widget.js';

/** Pure domain merge. The caller must independently verify authorization and source provenance.
 * Never build a replacement snapshot from HTML or erase existing approved pricing/weather.
 */
export function mergeApprovedWidgetTrails(
  previous: DNSPublicWidgetSnapshot,
  nextTrails: DNSPublicWidgetSnapshot['trails'],
  metadata: { areaId: string; seasonId: string; revision: string; publishedAt: string }
): DNSPublicWidgetSnapshot {
  if (previous.areaId !== metadata.areaId || previous.seasonId !== metadata.seasonId) {
    throw new Error('Widget snapshot scope mismatch');
  }
  if (!metadata.revision.trim() || metadata.revision === previous.revision) {
    throw new Error('New publication revision required');
  }
  const publishTime = Date.parse(metadata.publishedAt);
  if (!Number.isFinite(publishTime) || publishTime <= Date.parse(previous.publishedAt)) {
    throw new Error('Publication must be newer than the previous snapshot');
  }
  if (!['available', 'unavailable', 'stale'].includes(nextTrails.status)) throw new Error('Invalid trail status');
  const { openKm, totalKm, observedAt } = nextTrails;
  if (nextTrails.status === 'available') {
    const observationTime = observedAt ? Date.parse(observedAt) : NaN;
    if (!Number.isFinite(observationTime) || observationTime > publishTime) {
      throw new Error('Approved trail observation timestamp is missing, invalid or in the future');
    }
    if (openKm === null || totalKm === null) throw new Error('Available trails require real kilometre counts');
  }
  if ([openKm, totalKm].some(value => value !== null && (!Number.isFinite(value) || value < 0))) {
    throw new Error('Invalid trail distance');
  }
  if (openKm !== null && totalKm !== null && openKm > totalKm) {
    throw new Error('Open kilometres exceed total kilometres');
  }
  if (previous.trails.observedAt && observedAt &&
      Date.parse(observedAt) < Date.parse(previous.trails.observedAt)) {
    throw new Error('Cannot regress the trail source observation');
  }
  return {
    ...previous,
    revision: metadata.revision,
    publishedAt: metadata.publishedAt,
    trails: { ...nextTrails },
    // Immutable-by-construction preservation of previous pricing, weather and branding.
    pricing: previous.pricing,
    weather: previous.weather,
    logo: previous.logo,
  };
}
