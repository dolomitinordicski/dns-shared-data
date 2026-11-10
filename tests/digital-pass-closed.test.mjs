import test from 'node:test';
import assert from 'node:assert/strict';
import {closedDigitalPassHandler} from '../server/digital-pass-closed.mjs';
const origin='https://dolomitinordicski.github.io';
test('closed release refuses every route with no reads of body, Auth, database or secret',async()=>{
 for(const path of ['/v1/pass-activations/prepare','/v1/pass-activations/claim','/v1/pass-registrations/complete','/v1/me/digital-pass','/v1/me/marketing/opt-in','/v/token','/unknown'])for(const method of ['GET','POST','PUT','DELETE']){
  const headers={};let code,body;
  const req={path,method,get:()=>origin,get body(){throw Error('BODY_MUST_NOT_BE_READ')}};
  const res={set(k,v){headers[k]=v;return this},status(v){code=v;return this},json(v){body=v;return this}};
  await closedDigitalPassHandler([origin])(req,res);
  assert.equal(code,503);assert.deepEqual(body,{error:'SERVICE_UNAVAILABLE'});assert.equal(headers['Cache-Control'],'no-store');
 }
});
test('closed origin allowlist and OPTIONS remain testable behind private infrastructure',async()=>{
 for(const [incoming,method,expected] of [['https://evil.example','POST',403],['https://evil.example','OPTIONS',403],[origin,'OPTIONS',204],[undefined,'POST',503]]){
  let code;const headers={};const res={set(k,v){headers[k]=v;return this},status(v){code=v;return this},json(){},end(){}};
  await closedDigitalPassHandler([origin])({method,get:()=>incoming},res);assert.equal(code,expected);
  assert.equal(headers['Access-Control-Allow-Origin'],incoming===origin?origin:undefined);
 }
});
