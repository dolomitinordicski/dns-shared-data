import { before, after, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { VIRTUAL_AREA as A, VIRTUAL_IDENTITIES as U, virtualPolicy } from './fixtures/virtual-dns-area.mjs';
let env;
const orgs = [A.organizationId, A.secondaryOrganizationId, A.foreignOrganizationId];
const entry = (org, uid) => ({
  id: `2026-27__${A.reportingAreaId}__${org}__12345678-1234-1234-1234-123456789abc`,
  seasonId: '2026-27', reportingAreaId: A.reportingAreaId, organizationId: org,
  trackName: 'Synthetic test trail', totalKm: 5, earlyDecember: 'unreported', earlyDecemberKm: null,
  lateDecember: 'partial', lateDecemberKm: 2, closedAt: '', notes: '',
  revision: 1, provenance: { sourceSystem: 'manual-data-entry', methodVersion: 1, dataStatus: 'draft' },
  updatedBy: uid, updatedAt: serverTimestamp(),
});
before(async () => {
  if (process.env.GCLOUD_PROJECT !== 'demo-dns-identity' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8188')
    throw new Error('Dedicated loopback emulator required');
  env = await initializeTestEnvironment({projectId: 'demo-dns-identity',
    firestore: {host: '127.0.0.1', port: 8188, rules: readFileSync('firestore.rules','utf8')}});
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async c => {
    const db = c.firestore(); const put = (p,d) => setDoc(doc(db,p),d);
    for (const uid of [U.writer,U.reader,U.outsider,U.admin])
      await put(`users/${uid}`, {active:true, globalRoles: uid===U.admin ? ['dns-admin']:[]});
    await put('seasons/2026-27',{status:'active'});
    for (const [i,org] of orgs.entries()) {
      await put(`organizations/${org}`,{id:org,reportingAreaIds:[A.reportingAreaId]});
      await put(`organizationToolAccess/${org}`,{...virtualPolicy(['write','read','none'][i]),organizationId:org});
      await put(`memberships/${U.writer}__${org}`,{active:true,userId:U.writer,organizationId:org});
      await put(`accessGrants/${U.writer}__organization__${org}`,{
        active:true,userId:U.writer,permissions:['kp.read','kp.write']});
    }
  });
});
after(async () => {if(env) await env.cleanup();});
test('W allows scoped create, read and archived update',async()=>{
  const db=env.authenticatedContext(U.writer).firestore(), val=entry(orgs[0],U.writer);
  const ref=doc(db,'trackQualityReports',val.id);
  await assertSucceeds(setDoc(ref,val));
  const prior=(await assertSucceeds(getDoc(ref))).data();
  const batch=writeBatch(db);
  batch.set(doc(db,'trackQualityReports',val.id,'revisions','1'),prior);
  batch.set(ref,{...val,revision:2,notes:'updated'});
  await assertSucceeds(batch.commit());
});
test('R and none cap W grants, admin can create, outsider and anonymous denied',async()=>{
  const writer=env.authenticatedContext(U.writer).firestore();
  const admin=env.authenticatedContext(U.admin).firestore();
  for(const [i,allowedRead] of [[1,true],[2,false]]){
    const val=entry(orgs[i],U.writer);
    await assertFails(setDoc(doc(writer,'trackQualityReports',val.id),val));
    await assertSucceeds(setDoc(doc(admin,'trackQualityReports',val.id),{...val,updatedBy:U.admin}));
    await (allowedRead?assertSucceeds:assertFails)(getDoc(doc(writer,'trackQualityReports',val.id)));
  }
  const ref=doc(writer,'trackQualityReports',entry(orgs[0],U.writer).id);
  await assertFails(getDoc(doc(env.authenticatedContext(U.outsider).firestore(),'trackQualityReports',ref.id)));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'trackQualityReports',ref.id)));
});
test('immutable scope and missing archived revision reject writes',async()=>{
  const db=env.authenticatedContext(U.writer).firestore(), val=entry(orgs[0],U.writer);
  const ref=doc(db,'trackQualityReports',val.id);
  await assertFails(setDoc(ref,{...val,organizationId:orgs[1]}));
  await assertFails(setDoc(ref,{...val,totalKm:-1}));
  await assertFails(setDoc(ref,{...val,revision:4}));
  await assertFails(setDoc(ref,{...val,unexpectedField:'x'}));
  await assertFails(setDoc(ref,{...val,revision:2,notes:'without archive'}));
});
