import {issueDynamicQr} from './digital-pass-dynamic-qr.mjs';
/** Express-compatible HTTP adapter; usable by the existing Firebase environment.
 * Dependencies are injected so no credentials or project are selected at import time. */
import { assertControlledPilotOpen, assertControlledPilotOperator, assertControlledPilotAssignment, assertControlledPilotNumber } from './digital-pass-controlled-pilot.mjs';
import { loadDataEntryInventory } from './digital-pass-data-entry-inventory.mjs';
import { getGoogleWalletLink } from './digital-pass-google-wallet.mjs';
import { requestMarketingOptIn, withdrawMarketing } from './digital-pass-marketing.mjs';
import { createHmac } from 'node:crypto';
import { verifyPublicPass, renderPublicPassHtml } from './digital-pass-public-verify.mjs';
import { loadDigitalPassActor } from './digital-pass-auth.mjs';
import { prepareActivation, confirmPossession, reissueActivation, claimPreparedPossession, getPreparedPossessionStatus } from './digital-pass-activation.mjs';
import { resolveDigitalPassAssignment, PILOT_SEASON } from './digital-pass-inventory-resolver.mjs';
import { limitAttempts, registerDigitalPass, getDigitalPass, checkDigitalCredential, revokeDigitalCredential } from './digital-pass-registration.mjs';

export function createDigitalPassHandler({ db, auth, hmacSecret, allowedOrigins, inventoryRevision, inventorySource = 'snapshot', dataEntryStartNumber, validFrom, validUntil, noticeVersion, registrationEnabled = false, possessionClaimEnabled = registrationEnabled, pilot = null, marketingNoticeVersion = '', walletIssuerId = '', walletSigningJson = '', verificationBase = '', walletOrigins = [] }) {
  if (typeof hmacSecret !== 'string' || hmacSecret.length < 32 || !inventoryRevision || !noticeVersion ||
      !Array.isArray(allowedOrigins) || !allowedOrigins.length || !Number.isFinite(validFrom) || !Number.isFinite(validUntil) || validFrom >= validUntil) throw new Error('DIGITAL_PASS_CONFIGURATION_REQUIRED');
  if (!['snapshot','data-entry'].includes(inventorySource) || (inventorySource === 'data-entry' &&
      (!Number.isSafeInteger(dataEntryStartNumber) || dataEntryStartNumber < 1))) throw Error('DIGITAL_PASS_CONFIGURATION_REQUIRED');
  const resolveAssignment = async input => {
    assertControlledPilotNumber(pilot, input.passNumber);
    let snapshot;
    if (inventorySource === 'data-entry') {
      snapshot = await loadDataEntryInventory({db, startNumber:dataEntryStartNumber});
    } else {
      const record = await db.collection('passInventorySnapshots').doc(inventoryRevision).get();
      if (!record.exists) throw Error('INVENTORY_UNAVAILABLE');
      snapshot = record.data();
    }
    if (snapshot.revision !== inventoryRevision) throw Error('INVENTORY_UNAVAILABLE');
    const assignment = resolveDigitalPassAssignment({ passNumber: input.passNumber, seasonId: input.seasonId, snapshot });
    assertControlledPilotAssignment(pilot, assignment);
    return assignment;
  };
  const pilotPaths = new Set(['/v1/pass-activations/prepare', '/v1/pass-activations/claim',
    '/v1/pass-activations/status', '/v1/pass-activations/validate',
    '/v1/pass-registrations/complete', '/v1/admin/pass-activations/reissue']);
  const pilotRecord = async (collection, id) => {
    if (!pilot) return;
    if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) throw Error('FORBIDDEN');
    const record = await db.collection(collection).doc(id).get();
    if (!record.exists) throw Error('FORBIDDEN');
    assertControlledPilotAssignment(pilot, record.data());
  };
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('Vary', 'Origin');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('X-Content-Type-Options', 'nosniff');
    // Camera QR opens a public, read-only live status page. No holder data or login.
    if (req.method === 'GET' && typeof req.path === 'string' && (req.path.startsWith('/v/') || req.path.startsWith('/p/')) && /^[A-Za-z0-9_-]{43}$/.test(req.path.slice(3))) {
      try {
        const status = await verifyPublicPass({ db, token: req.path.slice(3), dynamic:req.path.startsWith('/p/') });
        res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
        return res.status(200).type('html').send(renderPublicPassHtml(status));
      } catch {
        return res.status(503).type('text/plain').send('Verification temporarily unavailable / Verifica non disponibile');
      }
    }
    const origin = req.get('Origin');
    if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'FORBIDDEN' });
    if (origin) res.set('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS'); return res.status(204).end();
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    // Disable new registrations at the HTTP boundary, before any auth or database calls.
    if (req.path === '/v1/pass-registrations/complete' && registrationEnabled !== true)
      return res.status(503).json({ error: 'REGISTRATION_DISABLED' });
    if (req.path === '/v1/pass-activations/claim' && possessionClaimEnabled !== true)
      return res.status(503).json({ error: 'POSSESSION_CLAIM_DISABLED' });
    try {
      if (pilotPaths.has(req.path)) assertControlledPilotOpen(pilot);
      if (!req.is('application/json') || !req.body || Buffer.byteLength(JSON.stringify(req.body)) > 8192) return res.status(400).json({ error: 'INVALID_REQUEST' });
      const match = /^Bearer (\S+)$/.exec(req.get('Authorization') || '');
      if (!match) return res.status(401).json({ error: 'UNAUTHORIZED' });
      // Never accept actor/grants/isDnsAdmin/email_verified from request data.
      const token = match[1];
      const identity = await auth.verifyIdToken(token, true);
      await limitAttempts({ db, key: createHmac('sha256', hmacSecret).update('request:' + identity.uid).digest('hex'), max: 30 });
      const b = req.body;
      const inventory = { passNumber: b.passNumber, seasonId: PILOT_SEASON };
      const path = req.path;
      let result;
      if (path === '/v1/pass-activations/claim') {
        await limitAttempts({ db, key: createHmac('sha256', hmacSecret).update('qr-claim:' + identity.uid).digest('hex'), max: 8 });
        result = await claimPreparedPossession({ db, identity, assignment: await resolveAssignment(inventory),
          code: b.code, hmacSecret });
      } else if (path === '/v1/pass-registrations/complete') {
        result = await registerDigitalPass({ db, identity, assignment: await resolveAssignment(inventory),
          code: b.code, givenName: b.givenName, familyName: b.familyName, language: b.language,
          noticeVersion, hmacSecret, validFrom, validUntil });
      } else if (path === '/v1/me/wallet/capabilities') {
        result = { apple: false, google: Boolean(walletIssuerId && walletSigningJson && verificationBase) };
      } else if (path === '/v1/me/wallet/google') {
        result = await getGoogleWalletLink({ db, identity, physicalPassId: b.physicalPassId,
          walletIssuerId, walletSigningJson, verificationBase, walletOrigins });
      } else if (path === '/v1/me/marketing/opt-in') {
        if (!marketingNoticeVersion) return res.status(503).json({ error: 'MARKETING_NOT_ENABLED' });
        result = await requestMarketingOptIn({ db, identity, affirmative: b.affirmative,
          language: b.language, noticeVersion: marketingNoticeVersion });
      } else if (path === '/v1/me/marketing/withdraw') {
        result = await withdrawMarketing({ db, identity });
      } else if (path === '/v1/me/digital-passes') {
        if (identity.email_verified !== true) throw new Error('UNAUTHORIZED');
        const registrations = await db.collection('passRegistrations').where('holderUid', '==', identity.uid).get();
        result = { registrationIds: registrations.docs.filter(s => s.data().status === 'ACTIVE').map(s => s.id) };
      } else if (path === '/v1/me/digital-pass/presentation') {
        const pass=await getDigitalPass({db,identity,physicalPassId:b.physicalPassId});
        const qr=await issueDynamicQr({db,identity,physicalPassId:b.physicalPassId});
        result={...pass,...qr};
      } else if (path === '/v1/me/digital-pass') {
        result = await getDigitalPass({ db, identity, physicalPassId: b.physicalPassId });
      } else {
        const actor = await loadDigitalPassActor({ db, auth, idToken: token });
        if (pilotPaths.has(path)) {
          assertControlledPilotOperator(pilot, actor);
          if (['/v1/pass-activations/status', '/v1/pass-activations/validate', '/v1/admin/pass-activations/reissue'].includes(path))
            await pilotRecord('passActivationChallenges', b.physicalPassId);
        }
        if (path === '/v1/pass-activations/prepare') result = await prepareActivation({ db, actor, ...inventory, resolveAssignment, hmacSecret });
        else if (path === '/v1/pass-activations/validate') result = await confirmPossession({ db, actor, physicalPassId: b.physicalPassId, preparationId: b.preparationId });
        else if (path === '/v1/pass-activations/status') result = await getPreparedPossessionStatus({ db, actor, physicalPassId: b.physicalPassId, preparationId: b.preparationId });
        else if (path === '/v1/pass-validations/check') result = await checkDigitalCredential({ db, actor, qrPayload: b.qrPayload });
        else if (path === '/v1/admin/pass-activations/reissue') {
          if (Date.now() >= validUntil) throw new Error('CANNOT_REISSUE');
          result = await reissueActivation({ db, actor, physicalPassId: b.physicalPassId, idempotencyKey: b.idempotencyKey, reason: b.reason, hmacSecret });
        }
        else if (path === '/v1/admin/pass-credentials/revoke') {
          await pilotRecord('digitalCredentials', b.credentialId);
          result = await revokeDigitalCredential({ db, actor, credentialId: b.credentialId, reason: b.reason });
        }
        else return res.status(404).json({ error: 'NOT_FOUND' });
      }
      return res.status(200).json(result);
    } catch (error) {
      const code = error?.message;
      if (code === 'PILOT_WINDOW_CLOSED') return res.status(503).json({ error: code });
      if (code === 'GOOGLE_WALLET_NOT_CONFIGURED') return res.status(503).json({ error: code });
      if (code === 'RATE_LIMITED') return res.status(429).json({ error: code });
      if (code === 'FORBIDDEN') return res.status(403).json({ error: code });
      if (code === 'UNAUTHORIZED' || error?.code?.startsWith('auth/')) return res.status(401).json({ error: 'UNAUTHORIZED' });
      const operational = ['CANNOT_REISSUE', 'INVALID_REISSUE', 'PASS_ALREADY_ACTIVATED', 'PREPARATION_ALREADY_EXISTS', 'POSSESSION_ALREADY_CONFIRMED', 'STALE_PREPARATION', 'INVALID_PREPARATION', 'PREPARED_BY_OTHER_OPERATOR', 'NO_PREPARATION', 'INVALID_PREPARATION'];
      if (operational.includes(code)) return res.status(409).json({ error: code });
      // Avoid pass/email enumeration and never log requests, secrets or arbitrary error text.
      return res.status(400).json({ error: 'REQUEST_NOT_COMPLETED' });
    }
  };
}

