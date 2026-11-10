import test from 'node:test';
import assert from 'node:assert/strict';
import { controlledPilotSettings, assertControlledPilotOpen } from '../server/digital-pass-controlled-pilot.mjs';
import { createDigitalPassHandler } from '../server/digital-pass-http.mjs';
import { resolveSeasonPassAssignment } from '../server/digital-pass-inventory-resolver.mjs';
import { MemoryDb } from './helpers/digital-pass-memory-db.mjs';

const now = Date.now();
const settings = { enabled:'true', organizationId:'synthetic-org-a', passNumber:'1',
  operatorUid:'operator-a', until:new Date(now + 1800000).toISOString() };
const pilot = controlledPilotSettings(settings, now);
const hmacSecret = 'synthetic-local-test-key-never-use-in-cloud';
const snapshot = { approved:true, seasonId:'2026-27', revision:'synthetic-pilot-test',
  rows:[{itemCode:'sk-dns',organizationId:'synthetic-org-a',from:1,to:5},
    {itemCode:'sk-dns',organizationId:'synthetic-org-b',from:6,to:10}] };
const identities = {
 'operator-a': {uid:'operator-a',email:'operator@example.test',email_verified:true},
 'other-admin': {uid:'other-admin',email:'admin@example.test',email_verified:true},
 holder: {uid:'holder',email:'holder@example.test',email_verified:true},
 other: {uid:'other',email:'other@example.test',email_verified:true},
 unverified: {uid:'unverified',email:'unverified@example.test',email_verified:false},
};
function fixture(options = {}) {
 const db = new MemoryDb();
 db.values.set('passInventorySnapshots/synthetic-pilot-test', snapshot);
 db.values.set('users/operator-a',{active:true,globalRoles:['dns-admin']});
 db.values.set('users/other-admin',{active:true,globalRoles:['dns-admin']});
 const auth = { verifyIdToken:async(token,checkRevoked) => {
   assert.equal(checkRevoked,true); if (!identities[token]) throw Error('UNAUTHORIZED'); return identities[token];
 }};
 return { db, handler:createDigitalPassHandler({db,auth,hmacSecret,allowedOrigins:['https://pilot.example.test'],
   inventoryRevision:snapshot.revision,validFrom:now-1000,validUntil:now+86400000,
   noticeVersion:'synthetic-privacy-v1',registrationEnabled:false,saleClaimEnabled:true,pilot,...options}) };
}
async function call(handler,path,token,body={}) {
 const res = { headers:{}, set(k,v){this.headers[k]=v;return this;},
  status(status){this.statusCode=status;return this;}, json(value){this.body=value;return this;}, end(){return this;} };
 const req = {method:'POST',path,body,is:type=>type==='application/json',
  get:name=>name==='Origin'?'https://pilot.example.test':name==='Authorization'&&token?'Bearer '+token:undefined};
 await handler(req,res); return res;
}
const prepare = (handler,number='1',token='operator-a') => call(handler,'/v1/pass-activations/prepare',token,{passNumber:number});

test('pilot is opt-in, single-card and capped at four hours; expired settings stay restricted',()=>{
 assert.equal(controlledPilotSettings(),null);
 assert.equal(controlledPilotSettings({enabled:'false'}),null);
 assert.equal(pilot.printedNumber,'000001');
 for(const bad of [{enabled:'yes'},{operatorUid:''},{organizationId:''},{passNumber:'0'},
   {passNumber:'1,2'},{until:new Date(now+5*3600000).toISOString()}])
  assert.throws(()=>controlledPilotSettings({...settings,...bad},now),/PILOT_CONFIGURATION/);
 const expired = controlledPilotSettings({...settings,until:new Date(now-1000).toISOString()},now);
 assert.throws(()=>assertControlledPilotOpen(expired,now),/PILOT_WINDOW_CLOSED/);
});
test('verified QR claim confirms sale while optional registration and marketing remain disabled',async()=>{
 const {db,handler}=fixture();
 const prep=await prepare(handler);assert.equal(prep.statusCode,200);
 const query={physicalPassId:prep.body.physicalPassId,preparationId:prep.body.preparationId};
 assert.equal((await call(handler,'/v1/pass-activations/status','operator-a',query)).body.status,'PENDING');
 const body={passNumber:'1',code:prep.body.code};
 assert.equal((await call(handler,'/v1/pass-activations/claim','unverified',body)).statusCode,401);
 const claim=await call(handler,'/v1/pass-activations/claim','holder',body);
 assert.equal(claim.statusCode,200);assert.equal(claim.body.status,'SOLD_ATTESTED');
 assert.equal((await call(handler,'/v1/pass-activations/status','operator-a',query)).body.status,'SOLD_ATTESTED');
 assert.equal((await call(handler,'/v1/pass-activations/claim','holder',body)).body.alreadyClaimed,true);
 assert.equal((await call(handler,'/v1/pass-activations/claim','other',body)).statusCode,400);
 assert.equal((await call(handler,'/v1/pass-registrations/complete','holder',body)).body.error,'REGISTRATION_DISABLED');
 assert.equal([...db.values.keys()].filter(k=>k.startsWith('digitalCredentials/')).length,0);
 assert.equal([...db.values.keys()].filter(k=>k.startsWith('passMarketingOutbox/')).length,0);
});
test('even admins cannot prepare another card or use another operator account in a controlled pilot',async()=>{
 const {handler}=fixture();
 assert.equal((await prepare(handler,'2')).statusCode,403);
 assert.equal((await prepare(handler,'99999')).statusCode,403);
 assert.equal((await prepare(handler,'1','other-admin')).statusCode,403);
 const {handler:foreign}=fixture({pilot:controlledPilotSettings({...settings,organizationId:'synthetic-org-b'},now)});
 assert.equal((await prepare(foreign)).statusCode,403);
});
test('status/legacy validation cannot bypass the card or operator boundary',async()=>{
 const {db,handler}=fixture();const prep=await prepare(handler);
 const body={physicalPassId:prep.body.physicalPassId,preparationId:prep.body.preparationId};
 assert.equal((await call(handler,'/v1/pass-activations/status','other-admin',body)).statusCode,403);
 const assignment=resolveSeasonPassAssignment({passNumber:'2',seasonId:'2026-27',productCode:'sk-dns',snapshot});
 db.values.set('passActivationChallenges/'+assignment.physicalPassId,{printedNumber:'000002',organizationId:'synthetic-org-a'});
 for(const path of ['/v1/pass-activations/status','/v1/pass-activations/validate','/v1/admin/pass-activations/reissue'])
   assert.equal((await call(handler,path,'operator-a',{...body,physicalPassId:assignment.physicalPassId})).statusCode,403);
});
test('expired window denies new activations before authentication and database writes',async()=>{
 let touched=0;
 const {handler}=fixture({db:{collection(){touched++;throw Error('NO_DB');}},auth:{verifyIdToken(){touched++;throw Error('NO_AUTH');}},
   pilot:controlledPilotSettings({...settings,until:new Date(now-1000).toISOString()},now)});
 const res=await prepare(handler);
 assert.equal(res.statusCode,503);assert.equal(res.body.error,'PILOT_WINDOW_CLOSED');assert.equal(touched,0);
});
test('registration can be enabled only for the selected card; claim does not imply marketing consent',async()=>{
 const {db,handler}=fixture({registrationEnabled:true});const prep=await prepare(handler);
 const body={passNumber:'1',code:prep.body.code,givenName:'Synthetic',familyName:'Test',language:'it'};
 assert.equal((await call(handler,'/v1/pass-activations/claim','holder',body)).statusCode,200);
 const complete=await call(handler,'/v1/pass-registrations/complete','holder',body);
 assert.equal(complete.statusCode,200);assert.equal(complete.body.alreadyRegistered,false);
 const retry=await call(handler,'/v1/pass-registrations/complete','holder',body);assert.equal(retry.body.alreadyRegistered,true);
 assert.equal((await call(handler,'/v1/pass-registrations/complete','other',body)).statusCode,400);
 assert.equal([...db.values.keys()].filter(k=>k.startsWith('digitalCredentials/')).length,1);
 assert.equal([...db.values.values()].find(v=>v.purpose==='DNS_MARKETING').status,'NOT_REQUESTED');
});
test('sale claim kill switch rejects requests without touching Auth/Firestore',async()=>{
 let touched=0;
 const {handler}=fixture({saleClaimEnabled:false,db:{collection(){touched++;throw Error('NO_DB');}},auth:{verifyIdToken(){touched++;throw Error('NO_AUTH');}}});
 const res=await call(handler,'/v1/pass-activations/claim','holder',{passNumber:'1',code:'ABCDEF'});
 assert.equal(res.statusCode,503);assert.equal(res.body.error,'SALE_CLAIM_DISABLED');assert.equal(touched,0);
});
