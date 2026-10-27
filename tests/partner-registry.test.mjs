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
