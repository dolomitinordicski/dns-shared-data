import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { createDigitalPassHandler } from './digital-pass-http.mjs';
// Dedicated runtime identity; never inherit the default Functions/Compute service account.
const DIGITAL_PASS_RUNTIME_SA = 'dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com';
const key = defineSecret('DNS_PASS_HMAC_KEY');
const origins = defineString('DNS_PASS_ALLOWED_ORIGINS');
const revision = defineString('DNS_PASS_INVENTORY_REVISION');
const start = defineString('DNS_PASS_VALID_FROM', { default: '2026-11-15T00:00:00+01:00' });
const end = defineString('DNS_PASS_VALID_UNTIL', { default: '2027-05-01T00:00:00+02:00' });
const googleWalletIssuer = defineString('DNS_GOOGLE_WALLET_ISSUER_ID', { default: '' });
const verificationBase = defineString('DNS_PASS_VERIFICATION_BASE', { default: '' });
const notice = defineString('DNS_PASS_PRIVACY_NOTICE_VERSION');
// Fail closed for the initial controlled deploy: never enable public registration by default.
const registrationEnabled = defineString('DNS_PASS_REGISTRATION_ENABLED', { default: 'false' });
// Region must be reviewed together with DNS Core data residency before deployment.
const region = defineString('DNS_PASS_REGION', { default: 'europe-west8' });
export const digitalPassApi = onRequest({ region, serviceAccount: DIGITAL_PASS_RUNTIME_SA, secrets: [key], maxInstances: 10, invoker: 'public' }, async (req, res) => {
  try {
    const app = getApps()[0] ?? initializeApp();
    const handler = createDigitalPassHandler({ db: getFirestore(app), auth: getAuth(app), hmacSecret: key.value(),
      allowedOrigins: origins.value().split(',').map(v => v.trim()).filter(Boolean), inventoryRevision: revision.value(),
      registrationEnabled: registrationEnabled.value() === 'true',
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
