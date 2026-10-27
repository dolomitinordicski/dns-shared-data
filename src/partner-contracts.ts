/** DNS Partner domain contracts v1.0 — additive, NO persistence or live writes. */
import type { Language, ReportingAreaId, OrganizationId } from './canonical-data.js';

export const DNS_PARTNER_CONTRACT_VERSION = '1.0.0' as const;

export type ISODate = string;
export type EvidenceQuality = 'verified' | 'self-declared' | 'estimated' | 'missing' | 'not-applicable';
export type EstablishmentType = 'hotel' | 'residence' | 'apartment' | 'camping' | 'rental' | 'ski-school' | 'service-provider' | 'other';
export type PartnershipStatus = 'prospect' | 'applicant' | 'active' | 'suspended' | 'ended';
export type AccreditationStatus = 'not-assessed' | 'submitted' | 'under-review' | 'changes-requested' | 'approved' | 'rejected' | 'suspended' | 'expired' | 'revoked';
export type CriterionCategory = 'mandatory' | 'improvement' | 'informative';

export interface PartnerSource {
  system: string;
  sourceId?: string;
  recordedAt: ISODate;
  verifiedAt?: ISODate;
  quality: EvidenceQuality;
}

export interface PartnerEstablishment {
  establishmentId: string;
  organizationId: OrganizationId;
  type: EstablishmentType;
  reportingAreaId: ReportingAreaId;
  displayName: string;
  active: boolean;
  source: PartnerSource;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface PartnerCapacityRevision {
  revisionId: string;
  establishmentId: string;
  beds: number | null;
  rooms: number | null;
  units: number | null;
  validFrom: ISODate;
  validTo?: ISODate;
  /** Seasonal operational days; null means not known, NOT zero. */
  openingDays?: number | null;
  source: PartnerSource;
}

export interface PartnerPartnership {
  partnershipId: string;
  establishmentId: string;
  status: PartnershipStatus;
  effectiveFrom: ISODate;
  effectiveTo?: ISODate;
  recordedAt: ISODate;
  changedBy: string;
  reason?: string;
}

export interface PartnerCriterion {
  criterionId: string;
  criteriaSetVersion: string;
  category: CriterionCategory;
  label: Record<Language, string>;
  description?: Partial<Record<Language, string>>;
  evidenceRequired: boolean;
  /** Eligibility/evaluation is governed by a published criteria set, never by this field alone. */
  appliesTo: readonly EstablishmentType[];
}

export interface PartnerAccreditation {
  accreditationId: string;
  establishmentId: string;
  criteriaSetVersion: string;
  status: AccreditationStatus;
  decidedBy?: string;
  decidedAt?: ISODate;
  validFrom?: ISODate;
  validTo?: ISODate;
  updatedAt: ISODate;
}

export interface PartnerEvent {
  eventId: string;
  schemaVersion: typeof DNS_PARTNER_CONTRACT_VERSION;
  entityType: 'establishment' | 'partnership' | 'capacity' | 'accreditation' | 'widget' | 'case';
  entityId: string;
  eventType: string;
  occurredAt: ISODate;
  recordedAt: ISODate;
  actorId: string;
  correlationId?: string;
}

export interface PartnerAreaSeasonSnapshot {
  snapshotId: string;
  seasonId: string;
  reportingAreaId: ReportingAreaId;
  snapshotAsOf: ISODate;
  definitionVersion: string;
  activePartnerEstablishments: number;
  /** Sum only known, quality-tracked values. */
  knownPartnerBeds: number;
  establishmentsWithKnownBeds: number;
  establishmentsWithUnknownBeds: number;
  status: 'draft' | 'verified' | 'approved';
  sourceRevision: string;
  approvedBy?: string;
  approvedAt?: ISODate;
}

export interface PartnerWidgetConfiguration {
  widgetId: string;
  type: 'public' | 'certified-partner';
  establishmentId?: string;
  reportingAreaId?: ReportingAreaId;
  language: Language;
  enabledModules: readonly ('trails' | 'weather' | 'prices' | 'map' | 'dns-network')[];
  status: 'active' | 'disabled';
  designProfileVersion: string;
}

export interface BlindVoucherRecord {
  /** Opaque, server-generated and unguessable ID. */
  voucherId: string;
  establishmentId: string;
  issuedAt: ISODate;
  validFrom: ISODate;
  validTo: ISODate;
  productCode: string;
  status: 'issued' | 'redeemed' | 'cancelled' | 'expired';
  /** No guestName, guest email, address, birth date, or other guest identifying attributes. */
}

/** Pure deterministic aggregation. Input rows represent a single consistent time snapshot. */
export function countActivePartnerEstablishments(
  partnerships: readonly PartnerPartnership[],
  establishments: readonly PartnerEstablishment[],
  reportingAreaId: ReportingAreaId,
  asOf: ISODate,
): number {
  const eligibleIds = new Set(establishments.filter(e => e.active && e.reportingAreaId === reportingAreaId).map(e => e.establishmentId));
  const activeIds = new Set(partnerships.filter(p =>
    p.status === 'active' &&
    p.effectiveFrom <= asOf &&
    (p.effectiveTo === undefined || asOf < p.effectiveTo) &&
    eligibleIds.has(p.establishmentId)
  ).map(p => p.establishmentId));
  return activeIds.size;
}

/** Distinguishes missing capacity from 0; rejects inconsistent negative values. */
export function summarizePartnerBeds(
  establishments: readonly PartnerEstablishment[],
  capacities: readonly PartnerCapacityRevision[],
  asOf: ISODate,
): { knownBeds: number; withKnownBeds: number; withUnknownBeds: number } {
  let knownBeds = 0;
  let withKnownBeds = 0;
  let withUnknownBeds = 0;
  for (const establishment of establishments) {
    const rows = capacities.filter(c => c.establishmentId === establishment.establishmentId &&
      c.validFrom <= asOf && (c.validTo === undefined || asOf < c.validTo));
    if (rows.length > 1) throw new Error('Overlapping capacity revisions: ' + establishment.establishmentId);
    const beds = rows[0]?.beds;
    if (beds === undefined || beds === null) { withUnknownBeds++; continue; }
    if (!Number.isInteger(beds) || beds < 0) throw new Error('Invalid capacity: ' + establishment.establishmentId);
    knownBeds += beds;
    withKnownBeds++;
  }
  return { knownBeds, withKnownBeds, withUnknownBeds };
}
