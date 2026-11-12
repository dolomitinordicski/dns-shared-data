import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import fs from 'node:fs';

const env=await initializeTestEnvironment({
  projectId:'demo-dns-core',
  firestore:{host:'127.0.0.1',port:8088,rules:fs.readFileSync('firestore.rules','utf8')},
});
try {
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    await setDoc(doc(db,'users','admin'),{active:true,globalRoles:['dns-admin']});
    await setDoc(doc(db,'users','hotelA'),{active:true,globalRoles:[]});
    await setDoc(doc(db,'users','hotelB'),{active:true,globalRoles:[]});
    await setDoc(doc(db,'users','inactive'),{active:false,globalRoles:[]});
    await setDoc(doc(db,'partnerHubMemberships','hotelA__stay-A'),{
      uid:'hotelA',establishmentId:'stay-A',active:true,status:'verified',
      schemaVersion:1,
    });
    await setDoc(doc(db,'partnerHubMemberships','hotelB__stay-B'),{
      uid:'hotelB',establishmentId:'stay-B',active:true,status:'verified',
      schemaVersion:1,
    });
  });
  const dbs=[
    env.unauthenticatedContext().firestore(),
    env.authenticatedContext('admin').firestore(),
    env.authenticatedContext('hotelA').firestore(),
    env.authenticatedContext('hotelB').firestore(),
    env.authenticatedContext('inactive').firestore(),
  ];
  for (const db of dbs) {
    for(const name of ['hotelA__stay-A','hotelB__stay-B']){
      const ref=doc(db,'partnerHubMemberships',name);
      await assertFails(getDoc(ref));
      await assertFails(updateDoc(ref,{active:false}));
      await assertFails(deleteDoc(ref));
    }
    await assertFails(setDoc(doc(db,'partnerHubMemberships','new-member'),{
      uid:'hotelA',establishmentId:'stay-C',active:true,status:'verified',
    }));
    await assertFails(getDocs(collection(db,'partnerHubMemberships')));
    await assertFails(getDocs(query(collection(db,'partnerHubMemberships'),where('uid','==','hotelA'))));
  }
  console.log('Partner Hub membership rules: all anonymous, partner, inactive and DNS Admin client operations denied.');
} finally {
  await env.cleanup();
}
