/** Optional server-only marketing registry. No provider I/O and no pass writes. */
import { createHash, randomUUID } from 'node:crypto';
const hash = email => createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
const doc = (db,name,id) => db.collection(name).doc(id);
function requireHolder(identity) {
  if (!identity?.uid || identity.email_verified !== true || typeof identity.email!=='string' || !identity.email) throw Error('UNAUTHORIZED');
}
/** Consent + outbox creation is atomic and independent of the pass registration transaction. */
export async function requestMarketingOptIn({db,identity,affirmative,language,noticeVersion,now=Date.now()}) {
  requireHolder(identity);
  if (affirmative !== true || !['it','de','en'].includes(language) || typeof noticeVersion!=='string' || !noticeVersion.trim() || noticeVersion.length>100) throw Error('MARKETING_CONSENT_REQUIRED');
  const consentRef=doc(db,'passMarketingConsents',identity.uid), jobRef=doc(db,'passMarketingOutbox',identity.uid);
  const pass=await db.collection('passRegistrations').where('holderUid','==',identity.uid).limit(1).get();
  if (pass.empty || !pass.docs.some(d=>d.data().status==='ACTIVE')) throw Error('PASS_NOT_REGISTERED');
  return db.runTransaction(async tx=>{
    const [s,j]=await Promise.all([tx.get(consentRef),tx.get(jobRef)]);
    if (s.exists) {
      const c=s.data();
      if (c.emailHash!==hash(identity.email) || c.status==='WITHDRAWN' || c.status==='SUPPRESSED') throw Error('REOPTIN_REQUIRES_REVIEW');
      // Ambiguous outcomes must be reconciled; they never create a fresh job/retry.
      return {status:c.status};
    }
    if (j.exists) throw Error('MARKETING_JOB_REQUIRES_REVIEW');
    const consentRevision=randomUUID();
    tx.create(consentRef,{holderUid:identity.uid,purpose:'DNS_MARKETING',affirmative:true,
      emailHash:hash(identity.email),noticeVersion,language,source:'digital-pass',
      consentRevision,consentedAt:now,status:'PENDING_DOI'});
    tx.create(jobRef,{holderUid:identity.uid,consentRevision,status:'QUEUED',createdAt:now,updatedAt:now,
      dispatchCount:0,leaseId:null,leaseUntil:null});
    tx.create(doc(db,'consentEvents',randomUUID()),{holderId:identity.uid,purpose:'DNS_MARKETING',
      affirmative:true,status:'PENDING_DOUBLE_OPT_IN',noticeVersion,source:'digital-pass',at:now,consentRevision});
    return {status:'PENDING_DOI'};
  });
}
/** Immediate local revocation; an in-flight provider call cannot restore consent. */
export async function withdrawMarketing({db,identity,now=Date.now()}) {
  requireHolder(identity);
  const consentRef=doc(db,'passMarketingConsents',identity.uid), jobRef=doc(db,'passMarketingOutbox',identity.uid);
  await db.runTransaction(async tx=>{
    const [s,j]=await Promise.all([tx.get(consentRef),tx.get(jobRef)]);
    if (!s.exists) throw Error('MARKETING_CONSENT_NOT_FOUND');
    if (s.data().status==='WITHDRAWN') return;
    tx.update(consentRef,{status:'WITHDRAWN',withdrawnAt:now,needsBrevoUnsubscribe:true});
    if (j.exists && j.data().status!=='SENDING') tx.update(jobRef,{status:'WITHDRAWN',leaseId:null,leaseUntil:null,updatedAt:now});
    tx.create(doc(db,'consentEvents',randomUUID()),{holderId:identity.uid,purpose:'DNS_MARKETING',
      affirmative:false,status:'WITHDRAWN',at:now,source:'digital-pass',consentRevision:s.data().consentRevision});
  });
  return {status:'WITHDRAWN'};
}
