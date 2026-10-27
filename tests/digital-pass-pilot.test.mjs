import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSeasonPassAssignment } from '../server/digital-pass-inventory-resolver.mjs';
import { prepareActivation, validateSale, reissueActivation } from '../server/digital-pass-activation.mjs';
import { registerDigitalPass, getDigitalPass, checkDigitalCredential, revokeDigitalCredential, limitAttempts } from '../server/digital-pass-registration.mjs';
import { loadDigitalPassActor } from '../server/digital-pass-auth.mjs';

// Serialized transaction double validates domain behavior, not Firestore isolation.
class MemoryDb {
  values = new Map(); tail = Promise.resolve();
  snapshot(key) { return { exists: this.values.has(key), data: () => structuredClone(this.values.get(key)) }; }
  collection(name) {
    return { doc: id => { if (typeof id !== 'string' || !id || id.includes('/')) throw new Error('BAD_ID'); return { key: name + '/' + id, get: async () => this.snapshot(name + '/' + id) }; },
      where: (field, op, value) => ({ get: async () => ({ docs: [...this.values].filter(([key,v]) => key.startsWith(name+'/') && v[field] === value).map(([key]) => this.snapshot(key)) }) }) };
  }
  runTransaction(fn) {
    const run = this.tail.then(async () => {
      const staged=[]; const answer=await fn({ get: async r => this.snapshot(r.key),
        set: (r,v) => staged.push(['set',r.key,v]), update: (r,v) => staged.push(['update',r.key,v]), create: (r,v) => staged.push(['create',r.key,v]) });
      const next = new Map(this.values);
      for (const [op,key,value] of staged) {
        if (op==='create' && next.has(key)) throw new Error('DUPLICATE');
        next.set(key, op==='update'?{...next.get(key),...value}:value);
      }
      this.values=next; return answer;
    }); this.tail=run.catch(()=>{}); return run;
  }
}
const snapshot={ approved:true, revision:'approved-1', seasonId:'2026-27', rows:[{ itemCode:'sk-dns', organizationId:'tv-toblach', from:100, to:200 }] };
const input={ passNumber:'000123', seasonId:'2026-27', productCode:'sk-dns', snapshot };
const assignment=resolveSeasonPassAssignment(input);
const actor={ uid:'seller', grants:[{ organizationId:'tv-toblach', permissions:['passActivation.issue','passSale.attest','passValidation.check'] }] };
const identity={ uid:'holder', email:'holder@example.test', email_verified:true };
const hmacSecret='test-only-key-not-for-use-in-production-12345';
async function sale() {
  const db=new MemoryDb(); const prepared=await prepareActivation({db,actor,...input,resolveAssignment:async()=>assignment,hmacSecret,now:1000});
  await validateSale({db,actor,...prepared,now:1100}); return {db,prepared};
}
const registration=({db,prepared}, extra={})=>registerDigitalPass({db,identity,assignment,code:prepared.code,givenName:'Anna',familyName:'Test',noticeVersion:'test-notice-v1',hmacSecret,validFrom:0,validUntil:999999999,now:1200,...extra});

test('actual Data Entry itemCode, opaque stable ID, pilot restriction and ambiguity',()=>{
  assert.match(assignment.physicalPassId,/^[a-f0-9]{64}$/);
  assert.equal(resolveSeasonPassAssignment({...input,passNumber:'123'}).physicalPassId,assignment.physicalPassId);
  assert.throws(()=>resolveSeasonPassAssignment({...input,seasonId:'2025-26'}),/NOT_ELIGIBLE/);
  assert.throws(()=>resolveSeasonPassAssignment({...input,productCode:'sk-area'}),/NOT_ELIGIBLE/);
  assert.throws(()=>resolveSeasonPassAssignment({...input,snapshot:{...snapshot,approved:false}}),/UNAPPROVED/);
  assert.throws(()=>resolveSeasonPassAssignment({...input,snapshot:{...snapshot,rows:[...snapshot.rows,{...snapshot.rows[0],itemCode:'sk-area'}]}}),/AMBIGUOUS/);
});
test('Validate rejects stale generation even for same seller',async()=>{
  const {db,prepared}=await sale();
  await assert.rejects(validateSale({db,actor,...prepared,preparationId:'old',now:1300}),/STALE_PREPARATION/);
});
test('email verification, wrong code, expiry and pre-Validate all fail closed',async()=>{
  const state=await sale();
  await assert.rejects(registration(state,{identity:{...identity,email_verified:false}}),/EMAIL_VERIFICATION_REQUIRED/);
  await assert.rejects(registration(state,{code:'AAAAAA'}),/INVALID_OR_EXPIRED/);
  state.db.values.get('passActivationChallenges/'+assignment.physicalPassId).status='PREPARED';
  await assert.rejects(registration(state),/INVALID_OR_EXPIRED/);
  state.db.values.get('passActivationChallenges/'+assignment.physicalPassId).status='ENABLED';
  await assert.rejects(registration(state,{now:99999999}),/INVALID_OR_EXPIRED/);
});
test('one concurrent holder wins; replay by same holder is idempotent',async()=>{
  const state=await sale();
  const results=await Promise.allSettled([registration(state),registration(state,{identity:{...identity,uid:'other'}})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await registration(state)).alreadyRegistered,true);
  assert.equal((await validateSale({db:state.db,actor,...state.prepared,now:1500})).alreadyValidated,true);
  assert.equal(state.db.values.get('passActivationChallenges/'+assignment.physicalPassId).saleStatus,'SOLD_ATTESTED');
  assert.equal([...state.db.values.keys()].filter(k=>k.startsWith('digitalCredentials/')).length,1);
});
test('holder retrieval, restricted scan, expiry and immediate digital-only revocation',async()=>{
  const state=await sale(); await registration(state);
  const pass=await getDigitalPass({db:state.db,identity,physicalPassId:assignment.physicalPassId});
  assert.match(pass.qrPayload,/^dns-pass:v1:[A-Za-z0-9_-]{43}$/);
  assert.equal(pass.qrPayload.includes('000123'),false);
  await assert.rejects(getDigitalPass({db:state.db,identity:{...identity,uid:'other'},physicalPassId:assignment.physicalPassId}),/NOT_FOUND/);
  await assert.rejects(checkDigitalCredential({db:state.db,actor:{uid:'denied'},qrPayload:pass.qrPayload}),/FORBIDDEN/);
  assert.equal((await checkDigitalCredential({db:state.db,actor,qrPayload:pass.qrPayload,now:1300})).status,'VALID');
  assert.equal((await checkDigitalCredential({db:state.db,actor,qrPayload:pass.qrPayload,now:999999999})).status,'EXPIRED');
  assert.equal((await checkDigitalCredential({db:state.db,actor,qrPayload:'bogus'})).status,'UNKNOWN');
  const credentialId=state.db.values.get('passRegistrations/'+assignment.physicalPassId).credentialId;
  await revokeDigitalCredential({db:state.db,actor:{uid:'admin',isDnsAdmin:true},credentialId,reason:'Test',now:1400});
  assert.equal((await checkDigitalCredential({db:state.db,actor,qrPayload:pass.qrPayload,now:1500})).status,'REVOKED');
  assert.equal(state.db.values.get('passActivationChallenges/'+assignment.physicalPassId).status,'CONSUMED');
  assert.equal([...state.db.values.values()].find(v=>v.purpose==='DNS_MARKETING').status,'NOT_REQUESTED');
});
test('rate limits persist failed attempts',async()=>{
  const db=new MemoryDb(); await limitAttempts({db,key:'test',max:1,now:0});
  await assert.rejects(limitAttempts({db,key:'test',max:1,now:1}),/RATE_LIMITED/);
  await limitAttempts({db,key:'test',max:1,now:600001});
});
test('DNS Core actor requires active user, valid membership and explicit organization grant',async()=>{
  const db=new MemoryDb(); const auth={verifyIdToken:async(token,revocation)=>{assert.equal(revocation,true);return {uid:'seller'};}};
  db.values.set('users/seller',{active:true,globalRoles:[]});
  db.values.set('memberships/m',{userId:'seller',organizationId:'tv-toblach',active:true});
  db.values.set('accessGrants/g',{userId:'seller',scopeType:'organization',scopeId:'tv-toblach',active:true,permissions:['passActivation.issue']});
  assert.equal((await loadDigitalPassActor({db,auth,idToken:'test'})).grants.length,1);
  db.values.get('memberships/m').active=false;
  assert.equal((await loadDigitalPassActor({db,auth,idToken:'test'})).grants.length,0);
  db.values.get('users/seller').active=false;
  await assert.rejects(loadDigitalPassActor({db,auth,idToken:'test'}),/FORBIDDEN/);
});
import { createDigitalPassHandler } from '../server/digital-pass-http.mjs';
test('HTTP refuses anonymous access, disallowed origin, and browser-forged authorization', async()=>{
  const db=new MemoryDb();
  const auth={verifyIdToken:async()=>({uid:'attacker',email_verified:false})};
  const handler=createDigitalPassHandler({db,auth,hmacSecret,allowedOrigins:['https://dns.example.test'],inventoryRevision:'approved-1',validFrom:0,validUntil:9999999999999,noticeVersion:'v1'});
  const run=async(headers,body={})=>{
    const response={code:0,payload:null,set(){return this;},status(value){this.code=value;return this;},json(value){this.payload=value;return this;},end(){return this;}};
    await handler({method:'POST',path:'/v1/pass-activations/validate',body,get:key=>headers[key],is:()=>true},response);return response;
  };
  assert.equal((await run({})).code,401);
  assert.equal((await run({Origin:'https://evil.example.test'})).code,403);
  const response=await run({Authorization:'Bearer test'},{actor:{uid:'admin',isDnsAdmin:true},physicalPassId:assignment.physicalPassId});
  assert.equal(response.code,403); assert.equal(db.values.has('passActivationChallenges/'+assignment.physicalPassId),false);
});

test('marketing uses the existing Brevo consent contract and requires a separate approved notice',async()=>{
  const first=await sale(); await registration(first,{marketingRequested:true});
  const declined=[...first.db.values.values()].find(v=>v.purpose==='DNS_MARKETING');
  assert.equal(declined.affirmative,false); assert.equal(declined.status,'NOT_REQUESTED');
  const second=await sale(); await registration(second,{marketingRequested:true,marketingNoticeVersion:'marketing-notice-v1'});
  const pending=[...second.db.values.values()].find(v=>v.purpose==='DNS_MARKETING');
  assert.equal(pending.holderId,identity.uid); assert.equal(pending.affirmative,true);
  assert.equal(pending.status,'PENDING_DOUBLE_OPT_IN'); assert.equal(pending.noticeVersion,'marketing-notice-v1');
  assert.equal(pending.source,'digital-pass');
});


test('admin reissue invalidates old code, preserves the physical sale and rejects registered cards',async()=>{
  const state=await sale(); const admin={uid:'admin',isDnsAdmin:true};
  const args={db:state.db,actor:admin,physicalPassId:assignment.physicalPassId,idempotencyKey:'reissue-request-0001',reason:'Expired customer activation',hmacSecret,now:2000};
  await assert.rejects(reissueActivation({...args,actor}),/FORBIDDEN/);
  const replacement=await reissueActivation(args);
  const retry=await reissueActivation(args);assert.equal(retry.alreadyReissued,true);assert.equal(retry.code,undefined);
  assert.equal(state.db.values.get('passActivationChallenges/'+assignment.physicalPassId).saleAttestedAt,1100);
  await assert.rejects(registration(state),/INVALID_OR_EXPIRED/);
  await registration(state,{code:replacement.code,now:2100});
  await assert.rejects(reissueActivation({...args,idempotencyKey:'reissue-request-0002',now:2200}),/CANNOT_REISSUE/);
});
