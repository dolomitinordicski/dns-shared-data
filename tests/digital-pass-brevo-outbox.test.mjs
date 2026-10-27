import test from 'node:test';
import assert from 'node:assert/strict';
import {enqueueDoi,claimDoiJob,finishDoiJob,quarantineExpiredLease} from '../server/digital-pass-brevo-outbox.mjs';
function fakeDb(status='PENDING_DOI') {
 const records=new Map([['passMarketingConsents/h1',{status}]]);
 const collection=name=>({doc:id=>({key:name+'/'+id})});
 return {records,collection,runTransaction:async callback=>callback({
  get:async ref=>({exists:records.has(ref.key),data:()=>records.get(ref.key)}),
  create:(ref,value)=>{if(records.has(ref.key))throw Error('ALREADY_EXISTS');records.set(ref.key,value)},
  update:(ref,value)=>records.set(ref.key,{...records.get(ref.key),...value}),
 })};
}
test('queue is idempotent and one automatic dispatch only',async()=>{
 const db=fakeDb();
 assert.equal((await enqueueDoi({db,holderUid:'h1'})).status,'QUEUED');
 assert.equal((await enqueueDoi({db,holderUid:'h1'})).alreadyQueued,true);
 const claimed=await claimDoiJob({db,holderUid:'h1',now:100});
 await assert.rejects(claimDoiJob({db,holderUid:'h1',now:101}),/DOI_JOB_NOT_CLAIMABLE/);
 assert.equal((await finishDoiJob({db,...claimed,outcome:'ACCEPTED',now:102})).status,'DOI_REQUESTED');
 assert.equal(db.records.get('passMarketingOutbox/h1').dispatchCount,1);
});
test('ambiguous crash is quarantined and never replayed',async()=>{
 const db=fakeDb();await enqueueDoi({db,holderUid:'h1'});
 await claimDoiJob({db,holderUid:'h1',now:100});
 assert.equal((await quarantineExpiredLease({db,holderUid:'h1',now:120101})).changed,true);
 await assert.rejects(claimDoiJob({db,holderUid:'h1',now:120102}),/DOI_JOB_NOT_CLAIMABLE/);
});
test('withdrawal during send is respected',async()=>{
 const db=fakeDb();await enqueueDoi({db,holderUid:'h1'});
 const claim=await claimDoiJob({db,holderUid:'h1'});
 db.records.set('passMarketingConsents/h1',{status:'WITHDRAWN'});
 assert.equal((await finishDoiJob({db,...claim,outcome:'ACCEPTED'})).status,'WITHDRAWN');
 assert.equal(db.records.get('passMarketingConsents/h1').status,'WITHDRAWN');
});
