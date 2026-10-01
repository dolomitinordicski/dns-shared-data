import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({credential:applicationDefault(),projectId:'dns-core'});
const db=getFirestore();
const markerRef=db.doc('historicalSeasonImports/2025-26');
const marker=await markerRef.get();
if(!marker.exists || !marker.data().importHash) throw new Error('Verified historical import marker not found.');
if(marker.data().sourceArchivesRemoved===true){
 const remaining=await db.collection('historicalSeasonSources').where('seasonId','==','2025-26').get();
 if(!remaining.empty)throw new Error('Archive-removal marker exists but source documents remain.');
 console.log('Source archive was already removed and verified.');
 process.exit(0);
}
if(marker.data().sourceSheetCount!==18)throw new Error('Expected 18 imported source sheets. No documents were removed.');
const archives=await db.collection('historicalSeasonSources').where('seasonId','==','2025-26').get();
if(archives.size!==18)throw new Error(`Expected 18 source sheets; found ${archives.size}. No documents were removed.`);
const batch=db.batch();archives.docs.forEach(document=>batch.delete(document.ref));
batch.update(markerRef,{sourceSheetCount:0,sourceArchivesRemoved:true});
await batch.commit();
const remaining=await db.collection('historicalSeasonSources').where('seasonId','==','2025-26').get();
if(!remaining.empty)throw new Error(`Source archive removal verification failed: ${remaining.size} documents remain.`);
console.log('Removed and verified 18 duplicated source sheets. Historical regional and partner records are unchanged.');
