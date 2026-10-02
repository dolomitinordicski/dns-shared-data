import {
  DNS_ACCESS_UI_STATE_IDS,
  DNS_MEMBERSHIP_UI_STATE_IDS,
  DNS_IDENTITY_UI_RULES,
  getDNSMembershipUIState,
} from '../dist/identity-ui.js';
import { initDNSIdentityUIRuntime } from '../dist/ui/identity.js';
import { initDNSFoundation } from '../dist/foundation.js';

const errors = [];
if (JSON.stringify(DNS_ACCESS_UI_STATE_IDS) !== JSON.stringify(['allowed','restricted','no-access','inactive'])) errors.push('Unexpected access UI states.');
if (JSON.stringify(DNS_MEMBERSHIP_UI_STATE_IDS) !== JSON.stringify(['active','inactive','not-yet-valid','expired'])) errors.push('Unexpected membership UI states.');
if (getDNSMembershipUIState({ active: false }) !== 'inactive') errors.push('Inactive membership resolution failed.');
if (getDNSMembershipUIState({ active: true, validFrom: '2999-01-01T00:00:00Z', now: new Date('2026-01-01T00:00:00Z') }) !== 'not-yet-valid') errors.push('Future membership resolution failed.');
if (!DNS_IDENTITY_UI_RULES.some((r) => r.includes('second authorization engine'))) errors.push('Authorization-boundary rule missing.');
initDNSIdentityUIRuntime(undefined);
const foundation = initDNSFoundation();
foundation.disconnect();
if (errors.length) { console.error('F6 identity UI validation failed:'); errors.forEach((e)=>console.error('- '+e)); process.exit(1); }
console.log('✓ F6 identity/access UI contract valid');
