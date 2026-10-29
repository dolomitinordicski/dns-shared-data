/** One automatic attempt per explicit consent. No network I/O inside transactions. */
import { randomUUID } from 'node:crypto';
const ref=(db,c,id)=>db.collection(c).doc(id);
export function eligibleConsent(c,holderUid) {
  return c?.holderUid===holderUid && c.purpose==='DNS_MARKETING' && c.affirmative===true &&
    c.status==='PENDING_DOI' && !c.withdrawnAt && !c.revokedAt && typeof c.consentRevision==='string' && !!c.consentRevision &&
    typeof c.noticeVersion==='string' && !!c.noticeVersion && Number.isFinite(c.consentedAt) &&
    /^[a-f0-9]{64}$/.test(c.emailHash || '') && ['it','de','en'].includes(c.language);
}
/** Repair/idempotency helper only; normal opt-in creates consent and job atomically. */
export async function enqueueDoi({db,holderUid,now=Date.now()}) {
  const cRef=ref(db,'passMarketingConsents',holderUid),jRef=ref(db,'passMarketingOutbox',holderUid);
  return db.runTransaction(async tx=>{
    const [c,j]=await Promise.all([tx.get(cRef),tx.get(jRef)]);
    if (!c.exists || !eligibleConsent(c.data(),holderUid)) throw Error('NO_ELIGIBLE_CONSENT');
    if (j.exists) return {status:j.data().status,alreadyQueued:true};
    tx.create(jRef,{holderUid,consentRevision:c.data().consentRevision,status:'QUEUED',createdAt:now,
      updatedAt:now,dispatchCount:0,leaseId:null,leaseUntil:null});
    return {status:'QUEUED',alreadyQueued:false};
  });
}
export async function claimDoiJob({db,holderUid,now=Date.now()}) {
  const cRef=ref(db,'passMarketingConsents',holderUid),jRef=ref(db,'passMarketingOutbox',holderUid),leaseId=randomUUID();
  return db.runTransaction(async tx=>{
    const [c,j]=await Promise.all([tx.get(cRef),tx.get(jRef)]);
    if (!c.exists || !eligibleConsent(c.data(),holderUid) || !j.exists || j.data().status!=='QUEUED' ||
        j.data().dispatchCount!==0 || j.data().consentRevision!==c.data().consentRevision) throw Error('DOI_JOB_NOT_CLAIMABLE');
    tx.update(jRef,{status:'SENDING',dispatchCount:1,leaseId,leaseUntil:now+120000,updatedAt:now});
    return {holderUid,leaseId,consentRevision:c.data().consentRevision};
  });
}
export async function finishDoiJob({db,holderUid,leaseId,outcome,templateId,now=Date.now()}) {
  if (!['ACCEPTED','AMBIGUOUS','SUPPRESSED'].includes(outcome)) throw Error('INVALID_OUTCOME');
  if (outcome==='ACCEPTED' && (!Number.isSafeInteger(templateId) || templateId<=0)) throw Error('INVALID_TEMPLATE_ID');
  const jRef=ref(db,'passMarketingOutbox',holderUid),cRef=ref(db,'passMarketingConsents',holderUid);
  return db.runTransaction(async tx=>{
    const [j,c]=await Promise.all([tx.get(jRef),tx.get(cRef)]);
    if (!j.exists || j.data().leaseId!==leaseId || j.data().status!=='SENDING') throw Error('STALE_DOI_LEASE');
    const active=c.exists && eligibleConsent(c.data(),holderUid) && c.data().consentRevision===j.data().consentRevision;
    const status=active ? (outcome==='ACCEPTED'?'DOI_REQUESTED':outcome==='SUPPRESSED'?'SUPPRESSED':'RECONCILIATION_REQUIRED') : (c.exists?c.data().status:'WITHDRAWN');
    tx.update(jRef,{status,providerOutcome:outcome,leaseId:null,leaseUntil:null,updatedAt:now});
    if (active) tx.update(cRef,{status,updatedAt:now,...(outcome==='ACCEPTED'?{doiRequestedAt:now,doiTemplateId:templateId}: {})});
    else if (c.exists && c.data().status==='WITHDRAWN') tx.update(cRef,{needsBrevoUnsubscribe:true});
    return {status};
  });
}
export async function quarantineExpiredLease({db,holderUid,now=Date.now()}) {
  const jRef=ref(db,'passMarketingOutbox',holderUid),cRef=ref(db,'passMarketingConsents',holderUid);
  return db.runTransaction(async tx=>{
    const [j,c]=await Promise.all([tx.get(jRef),tx.get(cRef)]);
    if (!j.exists || j.data().status!=='SENDING' || j.data().leaseUntil>now) return {changed:false};
    const status=c.exists && c.data().status==='WITHDRAWN'?'WITHDRAWN':'RECONCILIATION_REQUIRED';
    tx.update(jRef,{status,leaseId:null,leaseUntil:null,updatedAt:now});
    if (c.exists && c.data().status==='PENDING_DOI') tx.update(cRef,{status,updatedAt:now});
    return {changed:true};
  });
}
