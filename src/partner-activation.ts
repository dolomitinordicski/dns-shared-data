/** Partner activation contract and pure policy guardrails. Backend implementation NOT included. */
export const PARTNER_ACTIVATION_SCHEMA_VERSION = 1 as const;

export type ActivationStatus =
  | 'started' | 'email-verified' | 'claim-pending' | 'approved' | 'active' | 'rejected' | 'expired';

export type EstablishmentClaimMethod =
  | 'preverified-contact' | 'single-use-claim-token' | 'dns-review';

export interface PartnerActivationApplication {
  applicationId: string;
  establishmentId?: string;
  claimantAuthUid?: string;
  emailVerifiedAt?: string;
  /** Token possession must be verified by backend, not this untrusted enum. */
  claimMethod?: EstablishmentClaimMethod;
  claimApprovedBy?: string;
  claimApprovedAt?: string;
  status: ActivationStatus;
  authorizedBedCount?: number | null;
  roomCount?: number | null;
  unitCount?: number | null;
  source: 'self-declared';
  updatedAt: string;
}

/** No client or hotel can approve itself. Caller is trusted server role. */
export type ActivationActor = 'claimant' | 'trusted-reviewer' | 'system';
const transitions: Readonly<Record<ActivationStatus, readonly ActivationStatus[]>> = {
  started: ['email-verified','expired'],
  'email-verified': ['claim-pending','expired'],
  'claim-pending': ['approved','rejected','expired'],
  approved: ['active'],
  active: [],
  rejected: [],
  expired: [],
};
export function canTransitionActivation(
  record: PartnerActivationApplication, next: ActivationStatus, actor: ActivationActor,
): boolean {
  if (!transitions[record.status].includes(next)) return false;
  if (next === 'email-verified') return !!record.emailVerifiedAt && actor === 'system';
  if (next === 'claim-pending') return !!record.emailVerifiedAt && !!record.claimantAuthUid && actor === 'system';
  if (next === 'approved') return actor === 'trusted-reviewer' && !!record.claimApprovedAt && !!record.claimApprovedBy && !!record.claimMethod;
  if (next === 'active') return actor === 'system' && !!record.establishmentId && !!record.claimantAuthUid && !!record.claimApprovedAt;
  if (next === 'rejected') return actor === 'trusted-reviewer';
  return actor === 'system';
}

/** For self-declarations: null/undefined means unknown, never zero. */
export function validateActivationCapacity(application: PartnerActivationApplication): boolean {
  return [application.authorizedBedCount, application.roomCount, application.unitCount]
    .every(n => n == null || (Number.isInteger(n) && n >= 0));
}

/**
 * This contract intentionally excludes OTP values, password, password hash,
 * guest data, and free-form PII. Backend must separately enforce factor
 * challenge hashing, TTL, rate limits, preapproved email-to-tenant mapping,
 * trusted approval, idempotency, and atomic membership/grant provisioning.
 */
