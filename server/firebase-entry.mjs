import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { dataEntryNumberingStart } from './digital-pass-data-entry-inventory.mjs';
import { controlledPilotSettings } from './digital-pass-controlled-pilot.mjs';
import { createDigitalPassHandler } from './digital-pass-http.mjs';
// Dedicated runtime identity; never inherit the default Functions/Compute service account.
const DIGITAL_PASS_RUNTIME_SA = 'dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com';
const key = defineSecret('DNS_PASS_HMAC_KEY');
// A closed technical deployment must reject all operational routes before Auth, Firestore or inventory access.
const apiClosed = defineString('DNS_PASS_API_CLOSED', { default:'true' });
const origins = defineString('DNS_PASS_ALLOWED_ORIGINS');
const revision = defineString('DNS_PASS_INVENTORY_REVISION', { default:'' });
// Explicit opt-in keeps existing snapshot/emulator deployments compatible.
const inventorySource = defineString('DNS_PASS_INVENTORY_SOURCE', { default:'snapshot' });
const numberingStart = defineString('DNS_PASS_DATA_ENTRY_START_NUMBER', { default:'' });
const start = defineString('DNS_PASS_VALID_FROM', { default: '2026-11-15T00:00:00+01:00' });
const end = defineString('DNS_PASS_VALID_UNTIL', { default: '2027-05-01T00:00:00+02:00' });
const googleWalletIssuer = defineString('DNS_GOOGLE_WALLET_ISSUER_ID', { default: '' });
const verificationBase = defineString('DNS_PASS_VERIFICATION_BASE', { default: '' });
const notice = defineString('DNS_PASS_PRIVACY_NOTICE_VERSION', { default:'' });
// Fail closed for the initial controlled deploy: never enable public registration by default.
const registrationEnabled = defineString('DNS_PASS_REGISTRATION_ENABLED', { default: 'false' });
// Empty claim flag preserves the reviewed legacy gate; explicit true permits
// verified sale confirmation while optional pass registration remains false.
const possessionClaimEnabled = defineString('DNS_PASS_POSSESSION_CLAIM_ENABLED', { default: '' });
const pilotEnabled = defineString('DNS_PASS_PILOT_ENABLED', { default: 'false' });
const pilotOrganization = defineString('DNS_PASS_PILOT_ORGANIZATION_ID', { default: '' });
const pilotNumber = defineString('DNS_PASS_PILOT_PASS_NUMBER', { default: '' });
const pilotOperator = defineString('DNS_PASS_PILOT_OPERATOR_UID', { default: '' });
const pilotUntil = defineString('DNS_PASS_PILOT_UNTIL', { default: '' });
// Region must be reviewed together with DNS Core data residency before deployment.
const region = defineString('DNS_PASS_REGION', { default: 'europe-west8' });
export const digitalPassApi = onRequest({ region, serviceAccount: DIGITAL_PASS_RUNTIME_SA, secrets: [key], maxInstances: 10, invoker: 'public' }, async (req, res) => {
  try {
    if (apiClosed.value() !== 'false') {
      const origin = req.get('Origin');
      const allowed = (origins.value() || '').split(',').map(v => v.trim()).filter(Boolean);
      res.set('Cache-Control','no-store');res.set('Vary','Origin');
      if (origin && !allowed.includes(origin)) return res.status(403).json({error:'FORBIDDEN'});
      if (origin) res.set('Access-Control-Allow-Origin',origin);
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Headers','Authorization, Content-Type');
        res.set('Access-Control-Allow-Methods','POST, OPTIONS');return res.status(204).end();
      }
      return res.status(503).json({error:'SERVICE_UNAVAILABLE'});
    }
    const pilot = controlledPilotSettings({ enabled: pilotEnabled.value(),
      organizationId: pilotOrganization.value(), passNumber: pilotNumber.value(),
      operatorUid: pilotOperator.value(), until: pilotUntil.value() });
    if (!['', 'true', 'false'].includes(possessionClaimEnabled.value())) throw Error('INVALID_SALE_CLAIM_FLAG');
    const app = getApps()[0] ?? initializeApp();
    const handler = createDigitalPassHandler({ db: getFirestore(app), auth: getAuth(app), hmacSecret: key.value(),
      allowedOrigins: origins.value().split(',').map(v => v.trim()).filter(Boolean), inventoryRevision: revision.value(),
      inventorySource: inventorySource.value(),
      dataEntryStartNumber: inventorySource.value() === 'data-entry' ? dataEntryNumberingStart(numberingStart.value()) : undefined,
      registrationEnabled: registrationEnabled.value() === 'true',
      possessionClaimEnabled: possessionClaimEnabled.value() === '' ? registrationEnabled.value() === 'true' : possessionClaimEnabled.value() === 'true',
      pilot,
      validFrom: Date.parse(start.value()), validUntil: Date.parse(end.value()), noticeVersion: notice.value(),
      walletIssuerId: googleWalletIssuer.value(), walletSigningJson: '', verificationBase: verificationBase.value(),
      walletOrigins: origins.value().split(',').map(v => v.trim()).filter(Boolean) });
    return await handler(req, res);
  } catch {
    res.set('Cache-Control', 'no-store'); return res.status(503).json({ error: 'SERVICE_UNAVAILABLE' });
  }
});

// DNS Polls SSO: deploy ONLY via the manually gated, function-specific workflow.
export { pollsBridgeApi } from './polls-bridge-entry.mjs';

