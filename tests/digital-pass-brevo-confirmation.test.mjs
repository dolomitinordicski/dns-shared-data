import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {recordVerifiedDoiConfirmation} from '../server/digital-pass-brevo-confirmation.mjs';
import {MemoryDb} from './helpers/digital-pass-memory-db.mjs';
const email='holder@example.test';
function fixture(status='DOI_REQUESTED'){
 const db=new MemoryDb();db.values.set('passMarketingConsents/h1',{status,purpose:'DNS_MARKETING',affirmative:true,
  emailHash:createHash('sha256').update(email).digest('hex'),consentedAt:100,doiRequestedAt:150,doiTemplateId:9,consentRevision:'r1'});return db;
}
const evidence={source:'BREVO_DOI_CONFIRMATION_LOG',reference:'transaction-log:test-123',email,
 confirmedAt:200,listId:13,templateId:9,consentRevision:'r1'};
const args=db=>({db,holderUid:'h1',evidenceReference:evidence.reference,verifyEvidence:async()=>evidence,now:300});
test('delivery, list membership, client boolean and absent evidence adapter cannot confirm DOI',async()=>{
 const db=fixture();
 await assert.rejects(recordVerifiedDoiConfirmation({...args(db),verifyEvidence:undefined,verifiedEvidence:{verifiedByServer:true}}),/VERIFIER_REQUIRED/);
 for(const source of ['BREVO_LIST_MEMBERSHIP','BREVO_EMAIL_DELIVERED','BROWSER_CLICK'])
  await assert.rejects(recordVerifiedDoiConfirmation({...args(db),verifyEvidence:async()=>({...evidence,source})}),/VERIFIED_DOI_EVIDENCE_REQUIRED/);
 assert.equal(db.values.get('passMarketingConsents/h1').status,'DOI_REQUESTED');
});
test('independent verified evidence records DOI_CONFIRMED and immutable correlated evidence exactly once',async()=>{
 const db=fixture();assert.equal((await recordVerifiedDoiConfirmation(args(db))).status,'DOI_CONFIRMED');
 const size=db.values.size;assert.equal((await recordVerifiedDoiConfirmation(args(db))).alreadyConfirmed,true);assert.equal(db.values.size,size);
});
test('withdrawal, wrong email, list, consent revision, template and stale event cannot confirm',async()=>{
 for(const status of ['WITHDRAWN','SUPPRESSED'])await assert.rejects(recordVerifiedDoiConfirmation(args(fixture(status))),/CONSENT_INACTIVE/);
 for(const patch of [{email:'other@example.test'},{listId:22},{templateId:999},{consentRevision:'old'},{confirmedAt:120}]){
  const db=fixture();await assert.rejects(recordVerifiedDoiConfirmation({...args(db),verifyEvidence:async()=>({...evidence,...patch})}),/EVIDENCE/);
  assert.equal(db.values.get('passMarketingConsents/h1').status,'DOI_REQUESTED');
 }
});
test('verifier failure leaves registry unchanged',async()=>{
 const db=fixture();const before=structuredClone(db.values);
 await assert.rejects(recordVerifiedDoiConfirmation({...args(db),verifyEvidence:async()=>{throw Error('UNAVAILABLE')}}),/UNAVAILABLE/);
 assert.deepEqual(db.values,before);
});
