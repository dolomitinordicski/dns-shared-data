import test from 'node:test';
import assert from 'node:assert/strict';
import { getBrevoMarketingStatus, unlinkBrevoDigitalPassList } from '../server/digital-pass-brevo-contacts.mjs';
const args={email:'Skier+1@example.com',apiKey:'fake'};
test('unknown contact is not blocked and is not subscribed',async()=>{
 const state=await getBrevoMarketingStatus({...args,fetchImpl:async()=>({status:404})});
 assert.deepEqual(state,{exists:false,suppressed:false,inList:false});
});
test('Brevo global blacklist and list-13 unsubscribes block DOI',async()=>{
 for(const detail of [
  {emailBlacklisted:true,listIds:[],listUnsubscribed:[]},
  {emailBlacklisted:false,listIds:[13],listUnsubscribed:[13]}
 ]) {
  const status=await getBrevoMarketingStatus({...args,fetchImpl:async()=>({status:200,ok:true,json:async()=>detail})});
  assert.equal(status.suppressed,true);
 }
});
test('unavailable Brevo lookup fails closed',async()=>{
 await assert.rejects(getBrevoMarketingStatus({...args,fetchImpl:async()=>({status:503,ok:false})}),
 /BREVO_LOOKUP_UNAVAILABLE/);
});
test('withdrawal removes list 13 only, without global unsubscribe',async()=>{
 let request;
 const result=await unlinkBrevoDigitalPassList({...args,fetchImpl:async(url,options)=>{
  request={url,options};return {status:204,ok:true};
 }});
 assert.equal(result.status,'UNLINKED');
 assert.ok(request.url.includes('Skier%2B1%40example.com') || request.url.includes('skier%2B1%40example.com'));
 assert.deepEqual(JSON.parse(request.options.body),{unlinkListIds:[13]});
});
test('unsuccessful unlink requires retry/reconciliation',async()=>{
 await assert.rejects(unlinkBrevoDigitalPassList({...args,fetchImpl:async()=>({status:503,ok:false})}),
 /BREVO_UNLINK_FAILED/);
});
