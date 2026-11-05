import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifyPublicPass, renderPublicPassHtml } from '../server/digital-pass-public-verify.mjs';
const token='A'.repeat(43);
const id=createHash('sha256').update(token).digest('hex');
function db(credential, registration) {
  return { collection(name) { return { doc(key) { return { async get() {
    const record=name==='digitalCredentials'&&key===id?credential:name==='passRegistrations'&&key==='physical-1'?registration:null;
    return {exists:!!record,data:()=>record};
  } }; } }; } };
}
const valid={status:'ACTIVE',physicalPassId:'physical-1',seasonId:'2026-27',productCode:'sk-dns',validFrom:100,validUntil:1000};
const registered={status:'ACTIVE',credentialId:id};
test('camera verification returns status only and respects validity',async()=>{
  assert.equal(await verifyPublicPass({db:db(valid,registered),token,now:500}),'VALID');
  assert.equal(await verifyPublicPass({db:db(valid,registered),token,now:1000}),'EXPIRED');
  assert.equal(await verifyPublicPass({db:db({...valid,status:'REVOKED'},registered),token,now:500}),'REVOKED');
  assert.equal(await verifyPublicPass({db:db(valid,null),token,now:500}),'REVOKED');
  assert.equal(await verifyPublicPass({db:db(null,null),token,now:500}),'UNKNOWN');
  assert.equal(await verifyPublicPass({db:db(valid,registered),token:'wrong',now:500}),'UNKNOWN');
});
test('public page is minimal, animated and excludes sensitive identity',()=>{
 const page=renderPublicPassHtml('VALID');
 assert.match(page,/GÜLTIG · VALIDO/);
 assert.match(page,/animation:pulse/);
 assert.doesNotMatch(page,/holderName|email|printedNumber|credentialId|physicalPassId/);
});
