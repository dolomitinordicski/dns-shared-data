import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeTrailSegments as summarize } from '../dist/trail-status.js';
const unknown={openKm:null,totalKm:null,openPercent:null};
const a={id:'one',reportingAreaId:'area-a',lengthKm:10,open:true};

test('aggregates scoped segments and counts identical duplicates only once',()=>{
  const rows=[a,{...a},{id:'two',reportingAreaId:'area-a',lengthKm:5,open:false},
    {id:'three',reportingAreaId:'area-b',lengthKm:5,open:true}];
  assert.deepEqual(summarize(rows,'area-a'),{openKm:10,totalKm:15,openPercent:66.7});
  assert.deepEqual(summarize(rows,'dolomiti-nordicski'),{openKm:15,totalKm:20,openPercent:75});
});

test('rejects contradictory area assignments in both network and area summaries',()=>{
  const rows=[a,{...a,reportingAreaId:'area-b'}];
  for(const scope of ['area-a','area-b','dolomiti-nordicski']) assert.deepEqual(summarize(rows,scope),unknown);
  assert.deepEqual(summarize([a,{...a,lengthKm:11}],'area-a'),unknown);
  assert.deepEqual(summarize([a,{...a,open:false}],'area-a'),unknown);
});

test('missing, null or malformed opening states remain unknown',()=>{
  const {open,...missing}=a;
  for(const row of [missing,...[null,undefined,'false',0].map(value=>({...a,open:value}))]) {
    assert.deepEqual(summarize([row],'area-a'),unknown);
  }
  assert.deepEqual(summarize([{...a,open:false}],'area-a'),{openKm:0,totalKm:10,openPercent:0});
});

test('unknown data from another area does not turn valid scoped data into zero',()=>{
  const rows=[a,{id:'two',reportingAreaId:'area-b',lengthKm:5,open:null}];
  assert.deepEqual(summarize(rows,'area-a'),{openKm:10,totalKm:10,openPercent:100});
  assert.deepEqual(summarize(rows,'dolomiti-nordicski'),unknown);
});

test('empty selections, malformed identifiers/lengths and overflow remain unknown',()=>{
  assert.deepEqual(summarize([],'area-a'),unknown);
  assert.deepEqual(summarize([a],'area-b'),unknown);
  for(const extra of [{id:''},{id:' '},{reportingAreaId:''},{lengthKm:-1},{lengthKm:NaN},{lengthKm:Infinity}]) {
    assert.deepEqual(summarize([{...a,...extra}],'area-a'),unknown);
  }
  assert.deepEqual(summarize([{...a,lengthKm:Number.MAX_VALUE},{...a,id:'two',lengthKm:Number.MAX_VALUE}],'area-a'),unknown);
  assert.deepEqual(summarize([{...a,lengthKm:Number.MAX_VALUE}],'area-a'),unknown);
  assert.deepEqual(summarize([{...a,lengthKm:0}],'area-a'),{openKm:0,totalKm:0,openPercent:null});
});
