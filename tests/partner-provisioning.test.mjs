import assert from 'node:assert/strict';
import { createPartnerProvisioningService, contactLookupId } from '../scripts/partner-provisioning-service.mjs';

function fixture({email='hotel@example.com',verified=true,disabled=false,contacts,override={}}={}) {
  const records=new Map();
  const key=(coll,id)=>coll+'/'+id;
  const put=(coll,id,val)=>records.set(key(coll,id),val);
  put('partnerEstablishments','hotel-1',{organizationId:'org-1'});
  put('partnerActivationContacts',contactLookupId(email),{
    active:true,contacts:contacts??[{email,organizationId:'org-1',establishmentId:'hotel-1',active:true}],
  });
  for(const [path,val] of Object.entries(override))records.set(path,val);
  const db={
    collection(coll){return {doc(id){return {id,path:key(coll,id)}}}},
    async runTransaction(callback){
      const writes=[];
      const tx={
        async get(ref){const val=records.get(ref.path);return {exists:val!==undefined,data:()=>val}},
        create(ref,value){writes.push([ref.path,value])},
      };
      const result=await callback(tx);
      for(const [path,val] of writes){if(records.has(path))throw new Error('Already exists: '+path);records.set(path,val)}
      return result;
    },
  };
  const auth={async getUser(uid){return {uid,email,emailVerified:verified,disabled}}};
  return {records,service:createPartnerProvisioningService({db,auth,clock:()=>'2026-10-27T18:00:00Z'})};
}
const f=fixture();
const a=await f.service.activateVerifiedMember('uid-1');
assert.equal(a.activated,true);
assert.equal(a.establishmentId,'hotel-1');
assert.deepEqual(f.records.get('accessGrants/uid-1__organization__org-1').permissions,['partner.read']);
assert.equal(f.records.get('users/uid-1').globalRoles.length,0);
assert.equal((await f.service.activateVerifiedMember('uid-1')).alreadyProvisioned,true);
assert.equal(f.records.get('partnerActivationEvents/uid-1__org-1').type,'registered-email-activation');
assert.equal((await fixture({verified:false}).service.activateVerifiedMember('uid-2')).activated,false);
assert.equal((await fixture({disabled:true}).service.activateVerifiedMember('uid-2')).activated,false);
assert.equal((await fixture({contacts:[{email:'hotel@example.com',organizationId:'org-1',establishmentId:'hotel-1',active:true},{email:'hotel@example.com',organizationId:'org-2',establishmentId:'hotel-2',active:true}]}).service.activateVerifiedMember('uid-3')).activated,false);
assert.equal((await fixture({contacts:[{email:'attacker@example.com',organizationId:'org-1',establishmentId:'hotel-1',active:true}]}).service.activateVerifiedMember('uid-4')).activated,false);
assert.equal((await fixture({override:{'memberships/uid-5__org-1':{active:false,userId:'uid-5',organizationId:'org-1'}}}).service.activateVerifiedMember('uid-5')).activated,false);
console.log('Partner provisioning policy assertions passed');
