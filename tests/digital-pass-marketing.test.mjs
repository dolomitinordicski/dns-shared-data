import test from 'node:test';
import assert from 'node:assert/strict';
import {requestMarketingOptIn,sendMarketingDoi,withdrawMarketing} from '../server/digital-pass-marketing.mjs';
function db(){
 const data=new Map(),collection=n=>({
  doc:id=>({key:n+'/'+id}),
  where:()=>({limit:()=>({get:async()=>({empty:false,docs:[{data:()=>({status:'ACTIVE'})}]})})})
 });
 return {data,collection,runTransaction:async fn=>fn({
   get:async r=>({exists:data.has(r.key),data:()=>data.get(r.key)}),
   set:(r,v)=>data.set(r.key,v),update:(r,v)=>data.set(r.key,{...data.get(r.key),...v}),
   create:(r,v)=>data.set(r.key,v)
 })};
}
const identity={uid:'u1',email:'skier@example.com',email_verified:true};
test('marketing requires explicit affirmative separate from pass registration',async()=>{
 const d=db();
 await assert.rejects(requestMarketingOptIn({db:d,identity,affirmative:false,language:'de',noticeVersion:'v1'}),/MARKETING_CONSENT_REQUIRED/);
 assert.equal(d.data.size,0);
});
test('consent creates pending state; DOI only after suppression check',async()=>{
 const d=db();
 await requestMarketingOptIn({db:d,identity,affirmative:true,language:'de',noticeVersion:'v1'});
 let request;
 const result=await sendMarketingDoi({db:d,identity,apiKey:'dummy',redirectUrl:'https://www.dolomitinordicski.com/',
 isSuppressed:async()=>false,fetchImpl:async(_url,opts)=>{request=JSON.parse(opts.body);return {ok:true}}});
 assert.equal(result.status,'DOI_REQUESTED');
 assert.equal(request.templateId,3);
 assert.deepEqual(request.includeListIds,[13]);
 assert.equal(d.data.get('passMarketingConsents/u1').status,'DOI_REQUESTED');
 await assert.rejects(sendMarketingDoi({db:d,identity,apiKey:'dummy',isSuppressed:async()=>false}),/MARKETING_DOI_NOT_ELIGIBLE/);
});
test('suppression never dispatches; withdrawal blocks future DOI',async()=>{
 const d=db();
 await requestMarketingOptIn({db:d,identity,affirmative:true,language:'it',noticeVersion:'v1'});
 let contacted=false;
 await assert.rejects(sendMarketingDoi({db:d,identity,apiKey:'dummy',redirectUrl:'https://www.dolomitinordicski.com',
   isSuppressed:async()=>true,fetchImpl:async()=>{contacted=true;return {ok:true}}}),/MARKETING_SUPPRESSED/);
 assert.equal(contacted,false);
 const res=await withdrawMarketing({db:d,identity});
 assert.equal(res.status,'WITHDRAWN');
 assert.equal(d.data.get('passMarketingConsents/u1').needsBrevoUnsubscribe,true);
});
