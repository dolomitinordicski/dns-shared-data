import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore';
import fs from 'node:fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-dns-core',
  firestore: { host: '127.0.0.1', port: 8088, rules: fs.readFileSync('firestore.rules','utf8') },
});
try {
  await env.withSecurityRulesDisabled(async ctx => {
    const db=ctx.firestore();
    await setDoc(doc(db,'users','admin'),{active:true,globalRoles:['dns-admin']});
    await setDoc(doc(db,'users','area'),{active:true,globalRoles:[]});
    await setDoc(doc(db,'users','inactive'),{active:false,globalRoles:['dns-admin']});
    await setDoc(doc(db,'analyticsAuditSnapshots','2025-26'),{schemaVersion:1,seasonId:'2025-26',rawSales:[{organizationId:'private-area',amount:999}]});
    await setDoc(doc(db,'analyticsPublicSnapshots','2025-26'),{id:'2025-26',seasonId:'2025-26',publicationStatus:'published',baseline:{regionRevenue:[999]}});
    await setDoc(doc(db,'analyticsPartnerPublic','2025-26'),{id:'2025-26',seasonId:'2025-26',publicationStatus:'published',schemaVersion:1,totalTickets:123,totalRevenue:456});
    await setDoc(doc(db,'analyticsPartnerPublic','2024-25'),{id:'2024-25',seasonId:'2024-25',publicationStatus:'draft',schemaVersion:1,totalTickets:123,totalRevenue:456});
    await setDoc(doc(db,'analyticsPartnerPublic','2023-24'),{id:'2023-24',seasonId:'2023-24',publicationStatus:'published',schemaVersion:1,totalTickets:123,totalRevenue:456,privateRaw:{rows:[42]}});
  });
  const admin=env.authenticatedContext('admin').firestore();
  const area=env.authenticatedContext('area').firestore();
  const inactive=env.authenticatedContext('inactive').firestore();
  const anonymous=env.unauthenticatedContext().firestore();
  for(const collectionName of ['analyticsAuditSnapshots','analyticsPublicSnapshots']) {
    const documentId='2025-26';
    await assertSucceeds(getDoc(doc(admin,collectionName,documentId)));
    for(const db of [area,inactive,anonymous]) {
      await assertFails(getDoc(doc(db,collectionName,documentId)));
      await assertFails(getDocs(collection(db,collectionName)));
    }
    await assertFails(updateDoc(doc(admin,collectionName,documentId),{mutated:true}));
  }
  for(const db of [anonymous,area,admin]) {
    await assertSucceeds(getDoc(doc(db,'analyticsPartnerPublic','2025-26')));
    await assertFails(getDoc(doc(db,'analyticsPartnerPublic','2024-25')));
    await assertFails(getDoc(doc(db,'analyticsPartnerPublic','2023-24')));
    await assertFails(getDocs(collection(db,'analyticsPartnerPublic')));
    await assertFails(updateDoc(doc(db,'analyticsPartnerPublic','2025-26'),{totalRevenue:1}));
  }
  console.log('Analytics audit, baseline and partner publication rules passed');
} finally {
  await env.cleanup();
}
