import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { enqueueDoi } from '../server/digital-pass-brevo-outbox.mjs';
import { dispatchDoiJob } from '../server/digital-pass-brevo-dispatch.mjs';

function fixture() {
 const email='holder@example.com';
 const emailHash=createHash('sha256').update(email).digest('hex');
 const records=new Map([['passMarketingConsents/h1',{holderUid:'h1',status:'PENDING_DOI',affirmative:true,language:'de',emailHash,purpose:'DNS_MARKETING',noticeVersion:'test',consentedAt:1,consentRevision:'test-revision'}]]);
 const db={
  collection:name=>({doc:id=>({
    key:name+'/'+id,
    get:async()=>({exists:records.has(name+'/'+id),data:()=>records.get(name+'/'+id)})
  })}),
  runTransaction:async fn=>fn({
   get:async r=>({exists:records.has(r.key),data:()=>records.get(r.key)}),
   create:(r,v)=>{if(records.has(r.key))throw Error('exists');records.set(r.key,v)},
   update:(r,v)=>records.set(r.key,{...records.get(r.key),...v}),
  }),
 };
 return {db,records,email};
}
const opts=f=>({db:f.db,holderUid:'h1',apiKey:'dummy',templateIds:{de:9},redirectUrl:'https://www.dolomitinordicski.com/',
 resolveVerifiedEmail:async()=>f.email});
test('dispatch checks contact state before sending once',async()=>{
 const f=fixture();await enqueueDoi({db:f.db,holderUid:'h1'});
 let calls=0;
 const result=await dispatchDoiJob({...opts(f),fetchImpl:async (url,init)=>{
  calls++;
  if(init.method==='GET')return {status:404};
  const body=JSON.parse(init.body);
  assert.equal(body.templateId,9);
  assert.deepEqual(body.includeListIds,[13]);
  return {ok:true,status:201};
 }});
 assert.equal(result.status,'DOI_REQUESTED');
 assert.equal(calls,2);
 await assert.rejects(dispatchDoiJob({...opts(f),fetchImpl:async()=>{throw Error('must not run')}}),/DOI_JOB_NOT_CLAIMABLE/);
});
test('suppressed contacts never receive a DOI',async()=>{
 const f=fixture();await enqueueDoi({db:f.db,holderUid:'h1'});
 let sent=false;
 const result=await dispatchDoiJob({...opts(f),fetchImpl:async(url,init)=>{
  if(init.method==='POST')sent=true;
  return {ok:true,status:200,json:async()=>({emailBlacklisted:true,listIds:[13],listUnsubscribed:[]})};
 }});
 assert.equal(result.status,'SUPPRESSED');assert.equal(sent,false);
});
test('ambiguous API errors are quarantined, no automatic repeat',async()=>{
 const f=fixture();await enqueueDoi({db:f.db,holderUid:'h1'});
 const result=await dispatchDoiJob({...opts(f),fetchImpl:async(_url,init)=>{
  if(init.method==='GET')return {status:404};
  throw new Error('network timeout after possible acceptance');
 }});
 assert.equal(result.status,'RECONCILIATION_REQUIRED');
 assert.equal(f.records.get('passMarketingOutbox/h1').dispatchCount,1);
});
test('withdrawal after contact lookup cancels send',async()=>{
 const f=fixture();await enqueueDoi({db:f.db,holderUid:'h1'});
 const result=await dispatchDoiJob({...opts(f),fetchImpl:async(_url,init)=>{
  assert.equal(init.method,'GET');
  f.records.set('passMarketingConsents/h1',{status:'WITHDRAWN'});
  return {status:404};
 }});
 assert.equal(result.status,'WITHDRAWN');
});

test('dispatcher refuses agency-owned or unconfigured template IDs',async()=>{
 const f=fixture();await enqueueDoi({db:f.db,holderUid:'h1'});
 for(const templateIds of [undefined,{it:2,de:3,en:4},{it:9}]){
  await assert.rejects(dispatchDoiJob({...opts(f),templateIds,fetchImpl:async()=>{throw Error('must not contact Brevo')}}),/DIGITAL_PASS_DOI_TEMPLATES_NOT_APPROVED/);
 }
 assert.equal(f.records.get('passMarketingOutbox/h1').status,'QUEUED');
});
