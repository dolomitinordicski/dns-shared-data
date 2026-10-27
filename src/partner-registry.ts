/** DNS Partner Registry v1: pure import, temporal selection and quality checks. No persistence. */
import type { ReportingAreaId } from './canonical-data.js';
import type { PartnerEstablishment, PartnerCapacityRevision, PartnerPartnership } from './partner-contracts.js';

export interface EstablishmentAreaRevision {
  revisionId: string;
  establishmentId: string;
  reportingAreaId: ReportingAreaId;
  validFrom: string;
  validTo?: string;
}

export type RegistryIssueCode =
  | 'duplicate-establishment-id'
  | 'missing-organization'
  | 'missing-area'
  | 'invalid-capacity'
  | 'overlapping-capacity'
  | 'overlapping-area'
  | 'unresolved-legacy-match';

export interface RegistryIssue {
  code: RegistryIssueCode;
  establishmentId: string;
  detail: string;
}

export interface LegacyPartnerRow {
  sourceSystem: string;
  sourceRowId: string;
  organizationId?: string;
  name: string;
  reportingAreaId?: ReportingAreaId;
  website?: string;
}
export interface LegacyMatch {
  sourceSystem: string;
  sourceRowId: string;
  establishmentId: string;
  reviewedBy: string;
  reviewedAt: string;
}

export function normalizedPartnerName(name: string): string {
  return name.trim().normalize('NFKC').toLocaleLowerCase('de').replace(/\s+/g, ' ');
}

/** Candidate suggestions, never an automatic merge. Same names across areas are not proof of identity. */
export function suggestLegacyMatches(row: LegacyPartnerRow, existing: readonly PartnerEstablishment[]): readonly string[] {
  const key = normalizedPartnerName(row.name);
  if (!key) return [];
  return existing.filter(e => normalizedPartnerName(e.displayName) === key
    && (!row.reportingAreaId || e.reportingAreaId === row.reportingAreaId))
    .map(e => e.establishmentId);
}

export function resolveLegacyMatch(row: LegacyPartnerRow, decisions: readonly LegacyMatch[]): string | null {
  const matches = decisions.filter(d => d.sourceSystem === row.sourceSystem && d.sourceRowId === row.sourceRowId);
  if (matches.length > 1) throw new Error('Ambiguous legacy review: ' + row.sourceRowId);
  return matches[0]?.establishmentId ?? null;
}

export function atDate<T extends { validFrom: string; validTo?: string }>(
  rows: readonly T[], date: string,
): T | null {
  const matches = rows.filter(r => r.validFrom <= date && (r.validTo === undefined || date < r.validTo));
  if (matches.length > 1) throw new Error('Overlapping effective revisions');
  return matches[0] ?? null;
}

export function validatePartnerRegistry(
  establishments: readonly PartnerEstablishment[],
  capacities: readonly PartnerCapacityRevision[],
  areas: readonly EstablishmentAreaRevision[],
): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const found = new Set<string>();
  for (const e of establishments) {
    if (found.has(e.establishmentId)) issues.push({ code:'duplicate-establishment-id',establishmentId:e.establishmentId,detail:'ID occurs more than once' });
    found.add(e.establishmentId);
    if (!e.organizationId) issues.push({code:'missing-organization',establishmentId:e.establishmentId,detail:'Canonical organizationId required'});
    if (!e.reportingAreaId) issues.push({code:'missing-area',establishmentId:e.establishmentId,detail:'Canonical reportingAreaId required'});
  }
  for (const c of capacities) {
    if ([c.beds,c.rooms,c.units,c.openingDays].some(n => n != null && (!Number.isInteger(n) || n < 0)))
      issues.push({code:'invalid-capacity',establishmentId:c.establishmentId,detail:'Capacity fields must be nonnegative integers or unknown'});
  }
  for (const e of establishments) {
    const cap = capacities.filter(c=>c.establishmentId===e.establishmentId).sort((a,b)=>a.validFrom.localeCompare(b.validFrom));
    for(let i=1;i<cap.length;i++) if(!cap[i-1].validTo || cap[i-1].validTo! > cap[i].validFrom)
      issues.push({code:'overlapping-capacity',establishmentId:e.establishmentId,detail:'Capacity date ranges overlap'});
    const ar = areas.filter(a=>a.establishmentId===e.establishmentId).sort((a,b)=>a.validFrom.localeCompare(b.validFrom));
    for(let i=1;i<ar.length;i++) if(!ar[i-1].validTo || ar[i-1].validTo! > ar[i].validFrom)
      issues.push({code:'overlapping-area',establishmentId:e.establishmentId,detail:'Area date ranges overlap'});
  }
  return issues;
}

/** Historical area snapshot. Refuses to fabricate an area on dates where history is absent. */
export function partnerRegistrySnapshot(
  establishments: readonly PartnerEstablishment[],
  partnerships: readonly PartnerPartnership[],
  areaRevisions: readonly EstablishmentAreaRevision[],
  capacities: readonly PartnerCapacityRevision[],
  area: ReportingAreaId,
  asOf: string,
) {
  const current = establishments.filter(e => {
    const actualArea = atDate(areaRevisions.filter(r=>r.establishmentId===e.establishmentId),asOf);
    return actualArea?.reportingAreaId===area;
  });
  const ids = new Set(current.map(e=>e.establishmentId));
  const active = new Set(partnerships.filter(p => p.status==='active' &&
    p.effectiveFrom <= asOf && (p.effectiveTo===undefined || asOf < p.effectiveTo) &&
    ids.has(p.establishmentId)).map(p=>p.establishmentId));
  let knownBeds=0, unknownBeds=0;
  for (const establishmentId of active) {
    const cap=atDate(capacities.filter(c=>c.establishmentId===establishmentId),asOf);
    if (cap?.beds == null) {unknownBeds++;continue;}
    if (!Number.isInteger(cap.beds) || cap.beds < 0) throw new Error('Invalid bed capacity: '+establishmentId);
    knownBeds+=cap.beds;
  }
  return { reportingAreaId:area, asOf, activeEstablishments:active.size, knownBeds, establishmentsWithKnownBeds:active.size-unknownBeds, establishmentsWithUnknownBeds:unknownBeds };
}
