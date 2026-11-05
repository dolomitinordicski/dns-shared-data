/** Sole DOI sender. Manual/test-only; NOT exported/scheduled by Firebase runtime. */
import { claimDoiJob, finishDoiJob, eligibleConsent } from './digital-pass-brevo-outbox.mjs';
import { getBrevoMarketingStatus } from './digital-pass-brevo-contacts.mjs';
import { brevoRequest } from './digital-pass-brevo-request.mjs';
import { createHash } from 'node:crypto';
const DOI_ENDPOINT='https://api.brevo.com/v3/contacts/doubleOptinConfirmation';
export async function dispatchDoiJob({db,holderUid,apiKey,redirectUrl,resolveVerifiedEmail,templateIds,fetchImpl=fetch,timeoutMs=15000,now=Date.now()}) {
  if (!db || !holderUid || !apiKey || typeof resolveVerifiedEmail!=='function') throw Error('DISPATCH_NOT_CONFIGURED');
  // No fallback between languages and no implicit use of untested agency IDs 2/3/4.
  const initial=await db.collection('passMarketingConsents').doc(holderUid).get();
  if (!initial.exists || !eligibleConsent(initial.data(),holderUid)) throw Error('DOI_JOB_NOT_CLAIMABLE');
  const templateId=templateIds?.[initial.data().language];
  if (!Number.isSafeInteger(templateId) || templateId<=0 || [2,3,4].includes(templateId)) throw Error('DIGITAL_PASS_DOI_TEMPLATES_NOT_APPROVED');
  const redirect=new URL(redirectUrl);
  if (redirect.protocol!=='https:') throw Error('INVALID_DOI_REDIRECT');
  const claim=await claimDoiJob({db,holderUid,now});
  const finish=outcome=>finishDoiJob({db,holderUid,leaseId:claim.leaseId,outcome,templateId});
  try {
    const email=await resolveVerifiedEmail(holderUid);
    if (typeof email!=='string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('VERIFIED_EMAIL_UNAVAILABLE');
    if (initial.data().emailHash!==createHash('sha256').update(email.trim().toLowerCase()).digest('hex')) return await finish('SUPPRESSED');
    const provider=await getBrevoMarketingStatus({email,apiKey,fetchImpl,timeoutMs});
    if (provider.suppressed || provider.inList) return await finish('SUPPRESSED');
    const latest=await db.collection('passMarketingConsents').doc(holderUid).get();
    if (!latest.exists || !eligibleConsent(latest.data(),holderUid) || latest.data().consentRevision!==claim.consentRevision) return await finish('SUPPRESSED');
    // Whitelist: never spread holder, pass, activation, QR, location or arbitrary client fields.
    const response=await brevoRequest(fetchImpl,DOI_ENDPOINT,{
      method:'POST',headers:{'api-key':apiKey,'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({email:email.trim().toLowerCase(),includeListIds:[13],templateId,redirectionUrl:redirect.toString()})
    },timeoutMs);
    if (response.status!==201) throw Error('BREVO_DOI_DISPATCH_UNCERTAIN');
    return await finish('ACCEPTED');
  } catch {
    // Failed/ambiguous calls never trigger automatic email replay or affect the pass.
    try { return await finish('AMBIGUOUS'); } catch { return {status:'RECONCILIATION_REQUIRED'}; }
  }
}
