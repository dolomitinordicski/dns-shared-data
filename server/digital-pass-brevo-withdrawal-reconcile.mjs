/** Server-only reconciliation of a DNS Digital Pass marketing withdrawal.
 * Not scheduled or exported by Firebase entrypoint. Never changes other Brevo lists.
 * The DNS local withdrawal takes effect immediately, even if Brevo is unavailable.
 */
import { createHash } from 'node:crypto';
import { getBrevoMarketingStatus, unlinkBrevoDigitalPassList } from './digital-pass-brevo-contacts.mjs';

const emailDigest = email => createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

export async function reconcileBrevoWithdrawal({
  db, holderUid, apiKey, resolveVerifiedEmail, fetchImpl = fetch, now = Date.now()
}) {
  if (!db || !holderUid || !apiKey || typeof resolveVerifiedEmail !== 'function')
    throw new Error('WITHDRAWAL_RECONCILIATION_NOT_CONFIGURED');
  const consentRef = db.collection('passMarketingConsents').doc(holderUid);
  const initial = await consentRef.get();
  if (!initial.exists || initial.data().status !== 'WITHDRAWN')
    throw new Error('WITHDRAWAL_NOT_ELIGIBLE');
  if (initial.data().needsBrevoUnsubscribe !== true)
    return {status:'WITHDRAWN',synced:true};
  const email = await resolveVerifiedEmail(holderUid);
  if (typeof email !== 'string' || emailDigest(email) !== initial.data().emailHash)
    throw new Error('VERIFIED_EMAIL_MISMATCH');
  const contact = await getBrevoMarketingStatus({email,apiKey,fetchImpl});
  if (contact.exists && contact.inList) {
    await unlinkBrevoDigitalPassList({email,apiKey,fetchImpl});
  }
  // A confirmed successful list-specific unlink or provider absence is sufficient.
  // If any API call fails, leave needsBrevoUnsubscribe=true for reconciliation.
  return db.runTransaction(async tx => {
    const latest = await tx.get(consentRef);
    if (!latest.exists || latest.data().status !== 'WITHDRAWN')
      throw new Error('WITHDRAWAL_CHANGED_DURING_RECONCILIATION');
    if (latest.data().emailHash !== emailDigest(email))
      throw new Error('VERIFIED_EMAIL_MISMATCH');
    tx.update(consentRef, {needsBrevoUnsubscribe:false, brevoUnsubscribedAt:now});
    return {status:'WITHDRAWN',synced:true};
  });
}
