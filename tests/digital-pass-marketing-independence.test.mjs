import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MemoryDb} from './helpers/digital-pass-memory-db.mjs';
import {createDigitalPassHandler} from '../server/digital-pass-http.mjs';
import {prepareActivation,validateSale} from '../server/digital-pass-activation.mjs';
import {resolveSeasonPassAssignment} from '../server/digital-pass-inventory-resolver.mjs';
import {getDigitalPass,checkDigitalCredential} from '../server/digital-pass-registration.mjs';
import {requestMarketingOptIn,withdrawMarketing} from '../server/digital-pass-marketing.mjs';
import {dispatchDoiJob} from '../server/digital-pass-brevo-dispatch.mjs';
import {enqueueDoi,quarantineExpiredLease} from '../server/digital-pass-brevo-outbox.mjs';
const identity={uid:'synthetic-holder',email:'synthetic@example.test',email_verified:true};
const actor={uid:'synthetic-operator',grants:[{organizationId:'synthetic-org',permissions:['passActivation.issue','passSale.attest','passValidation.check']}]};
const secret='synthetic-HMAC-key-never-production-123456789';
const snapshot={approved:true,revision:'synthetic-only',seasonId:'2026-27',rows:[{itemCode:'sk-dns',organizationId:'synthetic-org',from:1,to:2}]};
const inventory={passNumber:'1',seasonId:'2026-27',productCode:'sk-dns',snapshot};
const response=()=>({code:200,set(){return this},status(code){this.code=code;return this},json(value){this.value=value;return this}});
async function fixture(){
 const db=new MemoryDb();const assignment=resolveSeasonPassAssignment(inventory);
 db.values.set('passInventorySnapshots/synthetic-only',snapshot);
 const prepared=await prepareActivation({db,actor,...inventory,resolveAssignment:async()=>assignment,hmacSecret:secret});
 await validateSale({db,actor,...prepared});
 const auth={verifyIdToken:async(_token,checkRevoked)=>{assert.equal(checkRevoked,true);return identity}};
 const opts={db,auth,hmacSecret:secret,allowedOrigins:['https://example.test'],inventoryRevision:'synthetic-only',validFrom:0,validUntil:Date.now()+600000,noticeVersion:'test-only-v1',registrationEnabled:true};
 const body={passNumber:'1',code:prepared.code,givenName:'Synthetic',familyName:'Holder',language:'it'};
 const req=(path,body)=>({method:'POST',path,body,is:()=>true,get:key=>key==='Authorization'?'Bearer synthetic':key==='Origin'?'https://example.test':undefined});
 const register=async(extra={})=>{const res=response();await createDigitalPassHandler(opts)(req('/v1/pass-registrations/complete',{...body,...extra}),res);return res};
 return {db,assignment,opts,req,register};
}
const count=(db,name)=>[...db.values.keys()].filter(k=>k.startsWith(name+'/')).length;
const optIn=f=>requestMarketingOptIn({db:f.db,identity,affirmative:true,language:'it',noticeVersion:'independent-marketing-v1'});
const dispatch=f=>({db:f.db,holderUid:identity.uid,apiKey:'synthetic-mock-key',templateIds:{it:9},redirectUrl:'https://example.test/confirmed',resolveVerifiedEmail:async()=>identity.email});
async function assertPassUsable(f){
 const pass=await getDigitalPass({db:f.db,identity,physicalPassId:f.assignment.physicalPassId});
 assert.equal(pass.status,'ACTIVE');assert.match(pass.qrPayload,/^dns-pass:v1:[A-Za-z0-9_-]{43}$/);
 assert.equal((await checkDigitalCredential({db:f.db,actor,qrPayload:pass.qrPayload})).status,'VALID');
}
test('HTTP registration with no marketing consent succeeds without Brevo config, calls or jobs',async t=>{
 const spy=t.mock.method(globalThis,'fetch',()=>{throw Error('BREVO_MUST_NOT_BE_CALLED')});const f=await fixture();
 const res=await f.register();assert.equal(res.code,200);assert.equal(spy.mock.callCount(),0);
 assert.equal(count(f.db,'passMarketingConsents'),0);assert.equal(count(f.db,'passMarketingOutbox'),0);
 await assertPassUsable(f);
});
test('forged marketing flags in registration never opt in or schedule a DOI',async()=>{
 const f=await fixture();assert.equal((await f.register({marketingRequested:true,marketingNoticeVersion:'forged',affirmative:true})).code,200);
 assert.equal(count(f.db,'passMarketingConsents'),0);assert.equal(count(f.db,'passMarketingOutbox'),0);
 assert.equal([...f.db.values.values()].find(v=>v.purpose==='DNS_MARKETING').affirmative,false);
});
for(const failure of ['401','500','timeout','unavailable'])test('registration/auth/QR remain usable when Brevo is '+failure,async t=>{
 const spy=t.mock.method(globalThis,'fetch',()=>{throw Error('BREVO_'+failure)});const f=await fixture();
 assert.equal((await f.register()).code,200);assert.equal(spy.mock.callCount(),0);
 await optIn(f);const before=structuredClone(f.db.values.get('passRegistrations/'+f.assignment.physicalPassId));
 const result=await dispatchDoiJob({...dispatch(f),timeoutMs:10,fetchImpl:async(_url,init)=>{
  if(init.method==='GET')return {status:404};
  if(failure==='timeout')return new Promise(()=>{});
  if(failure==='unavailable')throw Error('SYNTHETIC_NETWORK_ERROR');
  return {status:Number(failure),ok:false};
 }});
 assert.equal(result.status,'RECONCILIATION_REQUIRED');
 assert.deepEqual(f.db.values.get('passRegistrations/'+f.assignment.physicalPassId),before);
 assert.equal((await f.register()).value.alreadyRegistered,true);await assertPassUsable(f);
 await assert.rejects(dispatchDoiJob(dispatch(f)),/DOI_JOB_NOT_CLAIMABLE/);
});
test('no valid consent means no provider call and no enqueue, even for forged PENDING_DOI',async t=>{
 const f=await fixture();const spy=t.mock.method(globalThis,'fetch',()=>{throw Error('NO_NETWORK')});
 await assert.rejects(dispatchDoiJob(dispatch(f)),/DOI_JOB_NOT_CLAIMABLE/);
 await assert.rejects(enqueueDoi({db:f.db,holderUid:identity.uid}),/NO_ELIGIBLE_CONSENT/);
 f.db.values.set('passMarketingConsents/'+identity.uid,{status:'PENDING_DOI',affirmative:false});
 await assert.rejects(enqueueDoi({db:f.db,holderUid:identity.uid}),/NO_ELIGIBLE_CONSENT/);
 assert.equal(count(f.db,'passMarketingOutbox'),0);assert.equal(spy.mock.callCount(),0);
});
test('HTTP 201 means DOI_REQUESTED only and provider payload is a strict marketing whitelist',async()=>{
 const f=await fixture();await f.register();await optIn(f);let sent;
 const result=await dispatchDoiJob({...dispatch(f),passNumber:'SECRET_NUMBER',code:'SECRET_CODE',qrPayload:'SECRET_QR',gps:'SECRET_GPS',fetchImpl:async(url,init)=>{
  if(init.method==='GET'){assert.match(url,/synthetic%40example.test$/);return {status:404}}
  sent=JSON.parse(init.body);return {status:201,ok:true};
 }});
 assert.deepEqual(sent,{email:identity.email,includeListIds:[13],templateId:9,redirectionUrl:'https://example.test/confirmed'});
 assert.equal(result.status,'DOI_REQUESTED');assert.equal(f.db.values.get('passMarketingConsents/'+identity.uid).status,'DOI_REQUESTED');
 assert.equal(count(f.db,'consentEvidence'),0);await assertPassUsable(f);
});
test('withdrawal while POST is in flight survives late HTTP 201 and blocks further dispatch',async()=>{
 const f=await fixture();await f.register();await optIn(f);
 let release,started;const pending=new Promise(r=>{release=r});const entered=new Promise(r=>{started=r});let posts=0;
 const sending=dispatchDoiJob({...dispatch(f),fetchImpl:async(_url,init)=>{
  if(init.method==='GET')return {status:404};posts++;started();return pending;
 }});
 await entered;await withdrawMarketing({db:f.db,identity});release({status:201,ok:true});
 assert.equal((await sending).status,'WITHDRAWN');
 assert.equal(f.db.values.get('passMarketingConsents/'+identity.uid).needsBrevoUnsubscribe,true);
 assert.equal(f.db.values.get('passMarketingOutbox/'+identity.uid).status,'WITHDRAWN');
 await assert.rejects(dispatchDoiJob(dispatch(f)),/DOI_JOB_NOT_CLAIMABLE/);
 assert.equal(posts,1);await assertPassUsable(f);
});
test('withdrawal during timeout and expired lease cannot restore pending consent or replay',async()=>{
 const f=await fixture();await f.register();await optIn(f);let entered;
 const started=new Promise(r=>{entered=r});
 const sending=dispatchDoiJob({...dispatch(f),timeoutMs:15,fetchImpl:async(_url,init)=>{
  if(init.method==='GET')return {status:404};entered();return new Promise(()=>{});
 }});
 await started;await withdrawMarketing({db:f.db,identity});assert.equal((await sending).status,'WITHDRAWN');
 await quarantineExpiredLease({db:f.db,holderUid:identity.uid,now:Date.now()+999999});
 await assert.rejects(dispatchDoiJob(dispatch(f)),/DOI_JOB_NOT_CLAIMABLE/);await assertPassUsable(f);
});
test('disabled registration returns 503 before even malformed body, token verification or Firestore',async()=>{
 const fail=()=>{throw Error('NO_AUTH_OR_FIRESTORE_ALLOWED')};const opts={db:{collection:fail},auth:{verifyIdToken:fail},hmacSecret:secret,allowedOrigins:['https://example.test'],inventoryRevision:'synthetic',validFrom:0,validUntil:9999999999999,noticeVersion:'synthetic'};
 for(const flag of [undefined,false,'true',1]){
  const res=response();await createDigitalPassHandler({...opts,registrationEnabled:flag})({method:'POST',path:'/v1/pass-registrations/complete',get:()=>undefined,is:fail},res);
  assert.equal(res.code,503);assert.deepEqual(res.value,{error:'REGISTRATION_DISABLED'});
 }
 const entry=readFileSync(new URL('../server/firebase-entry.mjs',import.meta.url),'utf8');
 assert.match(entry,/defineString\('DNS_PASS_REGISTRATION_ENABLED', \{ default: 'false' \}\)/);
 assert.doesNotMatch(entry,/BREVO_API_KEY|dispatchDoiJob|sendMarketingDoi/);
});
test('unconfigured language cannot fall back to template 9 or untested 2/3/4',async()=>{
 const f=await fixture();await f.register();await optIn(f);
 f.db.values.set('passMarketingConsents/'+identity.uid,{...f.db.values.get('passMarketingConsents/'+identity.uid),language:'de'});
 await assert.rejects(dispatchDoiJob(dispatch(f)),/TEMPLATES_NOT_APPROVED/);
 assert.equal(f.db.values.get('passMarketingOutbox/'+identity.uid).dispatchCount,0);
});


test('a stalled Brevo contact response body is bounded and never blocks use of the pass',async()=>{
 const f=await fixture();await f.register();await optIn(f);
 const result=await dispatchDoiJob({...dispatch(f),timeoutMs:10,fetchImpl:async()=>({ok:true,status:200,json:()=>new Promise(()=>{})})});
 assert.equal(result.status,'RECONCILIATION_REQUIRED');await assertPassUsable(f);
});
