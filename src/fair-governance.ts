export const DNS_FAIR_GOVERNANCE_VERSION = '1.0.0' as const;

export type FAIRSnapshotStatus = 'draft' | 'review' | 'approved' | 'superseded';

export type FAIRSourceType =
  | 'analytics'
  | 'data-entry'
  | 'fair-manual'
  | 'ticketing'
  | 'import'
  | 'system'
  | 'external-source';

export interface FAIRSourceReference {
  type: FAIRSourceType;
  sourceId: string;
  sourceRevision?: string;
  sourceDocumentLabel?: string;
}

export interface FAIRSnapshotApproval {
  approvedAt: string;
  approvalRef: string;
  approvalBody?: string;
}

export interface FAIRInputRecord {
  key: string;
  scopeType: 'network' | 'reportingArea' | 'destination' | 'organization';
  scopeId: string;
  metricId: string;
  value: number | string | boolean | null;
  unit?: string;
  source: FAIRSourceReference;
}

export interface FAIRInputSnapshot {
  snapshotId: string;
  seasonId: string;
  revision: number;
  status: FAIRSnapshotStatus;
  canonicalDatasetVersion: string;
  fairModelVersion: string;
  records: readonly FAIRInputRecord[];
  createdAt: string;
  createdBy: string;
  approval?: FAIRSnapshotApproval;
  supersedesSnapshotId?: string;
  integrityHash: string;
}

export interface FAIRResultRow {
  scopeId: string;
  score?: number;
  contribution?: number;
  values?: Readonly<Record<string, number | string | boolean | null>>;
}

export interface FAIRResultSnapshot {
  resultSnapshotId: string;
  inputSnapshotId: string;
  seasonId: string;
  revision: number;
  status: FAIRSnapshotStatus;
  canonicalDatasetVersion: string;
  fairModelVersion: string;
  rows: readonly FAIRResultRow[];
  controlTotals?: Readonly<Record<string, number>>;
  createdAt: string;
  createdBy: string;
  approval?: FAIRSnapshotApproval;
  supersedesResultSnapshotId?: string;
  integrityHash: string;
}

export function isApprovedFAIRSnapshot(
  snapshot: FAIRInputSnapshot | FAIRResultSnapshot,
): boolean {
  return snapshot.status === 'approved' && Boolean(snapshot.approval?.approvalRef);
}
