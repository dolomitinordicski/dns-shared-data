import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const mode=process.env.DNS_PASS_E2E_MODE;
const project='demo-dns-core';
const origin='http://127.0.0.1:5179';
const functionBase='http://127.0.0.1:5101/'+project+'/europe-west8/digitalPassApi';
const records=[];
const output=resolve(process.env.DNS_PASS_E2E_OUTPUT_DIR || '.digital-pass-e2e/results');
const save=async()=>{await mkdir(output,{recursive:true});await writeFile(resolve(output,'http-e2e-'+mode+'.json'),JSON.stringify({project,mode,realEmailsSent:0,productionAccess:false,scenarios:records},null,2));};
async function scenario(id,name,fn){
 try{const result=await fn();records.push({id,name,status:'PASS',evidence:result??{}});await save();return result}
 catch(error){records.push({id,name,status:'FAIL',error:error.message});await save();throw error}
}
async function call(path,token,body={}){
 const response=await fetch(functionBase+path,{method:'POST',headers:{'content-type':'application/json',Origin:origin,...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
 const content=await response.text();
 assert.match(response.headers.get('content-type')||'',/application\/json/,'Functions Emulator must return API JSON; HTTP '+response.status);
 return {status:response.status,body:JSON.parse(content)};
}

test('real HTTP journey through Auth, Functions and Firestore Emulators only',{skip:!mode,timeout:180000},async()=>{
 assert.ok(['enabled','disabled'].includes(mode));
 assert.equal(process.env.GCLOUD_PROJECT,project);
 assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):8188$/);
 assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):9199$/);
 // Any accidental provider or external Auth call from the test is rejected.
 const nativeFetch=globalThis.fetch;
 globalThis.fetch=(url,init)=>{
  const u=new URL(typeof url==='string'?url:url.url||url.toString());
  if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('NON_LOCAL_REQUEST_BLOCKED');
  return nativeFetch(url,init);
 };
 const apps=[];let adminApp;
 try {
  if(mode==='disabled'){
   await scenario('10','Disabled registration returns 503 without authentication',async()=>{
    const r=await call('/v1/pass-registrations/complete');assert.equal(r.status,503);assert.equal(r.body.error,'REGISTRATION_DISABLED');return {http:503,error:r.body.error};
   });return;
  }
  const {initializeApp,deleteApp}=await import('firebase-admin/app');
  const {getFirestore}=await import('firebase-admin/firestore');
  const {getAuth}=await import('firebase-admin/auth');
  const sdk=await import('firebase/app');const authSdk=await import('firebase/auth');
  adminApp=initializeApp({projectId:project},'synthetic-http-e2e-seeder');const db=getFirestore(adminApp);const adminAuth=getAuth(adminApp);
  const actors={};
  await scenario('01','Two holders use local email links; two operators and admin authenticate locally',async()=>{
   for(const name of ['holder-a','holder-b','operator-a','operator-b','test-admin']){
    const holder=name.startsWith('holder');const email=name+'@example.test';
    await adminAuth.createUser({uid:name,email,emailVerified:!holder,...(!holder?{password:'synthetic-only-password-12345'}:{})});
    const app=sdk.initializeApp({apiKey:'synthetic-emulator-key',projectId:project,authDomain:'localhost'},name);apps.push(app);
    const auth=authSdk.getAuth(app);authSdk.connectAuthEmulator(auth,'http://127.0.0.1:9199',{disableWarnings:true});
    if(holder){
     await authSdk.sendSignInLinkToEmail(auth,email,{url:origin+'/local-auth-return',handleCodeInApp:true});
     const result=await fetch('http://127.0.0.1:9199/emulator/v1/projects/'+project+'/oobCodes').then(r=>r.json());
     const entry=result.oobCodes.filter(x=>x.email===email).at(-1);assert.ok(entry?.oobLink,'Local email link is generated, never sent');
     await authSdk.signInWithEmailLink(auth,email,entry.oobLink);
    }else await authSdk.signInWithEmailAndPassword(auth,email,'synthetic-only-password-12345');
    const token=await auth.currentUser.getIdToken();const verified=await adminAuth.verifyIdToken(token,true);
    assert.equal(verified.uid,name);assert.equal(verified.email_verified,true);actors[name]={token,auth};
   }
   for(const [uid,org,permissions] of [
    ['operator-a','synthetic-org-a',['passActivation.issue','passSale.attest','passValidation.check']],
    ['operator-b','synthetic-org-b',['passActivation.issue','passSale.attest']],
   ]){
    await db.collection('users').doc(uid).set({active:true,globalRoles:[]});
    await db.collection('memberships').doc(uid+'-membership').set({userId:uid,organizationId:org,active:true});
    await db.collection('accessGrants').doc(uid+'-grant').set({userId:uid,scopeType:'organization',scopeId:org,permissions,active:true});
   }
   await db.collection('users').doc('test-admin').set({active:true,globalRoles:['dns-admin']});
   await db.collection('passInventorySnapshots').doc('synthetic-http-e2e').set({approved:true,revision:'synthetic-http-e2e',seasonId:'2026-27',rows:[
    {itemCode:'sk-dns',organizationId:'synthetic-org-a',from:1,to:20},
    {itemCode:'sk-dns',organizationId:'synthetic-org-b',from:21,to:30},
   ]});
   return {holders:2,operators:2,operatorOrganizations:2,additionalSyntheticRevocationAdmin:1,holderAuth:'Auth Emulator email-link',operatorAuth:'Auth Emulator password',verifiedEmulatorTokens:5};
  });
  const token=name=>actors[name].token;
  async function prepare(number,who='operator-a'){
   const r=await call('/v1/pass-activations/prepare',token(who),{passNumber:String(number)});assert.equal(r.status,200,JSON.stringify(r));assert.match(r.body.code,/^[A-HJ-NP-Z2-9]{6}$/);return r.body;
  }
  async function attest(prepared,who='operator-a'){
   const r=await call('/v1/pass-activations/validate',token(who),{physicalPassId:prepared.physicalPassId,preparationId:prepared.preparationId});assert.equal(r.status,200,JSON.stringify(r));return r;
  }
  const claim=(number,prepared,who='holder-a',extra={})=>call('/v1/pass-registrations/complete',token(who),{passNumber:String(number),code:prepared.code,givenName:'Synthetic',familyName:'Test',language:'it',...extra});
  let first,registration,pass;
  await scenario('02','Prepare monouse activation code and attest sale through HTTP',async()=>{
   const denied=await call('/v1/pass-activations/prepare',token('operator-b'),{passNumber:'1'});assert.equal(denied.status,403);
   first=await prepare(1);const stored=(await db.collection('passActivationChallenges').doc(first.physicalPassId).get()).data();
   assert.equal(stored.code,undefined);assert.match(stored.codeVerifier,/^[a-f0-9]{64}$/);
   const premature=await claim(1,first);assert.equal(premature.status,400);
   const wrong=await call('/v1/pass-activations/validate',token('operator-b'),first);assert.equal(wrong.status,403);
   await attest(first);return {prepareHttp:200,foreignOrganizationPrepare:403,foreignOrganizationValidate:403,claimBeforeAttestation:400,codeStoredAs:'HMAC verifier only'};
  });
  await scenario('03','Register through real Functions HTTP without marketing consent or Brevo config',async()=>{
   const r=await claim(1,first,'holder-a',{marketingRequested:true,affirmative:true,marketingNoticeVersion:'forged'});assert.equal(r.status,200,JSON.stringify(r));registration=r.body.registrationId;
   assert.equal((await db.collection('passMarketingConsents').get()).size,0);assert.equal((await db.collection('passMarketingOutbox').get()).size,0);
   const consent=await db.collection('consentEvents').where('holderId','==','holder-a').get();assert.equal(consent.docs[0].data().affirmative,false);
   return {http:200,marketingConsents:0,sendJobs:0,brevoKeyConfigured:false,forgedConsentIgnored:true};
  });
  await scenario('04','Recover holder pass, render and decode its QR image',async()=>{
   const list=await call('/v1/me/digital-passes',token('holder-a'));assert.equal(list.status,200);assert.ok(list.body.registrationIds.includes(registration));
   const r=await call('/v1/me/digital-pass',token('holder-a'),{physicalPassId:registration});assert.equal(r.status,200);pass=r.body;
   const denied=await call('/v1/me/digital-pass',token('holder-b'),{physicalPassId:registration});assert.equal(denied.status,400);
   const req=createRequire(process.env.DNS_E2E_DEPS_ROOT?resolve(process.env.DNS_E2E_DEPS_ROOT,'package.json'):new URL('../tools/digital-pass-e2e/package.json',import.meta.url));
   const QRCode=req('qrcode');
   const verificationUrl=functionBase+'/v/'+pass.qrPayload.slice('dns-pass:v1:'.length);
   const image=await QRCode.toBuffer(verificationUrl,{width:420,margin:4});await writeFile(resolve(output,'synthetic-qr.png'),image);
   const {decodeRenderedQr}=await import('./helpers/digital-pass-rendered-qr.mjs');
   const decoded=decodeRenderedQr(image);assert.equal(decoded,verificationUrl);
   const html=await fetch(decoded).then(r=>r.text());assert.match(html,/GÜLTIG · VALIDO · VALID/);assert.ok(!html.includes(pass.holderName));
   await writeFile(resolve(output,'synthetic-qr-preview.html'),'<!doctype html><meta charset="utf-8"><title>Synthetic Emulator QR</title><h1>DNS Digital Pass — solo dati sintetici</h1><p>QR generato dalla risposta HTTP dell’Emulator. Nessuna tessera reale.</p><img width="420" height="420" src="data:image/png;base64,'+image.toString('base64')+'"><p>Payload decodificato e verificato esclusivamente su localhost.</p>');
   return {recoveryHttp:200,otherHolderDenied:400,qrPng:'synthetic-qr.png',qrDecoded:true,publicVerification:'VALID',holderDataInPublicPage:false};
  });
  await scenario('05','Authorized operator validates; operator without validation permission is refused',async()=>{
   const allowed=await call('/v1/pass-validations/check',token('operator-a'),{qrPayload:pass.qrPayload});assert.equal(allowed.status,200);assert.equal(allowed.body.status,'VALID');
   const denied=await call('/v1/pass-validations/check',token('operator-b'),{qrPayload:pass.qrPayload});assert.equal(denied.status,403);
   const anonymous=await call('/v1/pass-validations/check',null,{qrPayload:pass.qrPayload});assert.equal(anonymous.status,401);
   return {authorized:{http:200,status:'VALID'},operatorWithoutGrant:403,anonymous:401};
  });
  await scenario('07','Retries, concurrent claims, expired codes and duplicate attempts',async()=>{
   const retry=await claim(1,first);assert.equal(retry.status,200);assert.equal(retry.body.alreadyRegistered,true);assert.equal(retry.body.registrationId,registration);
   const other=await claim(1,first,'holder-b');assert.equal(other.status,400);
   const duplicate=await call('/v1/pass-activations/prepare',token('operator-a'),{passNumber:'1'});assert.equal(duplicate.status,409);
   const wrong=await prepare(2);await attest(wrong);const wrongCode=await claim(2,{...wrong,code:wrong.code==='AAAAAA'?'BBBBBB':'AAAAAA'},'holder-b');assert.equal(wrongCode.status,400);
   const expired=await prepare(3);await attest(expired);await db.collection('passActivationChallenges').doc(expired.physicalPassId).update({expiresAt:Date.now()-1000});
   assert.equal((await claim(3,expired,'holder-b')).status,400);
   const raced=await prepare(4);await attest(raced);const attempts=await Promise.all([claim(4,raced),claim(4,raced,'holder-b')]);assert.equal(attempts.filter(x=>x.status===200).length,1);
   assert.equal((await db.collection('digitalCredentials').where('physicalPassId','==',raced.physicalPassId).get()).size,1);
   const repeated=await prepare(5);const attested=await Promise.all([attest(repeated),attest(repeated)]);assert.equal(attested.filter(x=>x.body.alreadyValidated===false).length,1);
   return {sameHolderRetry:200,otherHolderReplay:400,duplicatePrepare:409,wrongCode:400,expiredCode:400,concurrentClaimWinners:1,credentialsCreatedByRace:1,concurrentAttestations:1};
  });
  await scenario('08-09','Pass works without Brevo; marketing stays optional and disabled; no send jobs',async()=>{
   const r=await call('/v1/me/marketing/opt-in',token('holder-a'),{affirmative:true,language:'it'});assert.equal(r.status,503);assert.equal(r.body.error,'MARKETING_NOT_ENABLED');
   assert.equal((await db.collection('passMarketingOutbox').get()).size,0);
   const get=await call('/v1/me/digital-pass',token('holder-a'),{physicalPassId:registration});assert.equal(get.status,200);assert.equal(get.body.status,'ACTIVE');
   return {marketingHttp:503,marketingError:'MARKETING_NOT_ENABLED',passHttp:200,passStatus:'ACTIVE',sendJobs:0,implicitConsent:false,providerCalls:0};
  });
  await scenario('06','Admin revocation immediately invalidates the QR; regular operator cannot revoke',async()=>{
   const credential=(await db.collection('passRegistrations').doc(registration).get()).data().credentialId;
   const denied=await call('/v1/admin/pass-credentials/revoke',token('operator-a'),{credentialId:credential,reason:'Synthetic E2E'});assert.equal(denied.status,403);
   const revoked=await call('/v1/admin/pass-credentials/revoke',token('test-admin'),{credentialId:credential,reason:'Synthetic E2E'});assert.equal(revoked.status,200);
   const check=await call('/v1/pass-validations/check',token('operator-a'),{qrPayload:pass.qrPayload});assert.equal(check.body.status,'REVOKED');
   const html=await fetch(functionBase+'/v/'+pass.qrPayload.slice('dns-pass:v1:'.length)).then(r=>r.text());assert.match(html,/UNGÜLTIG · NON VALIDO · INVALID/);
   return {regularOperatorRevocation:403,adminRevocation:200,nextOperatorStatus:'REVOKED',nextPublicQrStatus:'INVALID'};
  });
  for(const app of apps)await sdk.deleteApp(app);apps.length=0;await deleteApp(adminApp);adminApp=null;
 } finally {
  globalThis.fetch=nativeFetch;
  if(apps.length){const sdk=await import('firebase/app');for(const app of apps)await sdk.deleteApp(app)}
  if(adminApp){const {deleteApp}=await import('firebase-admin/app');await deleteApp(adminApp)}
  await save();
 }
});
