import test from 'node:test';
import assert from 'node:assert/strict';
import { createDigitalPassHandler } from '../server/digital-pass-http.mjs';

const identity={uid:'test-holder',email_verified:true};
const auth={verifyIdToken:async()=>identity};
const db={collection(name){if(name==='passRateLimits')return {doc(){return {}}};throw Error('unexpected DB access '+name);},async runTransaction(callback){return callback({get:async()=>({exists:false}),set:()=>{}})}};
function response(){return {code:200,value:null,headers:{},set(k,v){this.headers[k]=v;return this},status(v){this.code=v;return this},json(v){this.value=v;return this}}}
function handler(walletSigningJson=''){return createDigitalPassHandler({db,auth,hmacSecret:'x'.repeat(48),allowedOrigins:['https://dolomitinordicski.github.io'],inventoryRevision:'test-revision',validFrom:1,validUntil:9999999999999,noticeVersion:'v1',walletIssuerId:'123456789',walletSigningJson,verificationBase:'https://pass.dolomitinordicski.com/'})}
test('Wallet capabilities fail closed when signing credentials are absent',async()=>{
 const req={method:'POST',path:'/v1/me/wallet/capabilities',body:{},is:()=>true,get:(header)=>header==='Authorization'?'Bearer test':'https://dolomitinordicski.github.io'};
 const res=response();
 await handler()(req,res);
 assert.equal(res.code,200);
 assert.deepEqual(res.value,{apple:false,google:false});
});
test('Wallet capabilities require authentication',async()=>{
 const req={method:'POST',path:'/v1/me/wallet/capabilities',body:{},is:()=>true,get:()=>undefined};
 const res=response();
 await handler()(req,res);
 assert.equal(res.code,401);
});
