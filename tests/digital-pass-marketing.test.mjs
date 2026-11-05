import test from 'node:test';
import assert from 'node:assert/strict';
import {requestMarketingOptIn,withdrawMarketing} from '../server/digital-pass-marketing.mjs';
import {MemoryDb} from './helpers/digital-pass-memory-db.mjs';
const identity={uid:'u1',email:'holder@example.test',email_verified:true};
function fixture(){const db=new MemoryDb();db.values.set('passRegistrations/test',{holderUid:'u1',status:'ACTIVE'});return db;}
const input=db=>({db,identity,affirmative:true,language:'it',noticeVersion:'marketing-test-v1'});
test('explicit separate opt-in creates one consent and one outbox atomically without provider I/O',async t=>{
 const fetch=t.mock.method(globalThis,'fetch',()=>{throw Error('NO_NETWORK')});const db=fixture();
 assert.equal((await requestMarketingOptIn(input(db))).status,'PENDING_DOI');
 const first=structuredClone(db.values);
 await requestMarketingOptIn(input(db));assert.deepEqual(db.values,first);
 assert.equal(db.values.get('passMarketingOutbox/u1').status,'QUEUED');assert.equal(fetch.mock.callCount(),0);
});
test('missing, false or invalid opt-in never creates state or a send job',async()=>{
 for(const affirmative of [false,undefined,0,'true']){
  const db=fixture();await assert.rejects(requestMarketingOptIn({...input(db),affirmative}),/MARKETING_CONSENT_REQUIRED/);
  assert.equal(db.values.size,1);
 }
});
test('unverified identity, missing pass or missing independent notice fail closed',async()=>{
 const db=fixture();
 await assert.rejects(requestMarketingOptIn({...input(db),identity:{...identity,email_verified:false}}),/UNAUTHORIZED/);
 await assert.rejects(requestMarketingOptIn({...input(db),noticeVersion:''}),/MARKETING_CONSENT_REQUIRED/);
 await assert.rejects(requestMarketingOptIn({...input(new MemoryDb())}),/PASS_NOT_REGISTERED/);
});
test('withdrawal cancels a queued job, is idempotent and disallows implicit reconsent',async()=>{
 const db=fixture();await requestMarketingOptIn(input(db));
 const before=structuredClone(db.values.get('passRegistrations/test'));
 await withdrawMarketing({db,identity});await withdrawMarketing({db,identity});
 assert.equal(db.values.get('passMarketingConsents/u1').status,'WITHDRAWN');
 assert.equal(db.values.get('passMarketingOutbox/u1').status,'WITHDRAWN');
 assert.deepEqual(db.values.get('passRegistrations/test'),before);
 await assert.rejects(requestMarketingOptIn(input(db)),/REOPTIN_REQUIRES_REVIEW/);
});
