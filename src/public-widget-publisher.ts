/**
 * Pure publication boundary for public widget data.
 * DNS Core must authenticate the publisher and approve input records BEFORE calling.
 * This function does not query Firestore or grant publishing permissions.
 */
import { REPORTING_AREAS, SEASONS, type ReportingAreaId, type SeasonId } from './canonical-data.js';
import type { TicketPricingConfig } from './seasonal-operational-data.js';
import {
  DNS_PUBLIC_WIDGET_SCHEMA_VERSION,
  type DNSPublicWidgetLogo,
  type DNSPublicWidgetSnapshot,
} from './public-widget.js';

export interface DNSWidgetPublishInput {
  areaId: ReportingAreaId | null;
  seasonId: SeasonId;
  revision: string;
  publishedAt: string;
  /** Only explicitly publication-approved pricing configurations. */
  approvedPrices: readonly TicketPricingConfig[];
  /** Must refer to a verified public asset, never a private storage path. */
  approvedLogo?: DNSPublicWidgetLogo | null;
  /** Publication-approved, area-scoped operational readings; no raw provider payloads. */
  approvedTrails?: DNSPublicWidgetSnapshot['trails'];
  approvedWeather?: DNSPublicWidgetSnapshot['weather'];
}

export function createDNSPublicWidgetSnapshot(input: DNSWidgetPublishInput): DNSPublicWidgetSnapshot {
  const area = input.areaId === null ? null : REPORTING_AREAS.find(a => a.id === input.areaId && a.active);
  if (input.areaId !== null && !area) throw new Error('Unknown or inactive area');
  if (!SEASONS.some(s => s.id === input.seasonId)) throw new Error('Unknown season');
  if (!input.revision.trim() || !Number.isFinite(Date.parse(input.publishedAt))) throw new Error('Invalid publication metadata');
  if (input.approvedLogo && (!/^https:\/\//i.test(input.approvedLogo.url) || !input.approvedLogo.alt.de || !input.approvedLogo.alt.it || !input.approvedLogo.alt.en)) {
    throw new Error('Unverified public logo');
  }

  const validateReading = (reading: { status: string; observedAt: string | null }, numbers: readonly (number | null)[]) => {
    if (!['available', 'unavailable', 'stale'].includes(reading.status)) throw new Error('Invalid availability');
    if (reading.status === 'available' && (!reading.observedAt || !Number.isFinite(Date.parse(reading.observedAt)))) throw new Error('Missing observation date');
    if (numbers.some(n => n !== null && (!Number.isFinite(n) || n < 0))) throw new Error('Invalid operational value');
  };
  if (input.approvedTrails) {
    validateReading(input.approvedTrails, [input.approvedTrails.openKm, input.approvedTrails.totalKm]);
    if (input.approvedTrails.openKm !== null && input.approvedTrails.totalKm !== null && input.approvedTrails.openKm > input.approvedTrails.totalKm) throw new Error('Open km exceed total km');
  }
  if (input.approvedWeather) {
    validateReading(input.approvedWeather, [input.approvedWeather.snowDepthCm]);
    if (input.approvedWeather.temperatureC !== null && !Number.isFinite(input.approvedWeather.temperatureC)) throw new Error('Invalid temperature');
  }

  const prices = input.approvedPrices.filter(p =>
    p.active &&
    p.seasonId === input.seasonId &&
    p.currency === 'EUR' &&
    Number.isFinite(p.unitPrice) && p.unitPrice >= 0 &&
    (p.scopeType === 'network' && input.areaId === null ||
      p.scopeType === 'reportingArea' && p.scopeId === input.areaId) &&
    (!p.validFrom || p.validFrom <= input.publishedAt.slice(0, 10)) &&
    (!p.validTo || p.validTo >= input.publishedAt.slice(0, 10))
  ).map(p => ({
    productCode: p.productCode,
    currency: p.currency,
    amount: p.unitPrice,
    ...(p.validFrom ? { validFrom: p.validFrom } : {}),
    ...(p.validTo ? { validTo: p.validTo } : {}),
  }));

  return {
    schemaVersion: DNS_PUBLIC_WIDGET_SCHEMA_VERSION,
    revision: input.revision,
    publishedAt: input.publishedAt,
    seasonId: input.seasonId,
    areaId: input.areaId,
    areaName: area?.localizedName ?? { de: 'Dolomiti NordicSki', it: 'Dolomiti NordicSki', en: 'Dolomiti NordicSki' },
    logo: input.approvedLogo ?? null,
    pricing: { status: prices.length ? 'available' : 'unavailable', updatedAt: prices.length ? input.publishedAt : null, items: prices },
    trails: input.approvedTrails ?? { status: 'unavailable', observedAt: null, openKm: null, totalKm: null },
    weather: input.approvedWeather ?? { status: 'unavailable', observedAt: null, temperatureC: null, snowDepthCm: null },
  };
}
