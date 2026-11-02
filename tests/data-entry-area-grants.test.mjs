import {before,after,test} from 'node:test';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,serverTimestamp,writeBatch} from 'firebase/firestore';
let env;const area='dns-test-area',own='dns-test-organisation',foreign='dns-test-organisation-2',uid='dns-test-area-account';
before(async()=>{
  if(process.env.GCLOUD_PROJECT!=='demo-dns-identity'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8188')throw Error('Loopback demo required');
  env=await initializeTestEnvironment({projectId:'demo-dns-identity',firestore:{host:'127.0.0.1',port:8188,rules:readFileSync('firestore.rules','utf8')}});
  await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{
    const put=(p,d)=>setDoc(doc(c.firestore(),p),d);
    await put(`users/${uid}`,{active:true,globalRoles:[]});
    await put(`accessGrants/${uid}__reportingArea__${area}`,{active:true,permissions:['kp.read','kp.write','pricing.read','ticketSales.read']});
    await put(`memberships/${uid}__${own}`,{active:true,userId:uid,organizationId:own});
    await put('seasons/2026-27',{status:'active'});
    for(const m of [1,2,3]) await put(`kpMilestones/2026-27__m${m}`,{seasonId:'2026-27'});
    for(const org of [own,foreign]){
      await put(`organizations/${org}`,{reportingAreaIds:[area]});
      await put(`organizationToolAccess/${org}`,{organizationId:org,tools:{'data-entry':'write'}});
      await put(`ticketPricingConfigs/${org}`,{scopeType:'organization',scopeId:org,seasonId:'2026-27',unitPrice:10});
    }
    await put('users/dns-test-org-account',{active:true,globalRoles:[]});
    await put(`memberships/dns-test-org-account__${foreign}`,{active:true,userId:'dns-test-org-account',organizationId:foreign});
    await put(`accessGrants/dns-test-org-account__organization__${foreign}`,{active:true,permissions:['kp.read','kp.write']});
  });
});
after(async()=>{await env?.cleanup();});
test('same-area foreign organization remains denied without membership',async()=>{
  const db=env.authenticatedContext(uid).firestore();
  await assertFails(getDoc(doc(db,'ticketPricingConfigs',foreign)));
  await assertFails(getDoc(doc(db,'kpEntries',`2026-27__${foreign}`)));
});
test('own organization price is readable with existing Area Admin grant',async()=>{
  await assertSucceeds(getDoc(doc(env.authenticatedContext(uid).firestore(),'ticketPricingConfigs',own)));
});
test('own absent KP record is readable before the first transaction',async()=>{
  await assertSucceeds(getDoc(doc(env.authenticatedContext(uid).firestore(),'kpEntries',`2026-27__${own}`)));
});
test('W Area Admin KP create and archived correction with all three milestones fit rule budget',async()=>{
  const db=env.authenticatedContext(uid).firestore();const id=`2026-27__${own}`;
  const value={id,seasonId:'2026-27',entityType:'organization',entityId:own,reportingAreaId:area,
    referenceKm:{uniqueNetworkKm:5,potentialOperationalKm:5},
    milestones:[1,2,3].map(m=>({milestoneId:`2026-27__m${m}`,openedKm:3,naturalSnowKm:2,artificialSnowKm:1})),
    includeInKp:true,exclusionReason:'',notes:'synthetic',revision:1,
    provenance:{sourceSystem:'manual-data-entry',methodVersion:1,dataStatus:'draft'},updatedBy:uid,updatedAt:serverTimestamp()};
  const ref=doc(db,'kpEntries',id);await assertSucceeds(setDoc(ref,value));
  const previous=(await getDoc(ref)).data();const batch=writeBatch(db);
  batch.set(doc(ref,'revisions','1'),previous);batch.set(ref,{...value,revision:2,notes:'corrected'});
  await assertSucceeds(batch.commit());
});
test('none policy still denies own organization despite territorial grant',async()=>{
  await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'organizationToolAccess',own),{organizationId:own,tools:{'data-entry':'none'}}));
  const db=env.authenticatedContext(uid).firestore();
  await assertFails(getDoc(doc(db,'ticketPricingConfigs',own)));
  await assertFails(getDoc(doc(db,'kpEntries',`2026-27__${own}`)));
});
test('direct organization W grant also supports three milestones and archived corrections',async()=>{
  const db=env.authenticatedContext('dns-test-org-account').firestore();const id=`2026-27__${foreign}`;
  const value={id,seasonId:'2026-27',entityType:'organization',entityId:foreign,reportingAreaId:area,
    referenceKm:{uniqueNetworkKm:5,potentialOperationalKm:5},
    milestones:[1,2,3].map(m=>({milestoneId:`2026-27__m${m}`,openedKm:3,naturalSnowKm:2,artificialSnowKm:1})),
    includeInKp:true,exclusionReason:'',notes:'synthetic',revision:1,
    provenance:{sourceSystem:'manual-data-entry',methodVersion:1,dataStatus:'draft'},updatedBy:'dns-test-org-account',updatedAt:serverTimestamp()};
  const ref=doc(db,'kpEntries',id);await assertSucceeds(setDoc(ref,value));
  const previous=(await getDoc(ref)).data();const batch=writeBatch(db);
  batch.set(doc(ref,'revisions','1'),previous);batch.set(ref,{...value,revision:2,notes:'corrected'});
  await assertSucceeds(batch.commit());
});
