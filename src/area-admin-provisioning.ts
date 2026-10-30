import {
  ORGANIZATIONS, REPORTING_AREAS,
  type OrganizationId,
} from './canonical-data.js';
import { buildAccessGrantId, type DNSPermission } from './access-control.js';

/** Area Admin provisioning contract, no Firebase side effects.
 * Only trusted server code may persist these objects, after verifying the
 * caller's active dns-admin profile with Firebase Admin SDK.
 */
export const AREA_ADMIN_ACCESS_PERMISSIONS = [
  'ticketOrders.read', 'ticketOrders.write',
  'ticketSales.read', 'ticketSales.write',
  'kp.read', 'kp.write', 'pricing.read',
  'flyer.read', 'flyer.write',
] as const satisfies readonly DNSPermission[];

export type AreaAdminProvisioningInput = {
  uid: string;
  organizationId: OrganizationId;
  reportingAreaId: string;
  preferredLanguage: 'it' | 'de' | 'en';
};

export function prepareAreaAdminProvisioning(input: AreaAdminProvisioningInput) {
  if (!/^[A-Za-z0-9:_-]{5,128}$/.test(input.uid)) throw new Error('Invalid Firebase Auth UID');
  const organization = ORGANIZATIONS.find(o => o.id === input.organizationId && o.active);
  if (!organization || organization.organizationType !== 'tourism-organisation')
    throw new Error('Organization not eligible for Area Admin');
  if (!REPORTING_AREAS.some(a => a.id === input.reportingAreaId && a.active))
    throw new Error('Unknown reporting area');
  if (!organization.reportingAreaIds.includes(input.reportingAreaId))
    throw new Error('Organization is not related to requested reporting area');

  const membershipId = `${input.uid}__${input.organizationId}`;
  const grantId = buildAccessGrantId(input.uid, 'reportingArea', input.reportingAreaId);
  return {
    user: {
      id: input.uid, active: true, globalRoles: [] as readonly string[],
      preferredLanguage: input.preferredLanguage,
    },
    membership: {
      id: membershipId, userId: input.uid, organizationId: input.organizationId,
      role: 'contributor' as const, active: true,
    },
    grant: {
      id: grantId, userId: input.uid, scopeType: 'reportingArea' as const,
      scopeId: input.reportingAreaId,
      permissions: [...AREA_ADMIN_ACCESS_PERMISSIONS], active: true,
    },
  };
}
