/** Explicitly staged Firebase Functions entry. Not exported by firebase-entry.mjs
 * until the separate dns-polls IAM service identity has been reviewed. */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import { createPollsBridgeHandler } from './polls-bridge-http.mjs';

const origins = defineString('DNS_POLLS_ALLOWED_ORIGINS');
const serviceAccount = defineString('DNS_POLLS_BRIDGE_SERVICE_ACCOUNT');
const region = defineString('DNS_POLLS_REGION', { default: 'europe-west8' });

export const pollsBridgeApi = onRequest({
  region, serviceAccount, maxInstances: 5, invoker: 'public',
}, async (req, res) => {
  try {
    const core = getApps().find(app => app.name === '[DEFAULT]') ?? initializeApp();
    const polls = getApps().find(app => app.name === 'dns-polls-bridge') ??
      initializeApp({ projectId: 'dns-polls' }, 'dns-polls-bridge');
    const handler = createPollsBridgeHandler({
      auth: getAuth(core), coreDb: getFirestore(core), pollsDb: getFirestore(polls),
      allowedOrigins: origins.value().split(',').map(s => s.trim()).filter(Boolean),
    });
    return await handler(req, res);
  } catch {
    res.set('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'SERVICE_UNAVAILABLE' });
  }
});
