import assert from 'node:assert/strict';
import { normalizedPartnerName, suggestLegacyMatches, resolveLegacyMatch, atDate, validatePartnerRegistry, partnerRegistrySnapshot } from '../dist/partner-registry.js';

const e = (id, name, area) => ({
  establishmentId:id, organizationId:'org-'+id, type:'hotel', reportingAreaId:area,
  displayName:name, active:true, source:{system:'fixture',recordedAt:'2026-01-01',quality:'verified'},
  createdAt:'2026-01-01', updatedAt:'2026-01-01',
});
const hotels=[e('h1','Hotel  Alpenblick','area-a'),e('h2','Hotel Alpenblick','area-b')];
assert.equal(normalizedPartnerName('  HOTEL   Alpenblick  '),'hotel alpenblick');
assert.deepEqual(suggestLegacyMatches({sourceSystem:'form',sourceRowId:'1',name:'hotel alpenblick',reportingAreaId:'area-a'},hotels),['h1']);
assert.equal(resolveLegacyMatch({sourceSystem:'form',sourceRowId:'1',name:'x'},[]),null);
assert.equal(resolveLegacyMatch({sourceSystem:'form',sourceRowId:'1',name:'x'},[{sourceSystem:'form',sourceRowId:'1',establishmentId:'h1',reviewedBy:'admin',reviewedAt:'2026-01-01'}]),'h1');
assert.equal(atDate([{validFrom:'2025-01-01',validTo:'2026-01-01',value:1},{validFrom:'2026-01-01',value:2}],'2026-01-01')?.value,2);
assert.throws(()=>atDate([{validFrom:'2025-01-01'},{validFrom:'2026-01-01'}],'2026-02-01'),/Overlapping/);

const areas=[
  {revisionId:'a1',establishmentId:'h1',reportingAreaId:'area-a',validFrom:'2025-01-01',validTo:'2026-01-01'},
  {revisionId:'a2',establishmentId:'h1',reportingAreaId:'area-b',validFrom:'2026-01-01'},
  {revisionId:'a3',establishmentId:'h2',reportingAreaId:'area-b',validFrom:'2025-01-01'},
];
const capacities=[
  {revisionId:'c1',establishmentId:'h1',beds:40,rooms:20,units:null,validFrom:'2025-01-01',validTo:'2026-01-01',source:{system:'fixture',recordedAt:'2025-01-01',quality:'verified'}},
  {revisionId:'c2',establishmentId:'h1',beds:60,rooms:30,units:null,validFrom:'2026-01-01',source:{system:'fixture',recordedAt:'2026-01-01',quality:'verified'}},
];
const partnerships=[
  {partnershipId:'p1',establishmentId:'h1',status:'active',effectiveFrom:'2025-01-01',recordedAt:'2025-01-01',changedBy:'admin'},
  {partnershipId:'p2',establishmentId:'h2',status:'active',effectiveFrom:'2025-01-01',recordedAt:'2025-01-01',changedBy:'admin'},
];
assert.deepEqual(validatePartnerRegistry(hotels,capacities,areas),[]);
const past=partnerRegistrySnapshot(hotels,partnerships,areas,capacities,'area-a','2025-06-01');
assert.equal(past.activeEstablishments,1);
assert.equal(past.knownBeds,40);
const now=partnerRegistrySnapshot(hotels,partnerships,areas,capacities,'area-b','2026-06-01');
assert.equal(now.activeEstablishments,2);
assert.equal(now.knownBeds,60);
assert.equal(now.establishmentsWithUnknownBeds,1);
assert.equal(partnerRegistrySnapshot(hotels,partnerships,areas,capacities,'area-a','2026-06-01').activeEstablishments,0);
assert.ok(validatePartnerRegistry(hotels,[...capacities,{...capacities[1],revisionId:'duplicate',validFrom:'2025-07-01'}],areas).some(x=>x.code==='overlapping-capacity'));
assert.ok(validatePartnerRegistry(hotels,[{...capacities[0],beds:-2}],areas).some(x=>x.code==='invalid-capacity'));
console.log('Partner Registry assertions passed');

// Regression: compare actual instants, not date strings with different offsets.
const before='2026-01-01T00:30:00Z';
const future='2025-12-31T23:45:00-01:00'; // 00:45 UTC, after `before`.
assert.equal(atDate([{validFrom:future,value:1}],before),null);
assert.equal(atDate([{validFrom:'2026-01-01T01:00:00+01:00',value:1}],before)?.value,1);
assert.equal(atDate([{validFrom:'2025-01-01',validTo:'2026-01-01T01:00:00+01:00'}],'2026-01-01'),null);
assert.throws(()=>atDate([{validFrom:'2026-02-30'}],'2026-03-01'),/Invalid partner date/);
assert.throws(()=>atDate([{validFrom:'2026-01-02',validTo:'2026-01-01'}],'2026-01-01'),/Invalid partner date interval/);
const single=[hotels[0]];
const sameArea=[{...areas[0],validFrom:'2025-01-01',validTo:undefined}];
assert.equal(partnerRegistrySnapshot(single,[{...partnerships[0],effectiveFrom:future}],sameArea,capacities,'area-a',before).activeEstablishments,0);
assert.equal(partnerRegistrySnapshot(single,[partnerships[0]],sameArea,[{...capacities[0],validFrom:future,validTo:undefined}],'area-a',before).establishmentsWithUnknownBeds,1);
// Ranges that are adjacent in UTC must not be reported as overlapping.
const adjacent=[
  {...capacities[0],validFrom:'2025-01-01',validTo:'2026-01-01T01:00:00+01:00'},
  {...capacities[1],validFrom:'2026-01-01T00:00:00Z'},
];
assert.deepEqual(validatePartnerRegistry(single,adjacent,sameArea),[]);
assert.ok(validatePartnerRegistry(single,[adjacent[0],{...adjacent[1],validFrom:'2025-12-31T23:30:00Z'}],sameArea).some(i=>i.code==='overlapping-capacity'));

const legacyRow={sourceSystem:'form',sourceRowId:'1',name:'x'};
const reviewed={sourceSystem:'form',sourceRowId:'1',establishmentId:'h1',reviewedBy:'admin',reviewedAt:'2026-01-01'};
for (const field of ['establishmentId','reviewedBy','reviewedAt']) {
  assert.throws(()=>resolveLegacyMatch(legacyRow,[{...reviewed,[field]:' '}]),/Incomplete legacy review/);
}
assert.throws(()=>resolveLegacyMatch(legacyRow,[{...reviewed,reviewedAt:'2026-02-30'}]),/Invalid partner date/);
assert.throws(()=>resolveLegacyMatch(legacyRow,[reviewed,reviewed]),/Ambiguous legacy review/);
console.log('Partner Registry timezone and explicit-review regressions passed');
