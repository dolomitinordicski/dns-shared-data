import assert from 'node:assert/strict';
import test from 'node:test';
import { persistHistory2024_25 } from '../scripts/history/verify-2024-25.mjs';

function entries(hash='original-import', exportHash='original-xlsx') {
  return [
    ...Array.from({length:26},(_,i)=>['historicalSeasonRecords',`record-${i}`,{
      seasonId:'2024-25',readOnly:true,facts:[{quantity:i,amount:i*10}],provenance:{sourceSha256:'canonical-source'},
    }]),
    ...['reportDocx','reportPdf','sales'].map(key=>['historicalSeasonSources',`2024-25__${key}`,{
      sourceKey:key,sha256:`canonical-${key}`,driveReadSha256:key==='sales'?exportHash:`canonical-${key}`,
      contentFingerprint:key==='sales'?'verified-cells':null,readOnly:true,
    }]),
    ['historicalSeasonImports','2024-25',{
      importHash:hash,sourceCount:3,recordCount:26,schemaVersion:1,
      sourceHashes:{reportDocx:'canonical-reportDocx',reportPdf:'canonical-reportPdf',sales:'canonical-sales'},
      driveReadHashes:{reportDocx:'canonical-reportDocx',reportPdf:'canonical-reportPdf',sales:exportHash},
      salesWorkbookContentFingerprint:'verified-cells',reportedQuantity:100,
    }],
  ];
}

function fixture(initial=entries()) {
  const records=new Map(initial.map(([collection,id,data])=>[`${collection}/${id}`,structuredClone(data)]));
  records.set('seasons/2024-25',{status:'historical'});
  let writes=0;
  const snapshot=ref=>({exists:records.has(ref.path),data:()=>records.get(ref.path)});
  const doc=path=>({path,get:async()=>snapshot({path})});
  const db={doc,collection:name=>({doc:id=>doc(`${name}/${id}`)}),getAll:async(...refs)=>refs.map(snapshot),
    async runTransaction(callback) {
      const queued=[];
      const read=ref=>{
        if(queued.length)throw new Error('Reads must precede writes');
        return snapshot(ref);
      };
      const result=await callback({get:async ref=>read(ref),getAll:async(...refs)=>refs.map(read),
        create:(ref,data)=>queued.push([ref.path,structuredClone(data)])});
      for(const [path] of queued)if(records.has(path))throw new Error('Already exists');
      for(const [path,data] of queued){records.set(path,data);writes++;}
      return result;
    }};
  return {records,db,writes:()=>writes};
}

test('identical import verifies all records and writes nothing',async()=>{
  const f=fixture();const before=JSON.stringify([...f.records]);
  assert.equal((await persistHistory2024_25(f.db,entries(),'original-import')).exportChanged,false);
  assert.equal(f.writes(),0);assert.equal(JSON.stringify([...f.records]),before);
});

test('changed XLSX export bytes preserve original data and metadata without writes',async()=>{
  const f=fixture();const before=JSON.stringify([...f.records]);
  const rerun=entries('different-import','different-xlsx-bytes');
  assert.equal((await persistHistory2024_25(f.db,rerun,'different-import')).exportChanged,true);
  assert.equal(f.writes(),0);assert.equal(JSON.stringify([...f.records]),before);
});

test('real changes, missing records and non-sales diagnostics still abort without writes',async()=>{
  for(const mutate of [
    f=>{f.records.get('historicalSeasonRecords/record-0').facts[0].amount=999;},
    f=>{f.records.get('historicalSeasonRecords/record-25').provenance.sourceSha256='changed';},
    f=>{f.records.get('historicalSeasonSources/2024-25__sales').sha256='changed';},
    f=>{f.records.get('historicalSeasonSources/2024-25__sales').contentFingerprint='changed';},
    f=>{f.records.get('historicalSeasonSources/2024-25__reportPdf').driveReadSha256='changed';},
    f=>{f.records.get('historicalSeasonImports/2024-25').reportedQuantity=999;},
    f=>{f.records.get('historicalSeasonImports/2024-25').salesWorkbookContentFingerprint='changed';},
    f=>{f.records.get('historicalSeasonRecords/record-0').unexpected=true;},
    f=>{f.records.delete('historicalSeasonSources/2024-25__reportDocx');},
  ]){
    const f=fixture();mutate(f);const before=JSON.stringify([...f.records]);
    await assert.rejects(persistHistory2024_25(f.db,entries('new-import','new-export'),'new-import'),/No overwrite allowed/);
    assert.equal(f.writes(),0);assert.equal(JSON.stringify([...f.records]),before);
  }
});

test('same raw import hash does not hide tampered export metadata',async()=>{
  const f=fixture();f.records.get('historicalSeasonSources/2024-25__sales').driveReadSha256='tampered';
  await assert.rejects(persistHistory2024_25(f.db,entries(),'original-import'),/No overwrite allowed/);
  assert.equal(f.writes(),0);
});

test('partial history without marker and missing canonical season abort',async()=>{
  const f=fixture();f.records.delete('historicalSeasonImports/2024-25');
  await assert.rejects(persistHistory2024_25(f.db,entries(),'original-import'),/without an import marker/);
  assert.equal(f.writes(),0);
  const missing=fixture([]);missing.records.delete('seasons/2024-25');
  await assert.rejects(persistHistory2024_25(missing.db,entries(),'original-import'),/Canonical season/);
  assert.equal(missing.writes(),0);
});

test('first import creates once and rerun remains read-only',async()=>{
  const f=fixture([]);
  await persistHistory2024_25(f.db,entries(),'original-import');
  assert.equal(f.writes(),30);
  await persistHistory2024_25(f.db,entries(),'original-import');
  assert.equal(f.writes(),30);
});
