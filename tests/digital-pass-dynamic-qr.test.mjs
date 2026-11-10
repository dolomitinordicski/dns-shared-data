import test from 'node:test';
import assert from 'node:assert/strict';
import {MemoryDb} from './helpers/digital-pass-memory-db.mjs';
import {issueDynamicQr,resolveDynamicQr} from '../server/digital-pass-dynamic-qr.mjs';
import {verifyPublicPass} from '../server/digital-pass-public-verify.mjs';
const uid='synthetic-holder',card='synthetic-card',credentialId='a'.repeat(64),identity={uid,email_verified:true};
function fixture(){const db=new MemoryDb();db.values.set('passRegistrations/'+card,{holderUid:uid,status:'ACTIVE',credentialId});db.values.set('digitalCredentials/'+credentialId,{holderUid:uid,status:'ACTIVE',physicalPassId:card,seasonId:'2026-27',productCode:'sk-dns',validFrom:0,validUntil:999999});return db;}
test('dynamic opaque QR expires, refresh changes it, and revocation applies immediately',async()=>{
 const db=fixture();const a=await issueDynamicQr({db,identity,physicalPassId:card,now:100});const token=a.qrPayload.split(':')[2];
 assert.equal(await resolveDynamicQr({db,token,now:101}),credentialId);
 assert.equal(await verifyPublicPass({db,token,now:101,dynamic:true}),'VALID');
 assert.equal(await verifyPublicPass({db,token,now:a.qrExpiresAt,dynamic:true}),'UNKNOWN');
 const b=await issueDynamicQr({db,identity,physicalPassId:card,now:200});assert.notEqual(a.qrPayload,b.qrPayload);
 db.values.get('digitalCredentials/'+credentialId).status='REVOKED';
 assert.equal(await verifyPublicPass({db,token,now:201,dynamic:true}),'REVOKED');
 await assert.rejects(issueDynamicQr({db,identity,physicalPassId:card,now:202}));
});
test('other holders and unverified identities cannot obtain a presentation',async()=>{
 for(const actor of [{uid:'other',email_verified:true},{uid,email_verified:false}])await assert.rejects(issueDynamicQr({db:fixture(),identity:actor,physicalPassId:card,now:100}));
});
