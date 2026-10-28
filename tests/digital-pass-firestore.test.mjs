import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareActivation, validateSale } from '../server/digital-pass-activation.mjs';
import { registerDigitalPass, getDigitalPass, checkDigitalCredential, revokeDigitalCredential } from '../server/digital-pass-registration.mjs';
import { verifyPublicPass } from '../server/digital-pass-public-verify.mjs';

const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
test('Firestore emulator serializes racing preparation, Validate and two holders', { skip: !emulator }, async()=>{
  const { initializeApp, deleteApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const app=initializeApp({projectId:'demo-dns-core'},'digital-pass-concurrency'); const db=getFirestore(app);
  try {
    const physicalPassId='concurrency-'+Date.now();
    const assignment={physicalPassId,organizationId:'tv-toblach',seasonId:'2026-27',productCode:'sk-dns',printedNumber:'000123',sourceRevision:'emulator',eligibleForDnsSeasonPilot:true};
    const actor={uid:'seller',grants:[{organizationId:'tv-toblach',permissions:['passActivation.issue','passSale.attest']}]};
    const hmacSecret='emulator-only-cryptographic-key-never-production';
    const input={db,actor,passNumber:'123',seasonId:'2026-27',productCode:'sk-dns',resolveAssignment:async()=>assignment,hmacSecret};
    const results=await Promise.allSettled([prepareActivation(input),prepareActivation(input)]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    const prepared=results.find(r=>r.status==='fulfilled').value;
    const validations=await Promise.all([validateSale({db,actor,...prepared}),validateSale({db,actor,...prepared})]);
    assert.equal(validations.filter(r=>r.alreadyValidated===false).length,1);
    const claim=uid=>registerDigitalPass({db,identity:{uid,email:uid+'@example.test',email_verified:true},assignment,
      code:prepared.code,givenName:'Test',familyName:'Holder',noticeVersion:'emulator-notice',hmacSecret,validFrom:0,validUntil:Date.now()+60000});
    const claims=await Promise.allSettled([claim('holder-a'),claim('holder-b')]);
    assert.equal(claims.filter(r=>r.status==='fulfilled').length,1);
    assert.equal((await db.collection('passActivationChallenges').doc(physicalPassId).get()).data().status,'CONSUMED');
    const credentials=await db.collection('digitalCredentials').where('physicalPassId','==',physicalPassId).get();
    assert.equal(credentials.size,1);
  } finally { await deleteApp(app); }
});

test('Firestore rules deny all direct browser access to private pass collections, including DNS admins', { skip: !emulator }, async()=>{
  const { readFileSync } = await import('node:fs');
  const { initializeTestEnvironment, assertFails } = await import('@firebase/rules-unit-testing');
  const { doc, collection, getDoc, getDocs, setDoc } = await import('firebase/firestore');
  const environment = await initializeTestEnvironment({projectId:'demo-dns-core',firestore:{rules:readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}});
  try {
    await environment.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),'users','browser-admin'),{active:true,globalRoles:['dns-admin']});});
    const collections=['passActivationChallenges','passRegistrations','passHolders','digitalCredentials','passCredentialPayloads','passAuditEvents','passInventorySnapshots','passRateLimits','consentEvents'];
    const clients=[environment.unauthenticatedContext(),environment.authenticatedContext('holder'),environment.authenticatedContext('browser-admin')];
    for(const context of clients) for(const name of collections) {
      const client=context.firestore(); await assertFails(getDoc(doc(client,name,'private')));
      await assertFails(getDocs(collection(client,name))); await assertFails(setDoc(doc(client,name,'forged'),{status:'ACTIVE'}));
    }
  } finally { await environment.cleanup(); }
});

test('Firestore emulator end-to-end: ownership, one-time code and public QR revocation', { skip: !emulator }, async()=>{
  const { initializeApp, deleteApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const app=initializeApp({projectId:'demo-dns-core'},'digital-pass-e2e');
  const db=getFirestore(app);
  try {
    const physicalPassId='e2e-'+Date.now();
    const assignment={physicalPassId,organizationId:'tv-toblach',seasonId:'2026-27',
      productCode:'sk-dns',printedNumber:'000124',sourceRevision:'test-revision',eligibleForDnsSeasonPilot:true};
    const seller={uid:'seller',grants:[{organizationId:'tv-toblach',permissions:['passActivation.issue','passSale.attest','passValidation.check']}]};
    const admin={uid:'dns-admin',isDnsAdmin:true};
    const key='emulator-only-secret-never-use-this-in-production';
    const now=Date.now();
    const args={db,actor:seller,passNumber:'124',seasonId:'2026-27',productCode:'sk-dns',
      resolveAssignment:async()=>assignment,hmacSecret:key,now};
    const prepared=await prepareActivation(args);
    await validateSale({db,actor:seller,...prepared,now:now+1});
    const alice={uid:'emulator-alice',email:'alice@example.test',email_verified:true};
    const bob={uid:'emulator-bob',email:'bob@example.test',email_verified:true};
    const claim=identity=>registerDigitalPass({db,identity,assignment,code:prepared.code,
      givenName:'Demo',familyName:'User',noticeVersion:'test-only-v1',hmacSecret:key,
      validFrom:now-1000,validUntil:now+60000,now:now+2});
    const first=await claim(alice);
    assert.equal(first.alreadyRegistered,false);
    assert.equal((await claim(alice)).alreadyRegistered,true);
    await assert.rejects(claim(bob),/INVALID_OR_EXPIRED_ACTIVATION/);
    const pass=await getDigitalPass({db,identity:alice,physicalPassId});
    await assert.rejects(getDigitalPass({db,identity:bob,physicalPassId}),/NOT_FOUND/);
    await assert.rejects(getDigitalPass({db,identity:{...alice,email_verified:false},physicalPassId}),/UNAUTHORIZED/);
    const token=pass.qrPayload.slice('dns-pass:v1:'.length);
    assert.equal((await verifyPublicPass({db,token,now:now+3})),'VALID');
    await assert.rejects(checkDigitalCredential({db,actor:{uid:'unprivileged'},qrPayload:pass.qrPayload}),/FORBIDDEN/);
    const cred=(await db.collection('passRegistrations').doc(physicalPassId).get()).data().credentialId;
    await assert.rejects(revokeDigitalCredential({db,actor:seller,credentialId:cred,reason:'test',now:now+4}),/FORBIDDEN/);
    await revokeDigitalCredential({db,actor:admin,credentialId:cred,reason:'E2E emulator revocation',now:now+5});
    assert.equal((await verifyPublicPass({db,token,now:now+6})),'REVOKED');
    assert.equal((await checkDigitalCredential({db,actor:seller,qrPayload:pass.qrPayload,now:now+6})).status,'REVOKED');
  } finally { await deleteApp(app); }
});
