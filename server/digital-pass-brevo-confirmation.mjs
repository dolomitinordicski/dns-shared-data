/** Manual, evidence-gated Brevo DOI confirmation reconciliation.
 * No webhook, list membership or email delivery alone proves confirmation.
 * Caller must independently verify Brevo's DOI confirmation in authoritative
 * event/transactional records and pass a unique audit reference.
 * Not exported by firebase-entry.mjs; no production endpoint.
 */
import {createHash,randomUUID} from 'node:crypto';
const digest=email=>createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
const ref=(db,c,id)=>db.collection(c).doc(id);
export async function recordVerifiedDoiConfirmation({
 db,holderUid,verifiedEvidence,now=Date.now()
}) {
 if(!db||typeof holderUid!=='string'||!holderUid)throw Error('INVALID_HOLDER');
 const e=verifiedEvidence;
 if(!e || e.source!=='BREVO_DOI_CONFIRMATION_LOG' ||
   e.verifiedByServer!==true ||
   typeof e.reference!=='string'||!e.reference.trim()||e.reference.length>256 ||
   typeof e.email!=='string' || !e.email ||
   !Number.isFinite(e.confirmedAt) || e.confirmedAt<=0 || e.confirmedAt>now)
   throw Error('VERIFIED_DOI_EVIDENCE_REQUIRED');
 const consentRef=ref(db,'passMarketingConsents',holderUid);
 const auditId=createHash('sha256').update('doi:'+e.reference).digest('hex');
 const auditRef=ref(db,'consentEvidence',auditId);
 return db.runTransaction(async tx=>{
   const [s,existingEvidence]=await Promise.all([tx.get(consentRef),tx.get(auditRef)]);
   if(!s.exists)throw Error('CONSENT_NOT_FOUND');
   const c=s.data();
   if(c.status==='WITHDRAWN'||c.status==='SUPPRESSED')throw Error('CONSENT_INACTIVE');
   if(c.status==='CONFIRMED')return {status:'CONFIRMED',alreadyConfirmed:true};
   if(c.status!=='DOI_REQUESTED'||c.purpose!=='DNS_MARKETING'||c.affirmative!==true)
     throw Error('DOI_NOT_READY');
   if(c.emailHash!==digest(e.email)||e.confirmedAt<c.consentedAt)
     throw Error('DOI_EVIDENCE_MISMATCH');
   if(existingEvidence.exists)throw Error('DOI_EVIDENCE_ALREADY_USED');
   tx.create(auditRef,{holderUid,source:e.source,referenceHash:auditId,confirmedAt:e.confirmedAt,verifiedAt:now});
   tx.update(consentRef,{status:'CONFIRMED',doiConfirmedAt:e.confirmedAt,doiEvidenceId:auditId,updatedAt:now});
   tx.create(ref(db,'consentEvents',randomUUID()),{holderId:holderUid,purpose:'DNS_MARKETING',
     affirmative:true,status:'CONFIRMED',source:'brevo-verified-doi',at:now,evidenceId:auditId});
   return {status:'CONFIRMED',alreadyConfirmed:false};
 });
}
