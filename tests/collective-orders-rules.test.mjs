import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'node:fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-dns-core',
  firestore: { host: '127.0.0.1', port: 8088, rules: fs.readFileSync('firestore.rules', 'utf8') },
});
try {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'admin'), {active:true, globalRoles:['dns-admin']});
    await setDoc(doc(db, 'users', 'partner'), {active:true, globalRoles:[]});
    await setDoc(doc(db, 'users', 'inactive'), {active:false, globalRoles:['dns-admin']});
    await setDoc(doc(db, 'seasons', '2026-27'), {status:'active'});
    await setDoc(doc(db, 'organizations', 'partner-a'), {reportingAreaIds:['area']});
    await setDoc(doc(db, 'accessGrants', 'partner__organization__partner-a'),
      {active:true,permissions:['ticketOrders.read','ticketOrders.write']});
  });
  const admin=env.authenticatedContext('admin').firestore();
  const partner=env.authenticatedContext('partner').firestore();
  const inactive=env.authenticatedContext('inactive').firestore();
  const anonymous=env.unauthenticatedContext().firestore();
  const path='collectiveOrders/teamjacke-2026';
  const base={
    id:'teamjacke-2026', seasonId:'2026-27', title:'DNS Teamjacke',
    supplierId:'texmarket',status:'draft',sourceRevision:1,
    supplierDocumentIds:['OV26-0708','OV26-0712'],
    updatedBy:'admin', updatedAt:serverTimestamp(),
  };
  await assertFails(getDoc(doc(anonymous,path)));
  await assertFails(setDoc(doc(partner,path),{...base,updatedBy:'partner'}));
  await assertFails(setDoc(doc(inactive,path),base));
  await assertSucceeds(setDoc(doc(admin,path),base));
  await assertSucceeds(getDoc(doc(admin,path)));
  await assertFails(getDoc(doc(partner,path)));
  await assertFails(setDoc(doc(admin,'collectiveOrders','invalid'),{...base,id:'invalid',status:'confirmed'}));
  await assertFails(updateDoc(doc(admin,path),{title:'Changed',updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(admin,path),{status:'reviewed',sourceRevision:2,updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(admin,path),{status:'draft',sourceRevision:3,updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(admin,path),{status:'confirmed',sourceRevision:3,updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(admin,path),{status:'closed',sourceRevision:4,updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(admin,path),{title:'After close',sourceRevision:5,updatedAt:serverTimestamp()}));
  await assertFails(deleteDoc(doc(admin,path)));
  for (const db of [admin,partner]) {
    await assertFails(setDoc(doc(db,path+'/allocations/a'),{organizationId:'partner-a',quantity:2}));
    await assertFails(getDoc(doc(db,path+'/allocations/a')));
    await assertFails(setDoc(doc(db,path+'/supplierCosts/a'),{netAmountCents:991000}));
    await assertFails(getDoc(doc(db,path+'/supplierCosts/a')));
  }
  console.log('Collective order Firestore security tests passed');
} finally {
  await env.cleanup();
}
