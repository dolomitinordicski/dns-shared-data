import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reconcileBrevoWithdrawal} from '../server/digital-pass-brevo-withdrawal-reconcile.mjs';
const email='holder@example.com';
function fixture() {
 const data={status:'WITHDRAWN',needsBrevoUnsubscribe:true,emailHash:createHash('sha256').update(email).digest('hex')};
 const ref={get:async()=>({exists:true,data:()=>({...data})})};
 const db={collection:()=>({doc:()=>ref}),runTransaction:async fn=>fn({
  get:ref.get,update:(_,patch)=>Object.assign(data,patch)
 })};
 return {data,db};
}
const args=f=>({db:f.db,holderUid:'u1',apiKey:'test',resolveVerifiedEmail:async()=>email});
test('list 13 withdrawal unlinks only that list',async()=>{
 const f=fixture();let update;
 const result=await reconcileBrevoWithdrawal({...args(f),fetchImpl:async(_url,req)=>{
   if(req.method==='GET') return {ok:true,status:200,json:async()=>({emailBlacklisted:false,listIds:[13,22],listUnsubscribed:[]})};
   update=JSON.parse(req.body);return {ok:true,status:204};
 }});
 assert.deepEqual(update,{unlinkListIds:[13]});
 assert.equal(result.synced,true);
 assert.equal(f.data.needsBrevoUnsubscribe,false);
});
test('failed provider update leaves pending reconciliation',async()=>{
 const f=fixture();
 await assert.rejects(reconcileBrevoWithdrawal({...args(f),fetchImpl:async(_url,req)=>
  req.method==='GET'?{ok:true,status:200,json:async()=>({emailBlacklisted:false,listIds:[13],listUnsubscribed:[]})}:{ok:false,status:503}
 )}),/BREVO_UNLINK_FAILED/);
 assert.equal(f.data.needsBrevoUnsubscribe,true);
});
test('already absent contact needs no write to Brevo',async()=>{
 const f=fixture();let writes=0;
 const result=await reconcileBrevoWithdrawal({...args(f),fetchImpl:async(_url,req)=>{
   if(req.method!=='GET')writes++;
   return {status:404};
 }});
 assert.equal(result.synced,true);assert.equal(writes,0);
});
test('different verified email cannot unsubscribe a third party',async()=>{
 const f=fixture();let calls=0;
 await assert.rejects(reconcileBrevoWithdrawal({...args(f),resolveVerifiedEmail:async()=> 'other@example.com',
 fetchImpl:async()=>{calls++;throw Error('should not call')}}),/VERIFIED_EMAIL_MISMATCH/);
 assert.equal(calls,0);
});
