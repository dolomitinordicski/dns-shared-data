import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {recordVerifiedDoiConfirmation} from '../server/digital-pass-brevo-confirmation.mjs';
const email='holder@example.com';
function fixture(status='DOI_REQUESTED'){
 const docs=new Map([['passMarketingConsents/h1',{status,purpose:'DNS_MARKETING',affirmative:true,
 emailHash:createHash('sha256').update(email).digest('hex'),consentedAt:100}]]);
 const db={collection:collection=>({doc:id=>({id:collection+'/'+id})}),
 runTransaction:async cb=>cb({
 get:async r=>({exists:docs.has(r.id),data:()=>docs.get(r.id)}),
 create:(r,value)=>{if(docs.has(r.id))throw Error('exists');docs.set(r.id,value)},
 update:(r,value)=>docs.set(r.id,{...docs.get(r.id),...value})
 })};
 return {db,docs};
}
const evidence={source:'BREVO_DOI_CONFIRMATION_LOG',verifiedByServer:true,
 reference:'transaction-log:123',email,confirmedAt:200};
test('delivery, list membership and unverified webhook are not confirmation proof',async()=>{
 const f=fixture();
 for(const e of [{...evidence,source:'BREVO_LIST_MEMBERSHIP'},
                  {...evidence,verifiedByServer:false},{...evidence,source:'BREVO_EMAIL_DELIVERED'}])
 await assert.rejects(recordVerifiedDoiConfirmation({db:f.db,holderUid:'h1',verifiedEvidence:e,now:300}),
 /VERIFIED_DOI_EVIDENCE_REQUIRED/);
 assert.equal(f.docs.get('passMarketingConsents/h1').status,'DOI_REQUESTED');
});
test('verified DOI confirmation records immutable evidence and is idempotent',async()=>{
 const f=fixture();
 const args={db:f.db,holderUid:'h1',verifiedEvidence:evidence,now:300};
 assert.equal((await recordVerifiedDoiConfirmation(args)).status,'CONFIRMED');
 assert.equal((await recordVerifiedDoiConfirmation(args)).alreadyConfirmed,true);
 assert.equal(f.docs.get('passMarketingConsents/h1').status,'CONFIRMED');
});
test('withdrawal and stale or mismatched confirmation are denied',async()=>{
 for(const status of ['WITHDRAWN','SUPPRESSED']){
  const f=fixture(status);
  await assert.rejects(recordVerifiedDoiConfirmation({db:f.db,holderUid:'h1',verifiedEvidence:evidence,now:300}),/CONSENT_INACTIVE/);
 }
 const f=fixture();
 await assert.rejects(recordVerifiedDoiConfirmation({db:f.db,holderUid:'h1',
 verifiedEvidence:{...evidence,email:'other@example.com'},now:300}),/DOI_EVIDENCE_MISMATCH/);
});
