/** Aggregate Workspace usage contract. No user identifiers, device data or IPs.
 * Writes MUST be performed through a trusted service after session authorization.
 * Never let browser clients directly increment arbitrary regional counters.
 */
export const DNS_WORKSPACE_USAGE_SCHEMA_VERSION = 1 as const;
export const DNS_WORKSPACE_TRACKED_TOOLS = [
  'workspace', 'data-entry', 'analytics', 'fair', 'flyer-studio',
] as const;
export type DNSWorkspaceTrackedTool = (typeof DNS_WORKSPACE_TRACKED_TOOLS)[number];

export interface DNSWorkspaceUsageDaily {
  /** ISO date, Europe/Rome reporting timezone. */
  day: string;
  reportingAreaId: string;
  /** Session-open totals; not a unique user count. */
  sessions: number;
  toolOpens: Partial<Record<DNSWorkspaceTrackedTool, number>>;
  updatedAt: string;
}

export const DNS_WORKSPACE_USAGE_POLICY = {
  enabledByDefault: false,
  reportingTimeZone: 'Europe/Rome',
  retentionMonths: 24,
  purpose: 'aggregate-adoption-reporting',
  personalIdentifiersStored: false,
  directClientWrites: false,
  sessionDedupeRequired: true,
} as const;

/** Determines an aggregate document ID only; it does not authorize writes. */
export function workspaceUsageDailyId(day: string, reportingAreaId: string): string {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(day)) throw new Error('Invalid ISO date');
  if (!/^[a-z0-9-]+$/.test(reportingAreaId)) throw new Error('Invalid reporting area ID');
  return `${day}__${reportingAreaId}`;
}
