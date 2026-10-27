/**
 * Durable Brevo DOI outbox. Records are server-only in Firestore, no external API
 * call inside a transaction. This is a conservative at-most-one-automatic-attempt
 * design: after an ambiguous send the task requires manual reconciliation.
 */
import { randomUUID } from 'node:crypto';
const ref=(db,c,id)=>db.collection(c).doc(id);
export async function enqueueDoi({db,holderUid,now=Date.now()}) {
  const consentRef=ref(db,'passMarketingConsents',holderUid);
  const jobRef=ref(db,'passMarketingOutbox',holderUid);
  return db.runTransaction(async tx=>{
    const [consent,job]=await Promise.all([tx.get(consentRef),tx.get(jobRef)]);
    if(!consent.exists || consent.data().status!=='PENDING_DOI')
      throw new Error('NO_ELIGIBLE_CONSENT');
    if(job.exists) return {status:job.data().status,alreadyQueued:true};
    tx.create(jobRef,{holderUid,status:'QUEUED',createdAt:now,updatedAt:now,
      dispatchCount:0,leaseId:null,leaseUntil:null});
    return {status:'QUEUED',alreadyQueued:false};
  });
}
export async function claimDoiJob({db,holderUid,now=Date.now()}) {
 const cRef=ref(db,'passMarketingConsents',holderUid), jRef=ref(db,'passMarketingOutbox',holderUid);
 const leaseId=randomUUID();
 return db.runTransaction(async tx=>{
   const [c,j]=await Promise.all([tx.get(cRef),tx.get(jRef)]);
   if(!c.exists || c.data().status!=='PENDING_DOI' ||
      !j.exists || j.data().status!=='QUEUED' || j.data().dispatchCount!==0)
     throw new Error('DOI_JOB_NOT_CLAIMABLE');
   tx.update(jRef,{status:'SENDING',dispatchCount:1,leaseId,leaseUntil:now+120000,updatedAt:now});
   return {holderUid,leaseId};
 });
}
export async function finishDoiJob({db,holderUid,leaseId,outcome,now=Date.now()}) {
 if(!['ACCEPTED','AMBIGUOUS','SUPPRESSED'].includes(outcome)) throw new Error('INVALID_OUTCOME');
 const jRef=ref(db,'passMarketingOutbox',holderUid),cRef=ref(db,'passMarketingConsents',holderUid);
 return db.runTransaction(async tx=>{
  const [j,c]=await Promise.all([tx.get(jRef),tx.get(cRef)]);
  if(!j.exists || j.data().leaseId!==leaseId || j.data().status!=='SENDING')
    throw new Error('STALE_DOI_LEASE');
  const withdrawn=!c.exists || c.data().status==='WITHDRAWN';
  const status=outcome==='ACCEPTED'?'DOI_REQUESTED':outcome==='SUPPRESSED'?'SUPPRESSED':'RECONCILIATION_REQUIRED';
  tx.update(jRef,{status,leaseId:null,leaseUntil:null,updatedAt:now});
  if(!withdrawn) tx.update(cRef,{status,updatedAt:now});
  return {status:withdrawn?'WITHDRAWN':status};
 });
}
/** A crashed/expired lease is ambiguous: never auto-retry an email when
 * the provider may have accepted it. Requires authoritative reconciliation.
 */
export async function quarantineExpiredLease({db,holderUid,now=Date.now()}) {
 const jRef=ref(db,'passMarketingOutbox',holderUid);
 return db.runTransaction(async tx=>{
  const j=await tx.get(jRef);
  if(!j.exists || j.data().status!=='SENDING' || j.data().leaseUntil>now)
    return {changed:false};
  tx.update(jRef,{status:'RECONCILIATION_REQUIRED',leaseId:null,leaseUntil:null,updatedAt:now});
  return {changed:true};
 });
}
