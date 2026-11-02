import {before,after,test} from 'node:test';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc} from 'firebase/firestore';
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
    for(const org of [own,foreign]){
      await put(`organizations/${org}`,{reportingAreaIds:[area]});
      await put(`organizationToolAccess/${org}`,{organizationId:org,tools:{'data-entry':'write'}});
      await put(`ticketPricingConfigs/${org}`,{scopeType:'organization',scopeId:org,seasonId:'2026-27',unitPrice:10});
    }
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
test('none policy still denies own organization despite territorial grant',async()=>{
  await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'organizationToolAccess',own),{organizationId:own,tools:{'data-entry':'none'}}));
  const db=env.authenticatedContext(uid).firestore();
  await assertFails(getDoc(doc(db,'ticketPricingConfigs',own)));
  await assertFails(getDoc(doc(db,'kpEntries',`2026-27__${own}`)));
});
