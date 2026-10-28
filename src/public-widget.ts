/** Public widget transport contract. No Firestore reads or privileged data in this module. */
import type { ReportingAreaId, SeasonId, LocalizedName } from './canonical-data.js';
import type { TicketProductCode, CurrencyCode } from './seasonal-operational-data.js';

export const DNS_PUBLIC_WIDGET_SCHEMA_VERSION = 1 as const;
export type DNSWidgetAvailability = 'available' | 'unavailable' | 'stale';

export interface DNSPublicWidgetLogo {
  /** Verified DNS-managed, publicly reachable asset only. */
  url: string;
  alt: LocalizedName;
}

export interface DNSPublicWidgetPrice {
  productCode: TicketProductCode;
  currency: CurrencyCode;
  amount: number;
  /** Customer-facing price only; never settlement amounts. */
  validFrom?: string;
  validTo?: string;
}

export interface DNSPublicWidgetSnapshot {
  schemaVersion: typeof DNS_PUBLIC_WIDGET_SCHEMA_VERSION;
  revision: string;
  publishedAt: string;
  seasonId: SeasonId;
  /** null represents the full network; otherwise canonical Shared Data ID. */
  areaId: ReportingAreaId | null;
  areaName: LocalizedName;
  logo: DNSPublicWidgetLogo | null;
  pricing: {
    status: DNSWidgetAvailability;
    updatedAt: string | null;
    items: readonly DNSPublicWidgetPrice[];
  };
  trails: {
    status: DNSWidgetAvailability;
    observedAt: string | null;
    openKm: number | null;
    totalKm: number | null;
  };
  weather: {
    status: DNSWidgetAvailability;
    observedAt: string | null;
    temperatureC: number | null;
    snowDepthCm: number | null;
  };
}

/** Consumer-side shape guard; publishers must additionally validate authorization,
 * publication status, timestamps and source freshness server-side. */
export function isDNSPublicWidgetSnapshot(value: unknown): value is DNSPublicWidgetSnapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<DNSPublicWidgetSnapshot>;
  return s.schemaVersion === DNS_PUBLIC_WIDGET_SCHEMA_VERSION
    && typeof s.revision === 'string'
    && typeof s.publishedAt === 'string'
    && typeof s.seasonId === 'string'
    && (s.areaId === null || typeof s.areaId === 'string')
    && !!s.areaName && typeof s.areaName.de === 'string'
    && typeof s.areaName.it === 'string' && typeof s.areaName.en === 'string'
    && !!s.pricing && Array.isArray(s.pricing.items)
    && !!s.trails && !!s.weather;
}
