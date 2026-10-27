/**
 * Server-only consent orchestration around the Brevo adapter.
 * Dependencies are injected: firestore Admin-compatible DB, authenticated holder,
 * and Brevo suppression checker. No HTTP endpoint is exposed by this module.
 */
import { randomUUID, createHash } from 'node:crypto';
import { requestBrevoMarketingDoi } from './digital-pass-brevo.mjs';

function emailDigest(email) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}
function validHolder(holder) {
  if (!holder?.id || !holder?.email || !holder?.emailVerifiedAt) throw new Error('HOLDER_EMAIL_NOT_VERIFIED');
}
function checkConsentInput(input) {
  if (input?.affirmative !== true || !input.noticeVersion || !input.source ||
      !['it','de','en'].includes(input.language)) throw new Error('EXPLICIT_MARKETING_CONSENT_REQUIRED');
}
/** Private registry, only callable by authenticated holder backend.
 * Ensures the client cannot claim arbitrary holder identity.
 */
export async function recordMarketingOptIn({ db, authenticatedHolder, input, now = Date.now() }) {
  validHolder(authenticatedHolder);
  checkConsentInput(input);
  const holderId = authenticatedHolder.id;
  const ref = db.collection('passMarketingConsents').doc(holderId);
  const eventRef = db.collection('passMarketingConsentEvents').doc(randomUUID());
  return db.runTransaction(async tx => {
    const previous = await tx.get(ref);
    const data = previous.exists ? previous.data() : null;
    if (data?.status === 'WITHDRAWN' || data?.status === 'SUPPRESSED') throw new Error('REOPTIN_REQUIRES_EXPLICIT_RECONSENT_FLOW');
    if (data?.status === 'DOI_REQUESTED' || data?.status === 'CONFIRMED') return { status: data.status, alreadyRecorded: true };
    const consent = {
      holderId, emailHash: emailDigest(authenticatedHolder.email),
      purpose: 'DNS_MARKETING', affirmative: true, noticeVersion: input.noticeVersion,
      source: input.source, language: input.language, consentedAt: now,
      status: 'PENDING_DOI', revision: 1,
    };
    tx.set(ref, consent);
    tx.create(eventRef, { holderId, action: 'MARKETING_OPT_IN_RECORDED',
      noticeVersion: input.noticeVersion, at: now });
    return { status: 'PENDING_DOI', alreadyRecorded: false };
  });
}
/** Server caller must run authenticated holder ownership check and rate limit.
 * No Brevo submission if user withdrew or if prior DOI was requested.
 * Sender is a short-lived lease; failure remains retryable after lease expiration.
 */
export async function dispatchMarketingDoi({
  db, authenticatedHolder, apiKey, redirectionUrl,
  templateIds, isSuppressed, fetchImpl, now = Date.now(),
}) {
  validHolder(authenticatedHolder);
  if (typeof isSuppressed !== 'function') throw new Error('SUPPRESSION_CHECK_REQUIRED');
  const ref = db.collection('passMarketingConsents').doc(authenticatedHolder.id);
  const dispatchId = randomUUID();
  const reservation = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('MARKETING_CONSENT_REQUIRED');
    const c = snap.data();
    if (c.emailHash !== emailDigest(authenticatedHolder.email) ||
        c.status !== 'PENDING_DOI' || c.affirmative !== true) throw new Error('MARKETING_DOI_NOT_ELIGIBLE');
    if (c.leaseUntil && c.leaseUntil > now) throw new Error('MARKETING_DOI_IN_PROGRESS');
    tx.update(ref, { leaseId: dispatchId, leaseUntil: now + 120000 });
    return c;
  });
  try {
    const result = await requestBrevoMarketingDoi({
      consent: reservation, holder: { ...authenticatedHolder, preferredLanguage: reservation.language },
      apiKey, redirectionUrl, templateIds, isSuppressed, fetchImpl,
    });
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data().leaseId !== dispatchId || snap.data().status !== 'PENDING_DOI')
        return;
      tx.update(ref, { status: 'DOI_REQUESTED', doiRequestedAt: Date.now(), leaseId: null, leaseUntil: null });
    });
    return result;
  } catch (error) {
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (snap.exists && snap.data().leaseId === dispatchId) {
        tx.update(ref, { leaseId: null, leaseUntil: null });
      }
    });
    throw error;
  }
}
/** Withdrawal is DNS-local immediately; separate Brevo API reconciliation must
 * unsubscribe/remove contact without altering unrelated lists. No client writes.
 */
export async function withdrawMarketingConsent({ db, authenticatedHolder, now = Date.now() }) {
  validHolder(authenticatedHolder);
  const ref = db.collection('passMarketingConsents').doc(authenticatedHolder.id);
  const eventRef = db.collection('passMarketingConsentEvents').doc(randomUUID());
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('MARKETING_CONSENT_NOT_FOUND');
    const c = snap.data();
    if (c.status === 'WITHDRAWN') return;
    tx.update(ref, { status: 'WITHDRAWN', withdrawnAt: now, leaseId: null, leaseUntil: null,
      brevoReconcileNeeded: true });
    tx.create(eventRef, { holderId: authenticatedHolder.id, action: 'MARKETING_WITHDRAWN', at: now });
  });
  return { status: 'WITHDRAWN' };
}
