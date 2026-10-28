/** Express-compatible HTTP adapter; usable by the existing Firebase environment.
 * Dependencies are injected so no credentials or project are selected at import time. */
import { createHmac } from 'node:crypto';
import { getGoogleWalletLink } from './digital-pass-google-wallet.mjs';
import { verifyPublicPass, renderPublicPassHtml } from './digital-pass-public-verify.mjs';
import { requestMarketingOptIn, withdrawMarketing } from './digital-pass-marketing.mjs';
import { enqueueDoi } from './digital-pass-brevo-outbox.mjs';
import { loadDigitalPassActor } from './digital-pass-auth.mjs';
import { prepareActivation, validateSale, reissueActivation } from './digital-pass-activation.mjs';
import { resolveSeasonPassAssignment, PILOT_SEASON, PILOT_PRODUCT } from './digital-pass-inventory-resolver.mjs';
import { limitAttempts, registerDigitalPass, getDigitalPass, checkDigitalCredential, revokeDigitalCredential } from './digital-pass-registration.mjs';

export function createDigitalPassHandler({ db, auth, hmacSecret, allowedOrigins, inventoryRevision, validFrom, validUntil, noticeVersion, marketingNoticeVersion = '', walletIssuerId = '', walletSigningJson = '', verificationBase = '', walletOrigins = [] }) {
  if (typeof hmacSecret !== 'string' || hmacSecret.length < 32 || !inventoryRevision || !noticeVersion ||
      !Array.isArray(allowedOrigins) || !allowedOrigins.length || !Number.isFinite(validFrom) || !Number.isFinite(validUntil) || validFrom >= validUntil) throw new Error('DIGITAL_PASS_CONFIGURATION_REQUIRED');
  const resolveAssignment = async input => {
    const snapshot = await db.collection('passInventorySnapshots').doc(inventoryRevision).get();
    if (!snapshot.exists || snapshot.data().revision !== inventoryRevision) throw new Error('INVENTORY_UNAVAILABLE');
    return resolveSeasonPassAssignment({ ...input, snapshot: snapshot.data() });
  };
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('Vary', 'Origin');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('X-Content-Type-Options', 'nosniff');
    if (req.method === 'GET' && /^\/v\/[A-Za-z0-9_-]{43}$/.test(req.path || '')) {
      try {
        const token = req.path.slice(3);
        const status = await verifyPublicPass({ db, token });
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
    try {
      if (!req.is('application/json') || !req.body || Buffer.byteLength(JSON.stringify(req.body)) > 8192) return res.status(400).json({ error: 'INVALID_REQUEST' });
      const match = /^Bearer (\S+)$/.exec(req.get('Authorization') || '');
      if (!match) return res.status(401).json({ error: 'UNAUTHORIZED' });
      // Never accept actor/grants/isDnsAdmin/email_verified from request data.
      const token = match[1];
      const identity = await auth.verifyIdToken(token, true);
      await limitAttempts({ db, key: createHmac('sha256', hmacSecret).update('request:' + identity.uid).digest('hex'), max: 30 });
      const b = req.body;
      const inventory = { passNumber: b.passNumber, seasonId: PILOT_SEASON, productCode: PILOT_PRODUCT };
      const path = req.path;
      let result;
      if (path === '/v1/pass-registrations/complete') {
        result = await registerDigitalPass({ db, identity, assignment: await resolveAssignment(inventory),
          code: b.code, givenName: b.givenName, familyName: b.familyName, language: b.language,
          marketingRequested: b.marketingRequested, noticeVersion, hmacSecret, validFrom, validUntil });
      } else if (path === '/v1/me/wallet/google') {
        result = await getGoogleWalletLink({ db, identity, physicalPassId: b.physicalPassId,
          walletIssuerId, walletSigningJson, verificationBase, walletOrigins });
      } else if (path === '/v1/me/marketing/opt-in') {
        if (!marketingNoticeVersion) return res.status(503).json({ error: 'MARKETING_NOT_ENABLED' });
        result = await requestMarketingOptIn({ db, identity, affirmative: b.affirmative,
          language: b.language, noticeVersion: marketingNoticeVersion });
        if (result.status === 'PENDING_DOI') await enqueueDoi({ db, holderUid: identity.uid });
      } else if (path === '/v1/me/marketing/withdraw') {
        result = await withdrawMarketing({ db, identity });
      } else if (path === '/v1/me/digital-passes') {
        if (identity.email_verified !== true) throw new Error('UNAUTHORIZED');
        const registrations = await db.collection('passRegistrations').where('holderUid', '==', identity.uid).get();
        result = { registrationIds: registrations.docs.filter(s => s.data().status === 'ACTIVE').map(s => s.id) };
      } else if (path === '/v1/me/digital-pass') {
        result = await getDigitalPass({ db, identity, physicalPassId: b.physicalPassId });
      } else {
        const actor = await loadDigitalPassActor({ db, auth, idToken: token });
        if (path === '/v1/pass-activations/prepare') result = await prepareActivation({ db, actor, ...inventory, resolveAssignment, hmacSecret });
        else if (path === '/v1/pass-activations/validate') result = await validateSale({ db, actor, physicalPassId: b.physicalPassId, preparationId: b.preparationId });
        else if (path === '/v1/pass-validations/check') result = await checkDigitalCredential({ db, actor, qrPayload: b.qrPayload });
        else if (path === '/v1/admin/pass-activations/reissue') {
          if (Date.now() >= validUntil) throw new Error('CANNOT_REISSUE');
          result = await reissueActivation({ db, actor, physicalPassId: b.physicalPassId, idempotencyKey: b.idempotencyKey, reason: b.reason, hmacSecret });
        }
        else if (path === '/v1/admin/pass-credentials/revoke') result = await revokeDigitalCredential({ db, actor, credentialId: b.credentialId, reason: b.reason });
        else return res.status(404).json({ error: 'NOT_FOUND' });
      }
      return res.status(200).json(result);
    } catch (error) {
      const code = error?.message;
      if (code === 'GOOGLE_WALLET_NOT_CONFIGURED') return res.status(503).json({ error: code });
      if (code === 'RATE_LIMITED') return res.status(429).json({ error: code });
      if (code === 'FORBIDDEN') return res.status(403).json({ error: code });
      if (code === 'UNAUTHORIZED' || error?.code?.startsWith('auth/')) return res.status(401).json({ error: 'UNAUTHORIZED' });
      const operational = ['CANNOT_REISSUE', 'INVALID_REISSUE', 'PASS_ALREADY_ACTIVATED', 'PREPARATION_ALREADY_EXISTS', 'SALE_ALREADY_ATTESTED', 'STALE_PREPARATION', 'INVALID_PREPARATION', 'PREPARED_BY_OTHER_OPERATOR', 'NO_PREPARATION'];
      if (operational.includes(code)) return res.status(409).json({ error: code });
      // Avoid pass/email enumeration and never log requests, secrets or arbitrary error text.
      return res.status(400).json({ error: 'REQUEST_NOT_COMPLETED' });
    }
  };
}
