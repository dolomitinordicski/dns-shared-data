import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, query, where } from 'firebase/firestore';
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
  assert.ok(true);
  console.log('Partner access boundary: scoped reads, deny-by-default and tenant isolation passed');
} finally {
  await env.cleanup();
}
