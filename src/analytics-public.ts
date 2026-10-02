/**
 * Public aggregate Analytics snapshot.
 *
 * Exact-document, read-only publication for the DNS Analytics frontend.
 * No raw sales rows, auth data or personal data are allowed here.
 */
export const ANALYTICS_PUBLIC_SCHEMA_VERSION = 1 as const;
export const ANALYTICS_PUBLIC_COLLECTION = 'analyticsPublicSnapshots' as const;

export interface AnalyticsLegacyBaseline {
  labels: {
    regions: string[];
    seasons: string[];
    ticketTypes: string[];
  };
  seasonOverview: Record<string, unknown>;
  annual: Record<string, unknown>;
  regional: Record<string, unknown>;
  kpRegions: Array<Record<string, unknown>>;
  kpPartners: Array<Record<string, unknown>>;
  advancedDefaults: Record<string, unknown>;
  overnightAreas: Array<Record<string, unknown>>;
  intensityAreas: Array<Record<string, unknown>>;
}

export interface AnalyticsPublicSnapshot {
  id: string;
  seasonId: string;
  schemaVersion: typeof ANALYTICS_PUBLIC_SCHEMA_VERSION;
  revision: number;
  publicationStatus: 'published';
  generatedAt: string;
  source: {
    auditSnapshotId: 'legacy-dashboard-v1';
    auditSourceSha256: string;
    analyticsCommitBaseline: string;
  };
  /**
   * Exact zero-loss copy of the validated pre-migration runtime datasets.
   * This is retained so every field can be checked before switching source.
   */
  baseline: AnalyticsLegacyBaseline;
  /**
   * Canonical FAIR region inputs are published alongside the frozen baseline
   * because current Overnight/Intensity views already depend on FAIR.
   */
  fair?: {
    sourceDocument: 'fairModel/ws-2026-27';
    clientUpdatedAt?: number;
    regions: Array<Record<string, unknown>>;
  };
}

export function analyticsPublicSnapshotId(seasonId: string) {
  return seasonId;
}
