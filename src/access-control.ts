/**
 * DNS Access Control v0.1
 *
 * Shared authorization contract for authenticated DNS tools.
 * Firebase Authentication owns identity. Firestore stores only authorization
 * metadata needed by applications and security rules.
 */

import type {
  CanonicalScopeType,
  Language,
  OrganizationId,
} from './canonical-data.js';

export const ACCESS_CONTROL_SCHEMA_VERSION = 1 as const;

export type DNSGlobalRole = 'dns-admin';

export type DNSMembershipRole =
  | 'viewer'
  | 'contributor'
  | 'reviewer';

export type DNSPermission =
  | 'season.read'
  | 'season.manage'
  | 'pricing.read'
  | 'pricing.manage'
  | 'ticketOrders.read'
  | 'ticketOrders.write'
  | 'ticketOrders.verify'
  | 'ticketSales.read'
  | 'ticketSales.write'
  | 'ticketSales.verify'
  | 'kp.read'
  | 'kp.write'
  | 'kp.verify'
  | 'verification.read'
  | 'verification.manage';

export interface DNSUserProfile {
  /** Firebase Authentication UID. */
  id: string;
  active: boolean;
  preferredLanguage?: Language;
  /**
   * Global roles are intentionally rare. Normal partner access is represented
   * by memberships + scoped access grants.
   */
  globalRoles: readonly DNSGlobalRole[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DNSMembership {
  id: string;
  userId: string;
  organizationId: OrganizationId;
  role: DNSMembershipRole;
  active: boolean;
  validFrom?: string;
  validTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DNSAccessGrant {
  id: string;
  userId: string;
  /**
   * network       -> dolomiti-nordicski
   * reportingArea -> canonical ReportingAreaId
   * destination   -> canonical DestinationId
   * organization  -> canonical OrganizationId
   */
  scopeType: CanonicalScopeType;
  scopeId: string;
  permissions: readonly DNSPermission[];
  active: boolean;
  validFrom?: string;
  validTo?: string;
  /**
   * Audit metadata. These records are administered by trusted DNS operators,
   * not self-service browser clients.
   */
  grantedBy?: string;
  grantReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DNS_ROLE_DEFAULT_PERMISSIONS = {
  viewer: [
    'season.read',
    'pricing.read',
    'ticketOrders.read',
    'ticketSales.read',
    'kp.read',
    'verification.read',
  ],
  contributor: [
    'season.read',
    'pricing.read',
    'ticketOrders.read',
    'ticketOrders.write',
    'ticketSales.read',
    'ticketSales.write',
    'kp.read',
    'kp.write',
    'verification.read',
  ],
  reviewer: [
    'season.read',
    'pricing.read',
    'ticketOrders.read',
    'ticketOrders.verify',
    'ticketSales.read',
    'ticketSales.verify',
    'kp.read',
    'kp.verify',
    'verification.read',
    'verification.manage',
  ],
} as const satisfies Record<DNSMembershipRole, readonly DNSPermission[]>;

export const DNS_ADMIN_PERMISSIONS = [
  'season.read',
  'season.manage',
  'pricing.read',
  'pricing.manage',
  'ticketOrders.read',
  'ticketOrders.write',
  'ticketOrders.verify',
  'ticketSales.read',
  'ticketSales.write',
  'ticketSales.verify',
  'kp.read',
  'kp.write',
  'kp.verify',
  'verification.read',
  'verification.manage',
] as const satisfies readonly DNSPermission[];

export const FIRESTORE_ACCESS_COLLECTIONS = {
  users: 'users',
  memberships: 'memberships',
  accessGrants: 'accessGrants',
} as const;
