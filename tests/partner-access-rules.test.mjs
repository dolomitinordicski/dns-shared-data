import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const env = await initializeTestEnvironment({
  projectId: 'demo-dns-core',
  firestore: { host: '127.0.0.1', port: 8088, rules: fs.readFileSync('firestore.rules', 'utf8') },
});
const read = (user, id) => getDoc(doc(env.authenticatedContext(user).firestore(), 'partnerEstablishments', id));
try {
  await env.withSecurityRulesDisabled(async ctx => {
    const db=ctx.firestore();
    for (const uid of ['hotelA','hotelB','regionalA','regionalB','dnsAdmin','disabled','noGrant']) {
      await setDoc(doc(db,'users',uid),{active:uid!=='disabled',globalRoles:uid==='dnsAdmin'?['dns-admin']:[]});
    }
    await setDoc(doc(db,'partnerEstablishments','a'),{establishmentId:'a',organizationId:'orgA',reportingAreaId:'areaA',displayName:'Hotel A'});
    await setDoc(doc(db,'partnerEstablishments','b'),{establishmentId:'b',organizationId:'orgB',reportingAreaId:'areaB',displayName:'Hotel B'});
    for (const [uid,scope,id,permissions] of [
      ['hotelA','organization','orgA',['partner.read']],
      ['hotelB','organization','orgB',['partner.read']],
      ['regionalA','reportingArea','areaA',['partner.read']],
      ['regionalB','reportingArea','areaB',['partner.read']],
      ['disabled','organization','orgA',['partner.read']],
    ]) await setDoc(doc(db,'accessGrants',uid+'__'+scope+'__'+id),{active:true,permissions});
    await setDoc(doc(db,'partnerVouchers','v1'),{establishmentId:'a',status:'issued'});
    await setDoc(doc(db,'partnerEvidence','e1'),{establishmentId:'a',url:'private'});
  });
  await assertSucceeds(read('hotelA','a'));
  await assertFails(read('hotelA','b'));
  await assertSucceeds(read('hotelB','b'));
  await assertFails(read('hotelB','a'));
  await assertSucceeds(read('regionalA','a'));
  await assertFails(read('regionalA','b'));
  await assertSucceeds(read('regionalB','b'));
  await assertFails(read('regionalB','a'));
  await assertSucceeds(read('dnsAdmin','a'));
  await assertSucceeds(read('dnsAdmin','b'));
  await assertFails(read('disabled','a'));
  await assertFails(read('noGrant','a'));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'partnerEstablishments','a')));
  await assertFails(setDoc(doc(env.authenticatedContext('hotelA').firestore(),'partnerEstablishments','new'),{organizationId:'orgA',reportingAreaId:'areaA'}));
  await assertFails(setDoc(doc(env.authenticatedContext('dnsAdmin').firestore(),'partnerEstablishments','new'),{organizationId:'orgA',reportingAreaId:'areaA'}));
  await assertFails(getDocs(collection(env.authenticatedContext('hotelA').firestore(),'partnerEstablishments')));
  await assertSucceeds(getDocs(query(collection(env.authenticatedContext('regionalA').firestore(),'partnerEstablishments'),where('reportingAreaId','==','areaA'))));
  await assertFails(getDoc(doc(env.authenticatedContext('dnsAdmin').firestore(),'partnerVouchers','v1')));
  await assertFails(getDoc(doc(env.authenticatedContext('dnsAdmin').firestore(),'partnerEvidence','e1')));
  // Organization and territory queries must work without permitting global scans.
  const scopedQuery=(uid,field,value)=>getDocs(query(
    collection(env.authenticatedContext(uid).firestore(),'partnerEstablishments'),where(field,'==',value)));
  assert.equal((await assertSucceeds(scopedQuery('hotelA','organizationId','orgA'))).size,1);
  await assertFails(scopedQuery('hotelA','organizationId','orgB'));
  await assertFails(scopedQuery('regionalA','reportingAreaId','areaB'));
  await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(),'partnerEstablishments')));

  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    for (const uid of ['networkReader','revoked','expired','future','malformed']) {
      await setDoc(doc(db,'users',uid),{active:true,globalRoles:[]});
      const bounds=uid==='expired' ? {validTo:'2000-01-01T00:00:00Z'}
        : uid==='future' ? {validFrom:'2100-01-01T00:00:00Z'}
        : uid==='malformed' ? {validFrom:'invalid'} : {};
      await setDoc(doc(db,'accessGrants',uid+'__network__dolomiti-nordicski'),{
        active:uid!=='revoked',permissions:['partner.read'],...bounds,
      });
    }
    for (const name of ['partnerCapacityRevisions','partnerAssessments','partnerAccreditations',
      'partnerEvidence','partnerEvents','partnerVouchers','partnerCommunications']) {
      await setDoc(doc(db,name,'private'),{establishmentId:'a'});
    }
  });
  assert.equal((await assertSucceeds(getDocs(collection(
    env.authenticatedContext('networkReader').firestore(),'partnerEstablishments')))).size,2);
  for (const uid of ['revoked','expired','future','malformed']) {
    await assertFails(read(uid,'a'));
    await assertFails(scopedQuery(uid,'organizationId','orgA'));
  }

  // Every mutation remains backend-only, including existing records and admins.
  for (const uid of ['hotelA','regionalA','networkReader','dnsAdmin']) {
    const db=env.authenticatedContext(uid).firestore();
    await assertFails(updateDoc(doc(db,'partnerEstablishments','a'),{displayName:'Changed'}));
    await assertFails(deleteDoc(doc(db,'partnerEstablishments','a')));
    for (const name of ['partnerCapacityRevisions','partnerAssessments','partnerAccreditations',
      'partnerEvidence','partnerEvents','partnerVouchers','partnerCommunications']) {
      await assertFails(getDoc(doc(db,name,'private')));
      await assertFails(getDocs(collection(db,name)));
      await assertFails(setDoc(doc(db,name,'new'),{establishmentId:'a'}));
      await assertFails(updateDoc(doc(db,name,'private'),{establishmentId:'b'}));
      await assertFails(deleteDoc(doc(db,name,'private')));
    }
  }
  const hotelDb=env.authenticatedContext('hotelA').firestore();
  await assertFails(updateDoc(doc(hotelDb,'users','hotelA'),{globalRoles:['dns-admin']}));
  await assertFails(setDoc(doc(hotelDb,'accessGrants','hotelA__network__dolomiti-nordicski'),{active:true,permissions:['partner.read']}));
  console.log('Partner access boundary: scoped reads, deny-by-default and tenant isolation passed');
} finally {
  await env.cleanup();
}
