import test from 'node:test';
import assert from 'node:assert/strict';
import { needsPublication } from './reconcile-flyer-publication.mjs';
const id='alice__reportingArea__area-a';
const grant={userId:'alice',scopeType:'reportingArea',scopeId:'area-a',active:true,permissions:['flyer.read','flyer.write','kp.read']};
const active={active:true};
test('existing area writer is eligible without changing scope or other permissions',()=>{
 const before=JSON.stringify(grant); assert(needsPublication(id,grant,active,active)); assert.equal(JSON.stringify(grant),before);
});
test('read-only, inactive, wrong scope, malformed ID and existing publication are excluded',()=>{
 for(const patch of [{permissions:['flyer.read']},{active:false},{scopeType:'network'},{permissions:['flyer.read','flyer.write','flyer.publish']}])
  assert.equal(needsPublication(id,{...grant,...patch},active,active),false);
 assert.equal(needsPublication('wrong',grant,active,active),false);
 assert.equal(needsPublication(id,grant,{active:false},active),false);
 assert.equal(needsPublication(id,grant,active,{active:false}),false);
});
test('expired, future and malformed grant bounds are excluded',()=>{
 const now=new Date('2026-11-06T12:00:00Z');
 for(const patch of [{validTo:'2026-11-01T00:00:00Z'},{validFrom:'2027-01-01T00:00:00Z'},{validTo:'invalid'}])
  assert.equal(needsPublication(id,{...grant,...patch},active,active,now),false);
});
