import { GoogleAuth } from 'google-auth-library';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash, privateDecrypt, createDecipheriv, constants } from 'node:crypto';

const apply = process.argv.includes('--apply');
const local = process.argv.find(arg => arg.startsWith('--file='))?.slice(7);
const directory = await mkdtemp(join(tmpdir(), 'dns-history-'));
try {
 let payloadPath=local;
 if (!payloadPath) {
  try {
   const encrypted=JSON.parse(await readFile('scripts/history/2025-26.encrypted.json','utf8'));
   const credentials=JSON.parse(await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS,'utf8'));
   const key=privateDecrypt({key:credentials.private_key,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(encrypted.wrappedKey,'base64'));
   const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(encrypted.iv,'base64'));
   decipher.setAuthTag(Buffer.from(encrypted.tag,'base64'));
   const plaintext=Buffer.concat([decipher.update(Buffer.from(encrypted.ciphertext,'base64')),decipher.final()]);
   if(createHash('sha256').update(plaintext).digest('hex')!==encrypted.payloadSha256)throw new Error('Encrypted source digest mismatch');
   payloadPath=join(directory,'history.json');await writeFile(payloadPath,plaintext);
  } catch(error) {if(error.code!=='ENOENT')throw error;}
 }

 if (!payloadPath) {
  const auth = new GoogleAuth({scopes:['https://www.googleapis.com/auth/drive.readonly']});
  const credentials=await auth.getCredentials();
  console.log(`Source access account: ${credentials.client_email}`);
  const token=await auth.getAccessToken();
  const sources=[
   ['1eZatiodoyhPIZQ4J8yjfjnbD9IcfT9B4','01-ALL-TICKETS-2025-26.xlsx'],
   ['1bCngo1Npa3wumsboHso7v8QX-2LS-NSH','02-KP-Artificial-vs.-natural-snow-2025-26.xlsm'],
   ['1s152tMRbpvcmGvC8LaW-m4DcLoJLAye-UCPMqqvqSNE','03-VERKAUFSTATISTIK-STATISTICHE-DI-VENDITA-2025-26.xlsx'],
  ];
  for (const [id,name] of sources) {
   const response=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`,{headers:{Authorization:`Bearer ${token}`}});
   if (!response.ok) throw new Error(`Cannot read source ${name}: HTTP ${response.status}. Share the original file with the source access account printed above; do not publish source data in Git.`);
   await writeFile(join(directory,name),Buffer.from(await response.arrayBuffer()));
  }
  payloadPath=join(directory,'history.json');
  execFileSync('python',['scripts/history/extract.py',directory,payloadPath],{stdio:'pipe'});
 }
 const bytes=await readFile(payloadPath);
 const payload=JSON.parse(bytes);
 const hash=createHash('sha256').update(bytes).digest('hex');
 if (payload.schemaVersion!==1 || payload.seasonId!=='2025-26') throw new Error('Invalid historical dataset');
 const entries=[...payload.records.map(data=>['historicalSeasonRecords',data.id,data]),
  ...payload.archives.map(data=>['historicalSeasonSources',data.id,data]),
  ['historicalSeasonImports','2025-26',{...payload.summary,importHash:hash,schemaVersion:1,recordCount:payload.records.length,sourceSheetCount:payload.archives.length}]];
 if (entries.length>=490 || entries.some(([,id,data])=>!id || Buffer.byteLength(JSON.stringify(data))>900000)) throw new Error('Dataset exceeds atomic import limits');
 console.log(`Validated ${payload.records.length} scoped records and ${payload.archives.length} source sheets. Mode: ${apply?'APPLY':'DRY RUN'}`);
 if (apply) {
  initializeApp({credential:applicationDefault(),projectId:'dns-core'});
  const db=getFirestore();
  await db.runTransaction(async transaction=>{
   const marker=db.doc('historicalSeasonImports/2025-26');
   const existing=await transaction.get(marker);
   if (existing.exists) {
    if (existing.data().importHash!==hash) throw new Error('Historical import already exists with different data. No overwrite allowed.');
    console.log('Identical import already exists; preserved.'); return;
   }
   const refs=entries.map(([collection,id])=>db.collection(collection).doc(id));
   const documents=await transaction.getAll(...refs);
   if (documents.some(document=>document.exists)) throw new Error('Existing historical documents found without marker. Import aborted.');
   entries.forEach(([, ,data],index)=>transaction.create(refs[index],data));
  });
  // Verify persisted payload, including every scoped fact and archived source cell.
  const documents=await db.getAll(...entries.map(([collection,id])=>db.collection(collection).doc(id)));
  function normalize(value) {return Array.isArray(value)?value.map(normalize):value && typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,normalize(value[key])])):value;}
  documents.forEach((document,index)=>{if(JSON.stringify(normalize(document.data()))!==JSON.stringify(normalize(entries[index][2])))throw new Error('Read-back verification failed');});
  console.log('Historical import persisted and all documents verified.');
 }
} finally {await rm(directory,{recursive:true,force:true});}
