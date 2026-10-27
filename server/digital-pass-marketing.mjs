import { createHash, randomUUID } from 'node:crypto';

const API = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation';
const TEMPLATES = Object.freeze({ it: 2, de: 3, en: 4 });
const LIST_ID = 13;
const hash = email => createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
const doc = (db,name,id) => db.collection(name).doc(id);

function requireHolder(identity) {
  if (!identity?.uid || identity.email_verified !== true || !identity.email) throw new Error('UNAUTHORIZED');
}
function verifiedConsent(c,identity) {
  return c?.holderUid === identity.uid && c?.status === 'PENDING_DOI' &&
    c?.purpose === 'DNS_MARKETING' && c?.affirmative === true && c?.emailHash === hash(identity.email);
}
/** Separate from pass issuance. Explicit affirmative action and server-side notice version required.
 * Existing opted-out users are not silently re-enrolled.
 */
export async function requestMarketingOptIn({db,identity,affirmative,language,noticeVersion,now=Date.now()}) {
  requireHolder(identity);
  if (affirmative !== true || !['it','de','en'].includes(language) || !noticeVersion) throw new Error('MARKETING_CONSENT_REQUIRED');
  const ref=doc(db,'passMarketingConsents',identity.uid);
  const pass=await db.collection('passRegistrations').where('holderUid','==',identity.uid).limit(1).get();
  if (pass.empty || !pass.docs.some(d=>d.data().status==='ACTIVE')) throw new Error('PASS_NOT_REGISTERED');
  return db.runTransaction(async tx=>{
    const s=await tx.get(ref);
    if (s.exists) {
      const c=s.data();
      if (c.status==='WITHDRAWN' || c.status==='SUPPRESSED') throw new Error('REOPTIN_REQUIRES_REVIEW');
      if (['PENDING_DOI','DOI_REQUESTED','CONFIRMED'].includes(c.status)) return {status:c.status};
    }
    tx.set(ref,{holderUid:identity.uid,purpose:'DNS_MARKETING',affirmative:true,
      emailHash:hash(identity.email),noticeVersion,language,source:'digital-pass',
      consentedAt:now,status:'PENDING_DOI'});
    tx.create(doc(db,'consentEvents',randomUUID()),{holderId:identity.uid,purpose:'DNS_MARKETING',
      affirmative:true,status:'PENDING_DOUBLE_OPT_IN',noticeVersion,source:'digital-pass',at:now});
    return {status:'PENDING_DOI'};
  });
}
/** Suppression lookup must check Brevo authoritative unsubscribed/blacklisted state.
 * Caller must supply an authenticated server-only check. No token or personal data in logs.
 * DOI_REQUESTED != CONFIRMED. Network-timeout retries require manual reconciliation.
 */
export async function sendMarketingDoi({db,identity,apiKey,redirectUrl,isSuppressed,fetchImpl=fetch,now=Date.now()}) {
  requireHolder(identity);
  if (!apiKey || typeof isSuppressed!=='function') throw new Error('MARKETING_PROVIDER_NOT_CONFIGURED');
  const ref=doc(db,'passMarketingConsents',identity.uid), lease=randomUUID();
  const record=await db.runTransaction(async tx=>{
    const s=await tx.get(ref),c=s.exists?s.data():null;
    if (!verifiedConsent(c,identity)) throw new Error('MARKETING_DOI_NOT_ELIGIBLE');
    if (c.leaseUntil>now) throw new Error('MARKETING_DOI_IN_PROGRESS');
    tx.update(ref,{lease,leaseUntil:now+120000});
    return c;
  });
  try {
    if(await isSuppressed(identity.email)) throw new Error('MARKETING_SUPPRESSED');
    const url=new URL(redirectUrl);
    if(url.protocol!=='https:') throw new Error('INVALID_REDIRECT');
    const response=await fetchImpl(API,{method:'POST',headers:{'api-key':apiKey,'content-type':'application/json'},
      body:JSON.stringify({email:identity.email.trim().toLowerCase(),includeListIds:[LIST_ID],
        templateId:TEMPLATES[record.language],redirectionUrl:url.toString()})});
    if(!response.ok) throw new Error('BREVO_DOI_FAILED');
    await db.runTransaction(async tx=>{
      const s=await tx.get(ref);
      if(s.exists && s.data().lease===lease && s.data().status==='PENDING_DOI')
        tx.update(ref,{status:'DOI_REQUESTED',doiRequestedAt:Date.now(),lease:null,leaseUntil:null});
    });
    return {status:'DOI_REQUESTED'};
  } catch(error) {
    // A Brevo response may be lost after it accepted an email; keep state uncertain,
    // disallow automatic replay, and require reconciliation.
    await db.runTransaction(async tx=>{
      const s=await tx.get(ref);
      if(s.exists && s.data().lease===lease)
        tx.update(ref,{status:'RECONCILIATION_REQUIRED',lease:null,leaseUntil:null});
    });
    throw error;
  }
}
export async function withdrawMarketing({db,identity,now=Date.now()}) {
  requireHolder(identity);
  const ref=doc(db,'passMarketingConsents',identity.uid);
  await db.runTransaction(async tx=>{
    const s=await tx.get(ref);
    if(!s.exists) throw new Error('MARKETING_CONSENT_NOT_FOUND');
    if(s.data().status==='WITHDRAWN') return;
    tx.update(ref,{status:'WITHDRAWN',withdrawnAt:now,needsBrevoUnsubscribe:true,lease:null,leaseUntil:null});
    tx.create(doc(db,'consentEvents',randomUUID()),{holderId:identity.uid,purpose:'DNS_MARKETING',
      affirmative:false,status:'WITHDRAWN',at:now,source:'digital-pass'});
  });
  return {status:'WITHDRAWN'};
}
