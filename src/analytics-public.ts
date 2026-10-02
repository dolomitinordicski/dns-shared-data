/**
 * Public Analytics read model.
 *
 * This contract is intentionally aggregate-only. It MUST NOT contain raw
 * ticket-sale rows, personal data, authentication context, editable FAIR
 * inputs, or organization-level operational records that are not already
 * approved for public Analytics presentation.
 */

import type { ReportingAreaId, SeasonId } from './canonical-data.js';
import type { TicketProductCode, TicketSalesChannel } from './seasonal-operational-data.js';

export const ANALYTICS_PUBLIC_SCHEMA_VERSION = 1 as const;
export const ANALYTICS_PUBLIC_COLLECTION = 'analyticsPublicSnapshots' as const;

export type AnalyticsPublicPublicationStatus = 'draft' | 'published' | 'superseded';

export interface AnalyticsPublicMeasure {
  quantity: number;
  revenue: number;
}

export interface AnalyticsPublicSalesAggregate {
  totalTickets: number;
  totalRevenue: number;
  averageTicketPrice: number;
  byProduct: Partial<Record<TicketProductCode, AnalyticsPublicMeasure>>;
  byReportingArea: Partial<Record<ReportingAreaId, AnalyticsPublicMeasure>>;
  byReportingAreaProduct: Partial<
    Record<ReportingAreaId, Partial<Record<TicketProductCode, AnalyticsPublicMeasure>>>
  >;
  byChannel: Partial<Record<TicketSalesChannel, AnalyticsPublicMeasure>>;
}

export interface AnalyticsPublicAnnualPoint {
  seasonId: SeasonId;
  totalTickets: number;
  totalRevenue: number;
  avgPrice: number;
  qty: {
    day: number;
    wka: number;
    wkd: number;
    ska: number;
    skd: number;
  };
  revenue: {
    day: number;
    wka: number;
    wkd: number;
    ska: number;
    skd: number;
  };
}

export interface AnalyticsPublicKpMilestone {
  id: string;
  date: string;
  order: number;
}

export interface AnalyticsPublicKpAreaPoint {
  potentialOperationalKm: number;
  openedKm: number;
  artificialSnowKm: number;
  naturalSnowKm: number;
}

export interface AnalyticsPublicKpPartnerRow {
  label: string;
  reportingAreaId?: ReportingAreaId;
  includeInKp: boolean;
  potentialOperationalKm: number;
  milestones: ReadonlyArray<{
    milestoneId: string;
    openedKm: number;
    artificialSnowKm: number;
    naturalSnowKm: number;
  }>;
}

export interface AnalyticsPublicKpAggregate {
  milestones: readonly AnalyticsPublicKpMilestone[];
  byAreaMilestone: Partial<
    Record<ReportingAreaId, Record<string, AnalyticsPublicKpAreaPoint>>
  >;
  partners?: readonly AnalyticsPublicKpPartnerRow[];
}

export interface AnalyticsPublicFairRegion {
  reportingAreaId: ReportingAreaId;
  label: string;
  PN: number;
}

export interface AnalyticsPublicSnapshot {
  id: string;
  seasonId: SeasonId;
  schemaVersion: typeof ANALYTICS_PUBLIC_SCHEMA_VERSION;
  revision: number;
  publicationStatus: AnalyticsPublicPublicationStatus;
  generatedAt: string;
  publishedAt?: string;
  sourceRevision?: string;
  /** Human-readable statement of the approved aggregate sources. */
  sourceSummary: string;
  sales: AnalyticsPublicSalesAggregate;
  annual?: {
    points: readonly AnalyticsPublicAnnualPoint[];
  };
  kp?: AnalyticsPublicKpAggregate;
  fair?: {
    regions: readonly AnalyticsPublicFairRegion[];
  };
}

/**
 * Public snapshots are immutable publication revisions. A new publication
 * creates a new revision; consumers should select the highest published
 * revision for the requested season.
 */
export function isPublishedAnalyticsSnapshot(
  value: AnalyticsPublicSnapshot,
): boolean {
  return value.publicationStatus === 'published';
}
