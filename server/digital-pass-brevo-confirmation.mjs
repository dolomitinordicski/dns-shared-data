/** Evidence-gated registry reconciliation. No HTTP export and no production verifier wired.
 * A provider adapter must retrieve and authenticate a DOI confirmation event by reference.
 * Browser clicks, list membership, delivery and a client-supplied boolean are not proof.
 */
import {createHash,randomUUID} from 'node:crypto';
const digest=email=>createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
const ref=(db,c,id)=>db.collection(c).doc(id);
export async function recordVerifiedDoiConfirmation({db,holderUid,evidenceReference,verifyEvidence,now=Date.now()}) {
  if (!db || typeof holderUid!=='string' || !holderUid) throw Error('INVALID_HOLDER');
  if (typeof verifyEvidence!=='function') throw Error('DOI_EVIDENCE_VERIFIER_REQUIRED');
  if (typeof evidenceReference!=='string' || !evidenceReference.trim() || evidenceReference.length>256) throw Error('VERIFIED_DOI_EVIDENCE_REQUIRED');
  // Only the independently authenticated server adapter supplies these fields.
  const e=await verifyEvidence(evidenceReference);
  if (!e || e.source!=='BREVO_DOI_CONFIRMATION_LOG' || e.reference!==evidenceReference ||
      e.listId!==13 || typeof e.email!=='string' || !e.email || !e.consentRevision ||
      !Number.isSafeInteger(e.templateId) || !Number.isFinite(e.confirmedAt) || e.confirmedAt<=0 || e.confirmedAt>now)
    throw Error('VERIFIED_DOI_EVIDENCE_REQUIRED');
  const cRef=ref(db,'passMarketingConsents',holderUid);
  const auditId=createHash('sha256').update('doi:'+e.reference).digest('hex'),auditRef=ref(db,'consentEvidence',auditId);
  return db.runTransaction(async tx=>{
    const [s,existing]=await Promise.all([tx.get(cRef),tx.get(auditRef)]);
    if (!s.exists) throw Error('CONSENT_NOT_FOUND');
    const c=s.data();
    if (c.status==='WITHDRAWN' || c.status==='SUPPRESSED') throw Error('CONSENT_INACTIVE');
    if (c.emailHash!==digest(e.email) || c.consentRevision!==e.consentRevision || c.doiTemplateId!==e.templateId ||
        !Number.isFinite(c.doiRequestedAt) || e.confirmedAt<c.doiRequestedAt || e.confirmedAt<c.consentedAt) throw Error('DOI_EVIDENCE_MISMATCH');
    if (c.status==='DOI_CONFIRMED' && existing.exists && existing.data().holderUid===holderUid && c.doiEvidenceId===auditId)
      return {status:'DOI_CONFIRMED',alreadyConfirmed:true};
    if (c.status!=='DOI_REQUESTED' || c.purpose!=='DNS_MARKETING' || c.affirmative!==true) throw Error('DOI_NOT_READY');
    if (existing.exists) throw Error('DOI_EVIDENCE_ALREADY_USED');
    tx.create(auditRef,{holderUid,source:e.source,referenceHash:auditId,listId:13,templateId:e.templateId,
      consentRevision:e.consentRevision,confirmedAt:e.confirmedAt,verifiedAt:now});
    tx.update(cRef,{status:'DOI_CONFIRMED',doiConfirmedAt:e.confirmedAt,doiEvidenceId:auditId,updatedAt:now});
    tx.create(ref(db,'consentEvents',randomUUID()),{holderId:holderUid,purpose:'DNS_MARKETING',affirmative:true,
      status:'DOI_CONFIRMED',source:'brevo-verified-doi',at:now,evidenceId:auditId,consentRevision:e.consentRevision});
    return {status:'DOI_CONFIRMED',alreadyConfirmed:false};
  });
}
