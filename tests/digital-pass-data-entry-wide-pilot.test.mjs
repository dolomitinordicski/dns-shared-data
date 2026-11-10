import test from 'node:test';
import assert from 'node:assert/strict';
import {controlledPilotSettings,assertControlledPilotAssignment,assertControlledPilotNumber,assertControlledPilotOperator,assertControlledPilotOpen} from '../server/digital-pass-controlled-pilot.mjs';
import {resolveSeasonPassAssignment} from '../server/digital-pass-inventory-resolver.mjs';
const now=Date.now();
const base={enabled:'true',scope:'approved-data-entry',organizationId:'dns-org',passNumber:'',operatorUid:'dns-operator',until:new Date(now+1800000).toISOString()};
const snapshot={approved:true,seasonId:'2026-27',revision:'synthetic-approved',rows:[{itemCode:'sk-dns',organizationId:'dns-org',from:23980,to:23982},{itemCode:'sk-dns',organizationId:'other-org',from:30000,to:30002}]};
test('approved Data Entry numbering accepts all in-scope DNS season numbers without sale lookup',()=>{
 const pilot=controlledPilotSettings(base,now);
 assert.equal(pilot.scope,'approved-data-entry');
 for(const n of ['023980','023981','023982']){
  assert.doesNotThrow(()=>assertControlledPilotNumber(pilot,n));
  const assignment=resolveSeasonPassAssignment({passNumber:n,seasonId:'2026-27',productCode:'sk-dns',snapshot});
  assert.doesNotThrow(()=>assertControlledPilotAssignment(pilot,assignment));
 }
 assert.throws(()=>resolveSeasonPassAssignment({passNumber:'023983',seasonId:'2026-27',productCode:'sk-dns',snapshot}),/PASS_NOT_IN_MATRIX/);
 const foreign=resolveSeasonPassAssignment({passNumber:'030000',seasonId:'2026-27',productCode:'sk-dns',snapshot});
 assert.throws(()=>assertControlledPilotAssignment(pilot,foreign),/FORBIDDEN/);
 assert.throws(()=>assertControlledPilotOperator(pilot,{uid:'wrong'}),/FORBIDDEN/);
 assert.throws(()=>assertControlledPilotOpen(pilot,now+1800000),/PILOT_WINDOW_CLOSED/);
});
test('wide scope must be explicit and cannot silently bypass single-card safety',()=>{
 for(const invalid of [{scope:'all'},{scope:'approved-data-entry',passNumber:'023981'},{scope:'single-card',passNumber:''}])
  assert.throws(()=>controlledPilotSettings({...base,...invalid},now),/PILOT_CONFIGURATION_REQUIRED/);
 const single=controlledPilotSettings({...base,scope:'single-card',passNumber:'023981'},now);
 assert.throws(()=>assertControlledPilotNumber(single,'023982'),/FORBIDDEN/);
});
