import test from 'node:test';
import assert from 'node:assert/strict';
import { recordMarketingOptIn, dispatchMarketingDoi, withdrawMarketingConsent } from '../server/digital-pass-marketing-consent.mjs';

function fakeDb() {
  const records = new Map();
  const collection = name => ({ doc: id => ({ key: name + '/' + id }) });
  return {
    records, collection,
    runTransaction: async callback => callback({
      get: async ref => ({ exists: records.has(ref.key), data: () => records.get(ref.key) }),
      set: (ref,value) => records.set(ref.key,value),
      update: (ref,changes) => records.set(ref.key,{...records.get(ref.key),...changes}),
      create: (ref,value) => records.set(ref.key,value),
    }),
  };
}
const holder = { id: 'holder-1', email: 'Skier@example.com', emailVerifiedAt: 1 };
const input = { affirmative:true, noticeVersion:'marketing-v1', source:'digital-pass', language:'de' };
test('no opt-in without explicit affirmative action', async () => {
  const db=fakeDb();
  await assert.rejects(recordMarketingOptIn({db,authenticatedHolder:holder,input:{...input,affirmative:false}}),
    /EXPLICIT_MARKETING_CONSENT_REQUIRED/);
  assert.equal(db.records.size,0);
});
test('record DOI, send Brevo once, then refuse repeated sends', async () => {
  const db=fakeDb();
  await recordMarketingOptIn({db,authenticatedHolder:holder,input});
  let called=0, payload;
  const args={ db, authenticatedHolder:holder, apiKey:'dummy', redirectionUrl:'https://www.dolomitinordicski.com/',
    isSuppressed:async()=>false, fetchImpl:async(url,options)=> { called++; payload=JSON.parse(options.body); return {ok:true,status:201}; } };
  const result=await dispatchMarketingDoi(args);
  assert.equal(result.status,'DOI_REQUESTED');
  assert.deepEqual(payload.includeListIds,[13]);
  assert.equal(payload.templateId,3);
  assert.equal(called,1);
  await assert.rejects(dispatchMarketingDoi(args),/MARKETING_DOI_NOT_ELIGIBLE/);
  assert.equal(called,1);
});
test('unsubscribe is local immediately and blocks dispatch',async()=>{
  const db=fakeDb();
  await recordMarketingOptIn({db,authenticatedHolder:holder,input});
  const res=await withdrawMarketingConsent({db,authenticatedHolder:holder});
  assert.equal(res.status,'WITHDRAWN');
  assert.equal(db.records.get('passMarketingConsents/holder-1').brevoReconcileNeeded,true);
  await assert.rejects(dispatchMarketingDoi({db,authenticatedHolder:holder,isSuppressed:async()=>false}),
    /MARKETING_DOI_NOT_ELIGIBLE/);
});
test('provider suppression prevents API call and leaves consent pending',async()=>{
  const db=fakeDb();
  await recordMarketingOptIn({db,authenticatedHolder:holder,input});
  let called=false;
  await assert.rejects(dispatchMarketingDoi({
    db,authenticatedHolder:holder,apiKey:'dummy',redirectionUrl:'https://www.dolomitinordicski.com/',
    isSuppressed:async()=>true,fetchImpl:async()=>{called=true;return {ok:true};},
  }),/MARKETING_SUPPRESSED/);
  assert.equal(called,false);
  assert.equal(db.records.get('passMarketingConsents/holder-1').status,'PENDING_DOI');
});
