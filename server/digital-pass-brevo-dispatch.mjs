/**
 * Manual/test-only outbox dispatcher. Intentionally NOT exported by firebase-entry.mjs.
 * Do not schedule until Brevo DOI templates, subscription reconciliation and staging
 * have passed. At most one automatic provider call per consent/job.
 */
import { claimDoiJob, finishDoiJob } from './digital-pass-brevo-outbox.mjs';
import { getBrevoMarketingStatus } from './digital-pass-brevo-contacts.mjs';

const DOI_ENDPOINT = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation';
// No default to agency-owned Pimcore template IDs 2/3/4.
// Deploy only with separately validated Digital Pass DOI template IDs.
const LIST_ID = 13;
const getRef = (db, collection, id) => db.collection(collection).doc(id);

export async function dispatchDoiJob({ db, holderUid, apiKey, redirectUrl, resolveVerifiedEmail, templateIds, fetchImpl = fetch, now = Date.now() }) {
  if (!db || !holderUid || !apiKey || typeof resolveVerifiedEmail !== 'function') throw new Error('DISPATCH_NOT_CONFIGURED');
  if (!templateIds || !['it','de','en'].every(lang => Number.isSafeInteger(templateIds[lang]) && templateIds[lang] > 0 && ![2,3,4].includes(templateIds[lang])) || new Set(['it','de','en'].map(lang=>templateIds[lang])).size!==3)
    throw new Error('DIGITAL_PASS_DOI_TEMPLATES_NOT_APPROVED');
  const redirect = new URL(redirectUrl);
  if (redirect.protocol !== 'https:') throw new Error('INVALID_DOI_REDIRECT');
  const claim = await claimDoiJob({ db, holderUid, now });
  const finish = async outcome => finishDoiJob({ db, holderUid, leaseId: claim.leaseId, outcome });
  try {
    const consentRef = getRef(db, 'passMarketingConsents', holderUid);
    const initial = await consentRef.get();
    if (!initial.exists || initial.data().status !== 'PENDING_DOI' || initial.data().affirmative !== true ||
        !['it', 'de', 'en'].includes(initial.data().language)) {
      return finish('SUPPRESSED');
    }
    // Resolve email only through server-side Firebase Auth, never the outbox or client.
    const email = await resolveVerifiedEmail(holderUid);
    if (typeof email !== 'string' || !email) throw new Error('VERIFIED_EMAIL_UNAVAILABLE');
    const { createHash } = await import('node:crypto');
    const emailHash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
    if (initial.data().emailHash !== emailHash) {
      await finish('SUPPRESSED');
      return { status: 'SUPPRESSED' };
    }
    const provider = await getBrevoMarketingStatus({ email, apiKey, fetchImpl });
    if (provider.suppressed || provider.inList) {
      await finish('SUPPRESSED');
      return { status: 'SUPPRESSED' };
    }
    // Check again after remote lookup in case holder withdrew meanwhile.
    const latest = await consentRef.get();
    if (!latest.exists || latest.data().status !== 'PENDING_DOI') {
      return finish('SUPPRESSED');
    }
    const response = await fetchImpl(DOI_ENDPOINT, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        includeListIds: [LIST_ID],
        templateId: templateIds[initial.data().language],
        redirectionUrl: redirect.toString(),
      }),
    });
    if (!response.ok) throw new Error('BREVO_DOI_DISPATCH_UNCERTAIN');
    return finish('ACCEPTED');
  } catch {
    // Do not retry automatically: Brevo may have received the DOI request.
    try { await finish('AMBIGUOUS'); } catch { /* lease may have expired */ }
    return { status: 'RECONCILIATION_REQUIRED' };
  }
}
