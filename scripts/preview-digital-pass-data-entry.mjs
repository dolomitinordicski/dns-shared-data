/** Read-only configuration preview. No writes, import or approval action. */
import { createRequire } from 'node:module';
import { loadDataEntryInventory, dataEntryNumberingStart } from '../server/digital-pass-data-entry-inventory.mjs';
const args=process.argv.slice(2);
if(args.length===1 && args[0]==='--help'){
 console.log('Usage: node scripts/preview-digital-pass-data-entry.mjs --project dns-core --start-number NUMBER');
 console.log('Reads persisted Data Entry numbering using ADC. Prints revision/counts only. Never writes.');
}else{
 if(args.length!==4 || args[0]!=='--project' || args[2]!=='--start-number'
     || !['dns-core','demo-dns-core'].includes(args[1]))throw Error('EXPLICIT_PROJECT_AND_PRINTED_START_REQUIRED');
 const startNumber=dataEntryNumberingStart(args[3]),projectId=args[1];
 const require=createRequire(new URL('../server/package.json',import.meta.url));
 const {initializeApp,deleteApp}=require('firebase-admin/app');
 const {getFirestore}=require('firebase-admin/firestore');
 const app=initializeApp({projectId},'data-entry-numbering-read-only');
 try{
  const result=await loadDataEntryInventory({db:getFirestore(app),startNumber});
  console.log(JSON.stringify({readOnly:true,cloudWrites:0,projectId,seasonId:result.seasonId,startNumber,
   inventorySource:'data-entry',inventoryRevision:result.revision,rowCount:result.rows.length,
   totalQuantity:result.rows.reduce((n,r)=>n+r.to-r.from+1,0),
   dnsSeasonalQuantity:result.rows.filter(r=>r.itemCode==='sk-dns').reduce((n,r)=>n+r.to-r.from+1,0)},null,2));
 }finally{await deleteApp(app)}
}
