import type {
  DNSGlobalRole,
  DNSMembershipRole,
  DNSPermission,
} from './access-control.js';

export const DNS_IDENTITY_UI_VERSION = '1.0.0' as const;

export const DNS_ACCESS_UI_STATE_IDS = [
  'allowed',
  'restricted',
  'no-access',
  'inactive',
] as const;
export type DNSAccessUIState = (typeof DNS_ACCESS_UI_STATE_IDS)[number];

export const DNS_MEMBERSHIP_UI_STATE_IDS = [
  'active',
  'inactive',
  'not-yet-valid',
  'expired',
] as const;
export type DNSMembershipUIState = (typeof DNS_MEMBERSHIP_UI_STATE_IDS)[number];

export interface DNSAccountContextUI {
  userId: string;
  displayName?: string;
  email?: string;
  globalRoles?: readonly DNSGlobalRole[];
}

export interface DNSOrganizationContextUI {
  organizationId: string;
  label: string;
  membershipId?: string;
  role?: DNSMembershipRole;
  membershipState?: DNSMembershipUIState;
}

export interface DNSAccessContextUI {
  state: DNSAccessUIState;
  permissions?: readonly DNSPermission[];
  scopeType?: string;
  scopeId?: string;
  reason?: string;
}

export interface DNSIdentityContextUI {
  account: DNSAccountContextUI;
  organizations: readonly DNSOrganizationContextUI[];
  activeOrganizationId?: string | null;
  access?: DNSAccessContextUI;
}

export const DNS_IDENTITY_UI_RULES = [
  'Identity display never owns authentication credentials or session tokens.',
  'Membership answers which organization a user represents; access grants answer what the user may use.',
  'Organization switching changes active organization context only and must not change UI language automatically.',
  'Foundation renders already-resolved access context and must not become a second authorization engine.',
  'Frontend visibility is not security enforcement; server/Firestore authorization remains authoritative.',
  'A user may represent zero, one or multiple organizations.',
  'Generic partner roles are prohibited; use canonical membership roles and scoped access grants.',
  'Account and organization context must remain visually distinct.',
] as const;

export function getDNSMembershipUIState(input: {
  active: boolean;
  validFrom?: string;
  validTo?: string;
  now?: Date;
}): DNSMembershipUIState {
  if (!input.active) return 'inactive';

  const now = input.now ?? new Date();
  const from = input.validFrom ? new Date(input.validFrom) : null;
  const to = input.validTo ? new Date(input.validTo) : null;

  if (from && Number.isFinite(from.getTime()) && from > now) return 'not-yet-valid';
  if (to && Number.isFinite(to.getTime()) && to < now) return 'expired';
  return 'active';
}
