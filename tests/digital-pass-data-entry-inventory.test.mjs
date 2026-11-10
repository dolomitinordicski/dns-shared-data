import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDataEntryInventory, loadDataEntryInventory, dataEntryNumberingStart } from '../server/digital-pass-data-entry-inventory.mjs';
import { createDigitalPassHandler } from '../server/digital-pass-http.mjs';
import { resolveSeasonPassAssignment } from '../server/digital-pass-inventory-resolver.mjs';
import { MemoryDb } from './helpers/digital-pass-memory-db.mjs';

function matrix() {
 const form={seasonId:'2026-27',category:'ticket',catalogItemIds:['season','week','area'],organizationIds:['org-b','org-a']};
 const items=[{id:'season',code:'sk-dns',category:'ticket',displayOrder:20},{id:'week',code:'wk-dns',category:'ticket',displayOrder:10},{id:'area',code:'sk-area',category:'ticket',displayOrder:30}];
 const organizations=[{id:'org-a',active:true},{id:'org-b',active:true}];
 const orders=form.organizationIds.map(organizationId=>({id:'2026-27__ticket__'+organizationId,seasonId:'2026-27',category:'ticket',organizationId,status:'draft'}));
 const lines=[['week','org-b',3],['week','org-a',2],['season','org-b',4],['season','org-a',2],['area','org-b',5],['area','org-a',null]].map(([item,org,quantity])=>({
  id:'2026-27__ticket__'+org+'__'+item,ticketOrderId:'2026-27__ticket__'+org,seasonId:'2026-27',organizationId:org,catalogItemId:item,quantity
 }));
 return {seasonId:'2026-27',startNumber:101,form,items,organizations,orders,lines};
}
function seed(data=matrix()) {
 const db=new MemoryDb();
 db.values.set('orderFormConfigs/2026-27-ticket',data.form);
 for(const [collection,rows] of [['orderCatalogItems',data.items],['organizations',data.organizations],['ticketOrders',data.orders],['ticketOrderLines',data.lines]])
  for(const {id,...row} of rows)db.values.set(collection+'/'+id,row);
 return db;
}
test('matches Data Entry item order then form organization order across all product offsets',()=>{
 const snapshot=buildDataEntryInventory(matrix());
 assert.deepEqual(snapshot.rows,[
  {itemCode:'wk-dns',organizationId:'org-b',from:101,to:103},
  {itemCode:'wk-dns',organizationId:'org-a',from:104,to:105},
  {itemCode:'sk-dns',organizationId:'org-b',from:106,to:109},
  {itemCode:'sk-dns',organizationId:'org-a',from:110,to:111},
  {itemCode:'sk-area',organizationId:'org-b',from:112,to:116},
 ]);
 assert.equal(resolveSeasonPassAssignment({snapshot,passNumber:'000110',seasonId:'2026-27',productCode:'sk-dns'}).organizationId,'org-a');
 assert.throws(()=>resolveSeasonPassAssignment({snapshot,passNumber:'101',seasonId:'2026-27',productCode:'sk-dns'}),/NOT_ELIGIBLE/);
 assert.throws(()=>resolveSeasonPassAssignment({snapshot,passNumber:'999',seasonId:'2026-27',productCode:'sk-dns'}),/PASS_NOT_IN_MATRIX/);
});
test('stable display-order ties preserve form order; no sorting organizations by label',()=>{
 const data=matrix();data.items[1].displayOrder=20;
 assert.equal(buildDataEntryInventory(data).rows[0].itemCode,'sk-dns');
});
test('revision ignores labels/prices/timestamps and changes when actual numbering changes',()=>{
 const data=matrix(), before=buildDataEntryInventory(data).revision;
 data.items[0].label={it:'Nuovo nome'};data.orders[0].updatedAt='changed';data.items[0].unitPrice=1;
 assert.equal(buildDataEntryInventory(data).revision,before);
 data.lines[0].quantity=4;assert.notEqual(buildDataEntryInventory(data).revision,before);
});
test('rejects malformed, foreign, cancelled, orphan or incomplete authoritative source records',()=>{
 const corrupt=[
  d=>d.form.organizationIds.push('org-a'),d=>d.form.catalogItemIds.push('missing'),
  d=>d.organizations.pop(),d=>d.organizations[0].active=false,
  d=>d.lines[0].quantity=-1,d=>d.lines[0].quantity=1.5,
  d=>d.lines[0].seasonId='2025-26',d=>d.lines[0].organizationId='org-a',
  d=>d.lines[0].catalogItemId='season',d=>d.lines[0].ticketOrderId='foreign',
  d=>d.orders[0].status='cancelled',d=>d.orders.shift(),
  d=>d.items[0].category='wristband',d=>d.form.category='wristband',
  d=>d.startNumber=Number.MAX_SAFE_INTEGER,d=>d.seasonId='2025-26',
  d=>d.items[0].code='sk-area',
 ];
 for(const change of corrupt){const d=matrix();change(d);assert.throws(()=>buildDataEntryInventory(d),/DATA_ENTRY_NUMBERING_UNAVAILABLE/);}
 for(const value of ['', '0','01','1.5','-1','1x'])assert.throws(()=>dataEntryNumberingStart(value));
 assert.equal(dataEntryNumberingStart('101'),101);
});
test('reads the complete persisted matrix in a transaction without inventory writes',async()=>{
 const data=matrix(),db=seed(data),keys=[...db.values.keys()];
 const loaded=await loadDataEntryInventory({db,startNumber:101});
 assert.deepEqual(loaded,buildDataEntryInventory(data));
 assert.deepEqual([...db.values.keys()],keys);
 db.values.delete('orderFormConfigs/2026-27-ticket');
 await assert.rejects(loadDataEntryInventory({db,startNumber:101}),/DATA_ENTRY_NUMBERING_UNAVAILABLE/);
});

async function request(handler,path,uid,body) {
 const req={method:'POST',path,body,is:()=>true,get:name=>name==='Origin'?'https://example.test':name==='Authorization'?'Bearer '+uid:undefined};
 const res={set(){return this},status(code){this.code=code;return this},json(data){this.data=data;return this}};
 await handler(req,res);return res;
}
async function fixture() {
 const db=seed();
 db.values.set('users/operator',{active:true,globalRoles:[]});
 db.values.set('memberships/operator',{userId:'operator',organizationId:'org-a',active:true});
 db.values.set('accessGrants/operator',{userId:'operator',scopeType:'organization',scopeId:'org-a',permissions:['passActivation.issue','passSale.attest'],active:true});
 const inventoryRevision=(await loadDataEntryInventory({db,startNumber:101})).revision;
 const options={db,auth:{verifyIdToken:async(uid,revoked)=>{assert.equal(revoked,true);return{uid,email:uid+'@example.test',email_verified:true}}},
 hmacSecret:'synthetic-data-entry-test-key-not-for-cloud',allowedOrigins:['https://example.test'],inventoryRevision,
 inventorySource:'data-entry',dataEntryStartNumber:101,validFrom:Date.now()-10000,validUntil:Date.now()+86400000,
 noticeVersion:'synthetic-privacy',registrationEnabled:true};
 return{db,options,handler:createDigitalPassHandler(options)};
}
test('HTTP uses Data Entry directly with organization permissions and optional registration',async()=>{
 const {db,handler}=await fixture();
 assert.equal((await request(handler,'/v1/pass-activations/prepare','operator',{passNumber:'106'})).code,403);
 const prepared=await request(handler,'/v1/pass-activations/prepare','operator',{passNumber:'110'});
 assert.equal(prepared.code,200);
 const body={passNumber:'110',code:prepared.data.code};
 const claim=await request(handler,'/v1/pass-activations/claim','holder',body);
 assert.equal(claim.code,200);assert.equal(claim.data.status,'SOLD_ATTESTED');
 const status=await request(handler,'/v1/pass-activations/status','operator',{physicalPassId:prepared.data.physicalPassId,preparationId:prepared.data.preparationId});
 assert.equal(status.data.status,'SOLD_ATTESTED');
 assert.equal([...db.values.keys()].filter(k=>k.startsWith('digitalCredentials/')).length,0);
 const result=await request(handler,'/v1/pass-registrations/complete','holder',{...body,givenName:'Synthetic',familyName:'Test',language:'it'});
 assert.equal(result.code,200);
 assert.equal([...db.values.keys()].filter(k=>k.startsWith('passInventorySnapshots/')).length,0);
 assert.equal([...db.values.keys()].filter(k=>k.startsWith('digitalCredentials/')).length,1);
});
test('changed quantities after prepare fail closed instead of assigning printed numbers again',async()=>{
 const {db,handler}=await fixture();
 const prepared=await request(handler,'/v1/pass-activations/prepare','operator',{passNumber:'110'});
 db.values.set('ticketOrderLines/2026-27__ticket__org-b__week',{...db.values.get('ticketOrderLines/2026-27__ticket__org-b__week'),quantity:4});
 assert.equal((await request(handler,'/v1/pass-activations/claim','holder',{passNumber:'110',code:prepared.data.code})).code,400);
 assert.equal(db.values.get('passActivationChallenges/'+prepared.data.physicalPassId).status,'PREPARED');
 assert.equal([...db.values.keys()].filter(k=>k.startsWith('passSaleAttestations/')).length,0);
});
test('wrong revision or missing Data Entry source never falls back to a copied snapshot',async()=>{
 const {db,options}=await fixture();
 db.values.set('passInventorySnapshots/'+options.inventoryRevision,{approved:true,revision:options.inventoryRevision});
 db.values.delete('orderFormConfigs/2026-27-ticket');
 assert.equal((await request(createDigitalPassHandler(options),'/v1/pass-activations/prepare','operator',{passNumber:'110'})).code,400);
 const other=await fixture();
 assert.equal((await request(createDigitalPassHandler({...other.options,inventoryRevision:'wrong'}),'/v1/pass-activations/prepare','operator',{passNumber:'110'})).code,400);
 assert.throws(()=>createDigitalPassHandler({...options,inventorySource:'typo'}));
 assert.throws(()=>createDigitalPassHandler({...options,dataEntryStartNumber:undefined}));
});
