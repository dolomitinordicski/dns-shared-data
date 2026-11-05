/**
 * DNS Trail Status — provisional read contract (v0.1).
 *
 * IMPORTANT: No Contwise endpoint or field mapping has been verified.
 * This module defines the normalized output shape only. It must never
 * manufacture live data, infer open kilometres from marketing totals,
 * or conflate KP seasonal reporting with current trail conditions.
 */
export const DNS_TRAIL_STATUS_CONTRACT_VERSION = '0.1.0' as const;

export type TrailStatusAvailability = 'available' | 'partial' | 'unavailable' | 'stale';
export type TrailStatusScope = 'reportingArea' | 'network';

export interface TrailStatusSummary {
  scopeType: TrailStatusScope;
  /** Canonical reportingArea ID from src/canonical-data.ts, or 'dolomiti-nordicski'. */
  scopeId: string;
  /** Null if source lengths, status or segment uniqueness are unverified. */
  openKm: number | null;
  totalKm: number | null;
  openPercent: number | null;
  /** ISO 8601 UTC timestamp provided or verified by the data pipeline. */
  sourceUpdatedAt: string | null;
  /** When our ingestion last successfully checked the upstream source. */
  fetchedAt: string | null;
  availability: TrailStatusAvailability;
  source: 'contwise' | 'other-approved-provider' | 'unconfigured';
  attribution: string;
  mapUrl: string;
  /** Grooming values are future optional data, not inferred from opening status. */
  lastGroomedAt?: string | null;
}

/**
 * Aggregates uniquely keyed physical segments after a provider-specific
 * normalization step. Rejects ambiguous segment-to-area assignments.
 * Unknown opening states are not treated as closed; returns null if incomplete.
 */
export interface NormalizedTrailSegment {
  id: string;
  reportingAreaId: string;
  lengthKm: number;
  open: boolean | null;
}

export function summarizeTrailSegments(
  segments: readonly NormalizedTrailSegment[],
  scopeId: string,
): Pick<TrailStatusSummary, 'openKm' | 'totalKm' | 'openPercent'> {
  const unique = new Map<string, NormalizedTrailSegment>();
  for (const segment of segments) {
    if (typeof segment.id !== 'string' || !segment.id.trim()
        || typeof segment.reportingAreaId !== 'string' || !segment.reportingAreaId.trim()) {
      return { openKm: null, totalKm: null, openPercent: null };
    }
    const previous = unique.get(segment.id);
    if (previous && (previous.reportingAreaId !== segment.reportingAreaId
        || previous.lengthKm !== segment.lengthKm || previous.open !== segment.open)) {
      return { openKm: null, totalKm: null, openPercent: null };
    }
    unique.set(segment.id, segment);
  }
  // Validate duplicate assignments before selecting an area so network and
  // area summaries cannot silently disagree about the same physical segment.
  const rows = [...unique.values()].filter(row =>
    scopeId === 'dolomiti-nordicski' || row.reportingAreaId === scopeId);
  if (rows.length === 0 || rows.some(row => typeof row.open !== 'boolean'
      || !Number.isFinite(row.lengthKm) || row.lengthKm < 0)) {
    return { openKm: null, totalKm: null, openPercent: null };
  }
  const totalKm = rows.reduce((sum, row) => sum + row.lengthKm, 0);
  const openKm = rows.filter(row => row.open).reduce((sum, row) => sum + row.lengthKm, 0);
  if (!Number.isFinite(totalKm * 100) || !Number.isFinite(openKm * 100)) {
    return { openKm: null, totalKm: null, openPercent: null };
  }
  return {
    openKm: Math.round(openKm * 100) / 100,
    totalKm: Math.round(totalKm * 100) / 100,
    openPercent: totalKm > 0 ? Math.round((openKm / totalKm) * 1000) / 10 : null,
  };
}
