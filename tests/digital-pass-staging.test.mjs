import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stagingSettings,stagingInventoryDigest,assertStagingInventory,createStagingPassHandler} from '../server/digital-pass-staging.mjs';
const inventory=JSON.parse(readFileSync(new URL('../tools/digital-pass-staging/synthetic-inventory.json',import.meta.url),'utf8'));
const now=Date.now(),project='dns-pass-staging-c1';
const base=()=>({DNS_PASS_ENVIRONMENT:'staging',DNS_PASS_STAGING_PROJECT_ID:project,GCLOUD_PROJECT:project,DNS_PASS_STAGING_RUNTIME_SERVICE_ACCOUNT:`dns-digital-pass-runtime@${project}.iam.gserviceaccount.com`,DNS_PASS_REGION:'europe-west8',DNS_PASS_DATA_MODE:'synthetic',DNS_PASS_MARKETING_ENABLED:'false',DNS_PASS_ALLOWED_ORIGINS:`https://${project}.web.app`,DNS_PASS_VERIFICATION_BASE:`https://europe-west8-${project}.cloudfunctions.net/digitalPassApi`,DNS_PASS_INVENTORY_REVISION:inventory.revision,DNS_PASS_INVENTORY_SHA256:stagingInventoryDigest(inventory),DNS_PASS_PRIVACY_NOTICE_VERSION:'synthetic-staging-v1',DNS_PASS_VALID_FROM:new Date(now-60000).toISOString(),DNS_PASS_VALID_UNTIL:new Date(now+86400000).toISOString()});
function response(){return {headers:{},set(k,v){this.headers[k]=v;return this},status(code){this.code=code;return this},json(body){this.body=body;return this}}}
test('staging defaults closed and accepts only its own explicit project identity',()=>{
 const s=stagingSettings(base(),now);assert.equal(s.registrationEnabled,false);assert.equal(s.projectId,project);
 for(const override of [
  {GCLOUD_PROJECT:'dns-core'},{DNS_PASS_STAGING_PROJECT_ID:'dns-core'},
  {GOOGLE_CLOUD_PROJECT:'dns-core'},{FIREBASE_CONFIG:JSON.stringify({projectId:'dns-core'})},
  {DNS_PASS_STAGING_RUNTIME_SERVICE_ACCOUNT:'dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com'},
  {GOOGLE_APPLICATION_CREDENTIALS:'production-key.json'},{BREVO_API_KEY:'synthetic-forbidden'},
  {DNS_PASS_MARKETING_ENABLED:'true'},{DNS_PASS_DATA_MODE:'real'},
  {DNS_PASS_INVENTORY_REVISION:'printed-2026-27-review-1'},
  {DNS_PASS_ALLOWED_ORIGINS:'https://dolomitinordicski.github.io'},
  {DNS_PASS_VERIFICATION_BASE:'https://europe-west8-dns-core.cloudfunctions.net/digitalPassApi'},
  {DNS_PASS_REGION:'us-central1'},{FIRESTORE_EMULATOR_HOST:'127.0.0.1:8188'},
 ])assert.throws(()=>stagingSettings({...base(),...override},now));
});
test('temporary staging registration needs a future window bounded to four hours',()=>{
 assert.throws(()=>stagingSettings({...base(),DNS_PASS_REGISTRATION_ENABLED:'true'},now));
 for(const delta of [-1,5*3600000])assert.throws(()=>stagingSettings({...base(),DNS_PASS_REGISTRATION_ENABLED:'true',DNS_PASS_STAGING_TEST_UNTIL:new Date(now+delta).toISOString()},now));
 assert.equal(stagingSettings({...base(),DNS_PASS_REGISTRATION_ENABLED:'true',DNS_PASS_STAGING_TEST_UNTIL:new Date(now+3600000).toISOString()},now).registrationEnabled,true);
});
test('synthetic inventory is pinned canonically; a changed or real snapshot fails',()=>{
 const settings=stagingSettings(base(),now);assertStagingInventory(inventory,settings);
 assert.equal(stagingInventoryDigest({...inventory,rows:inventory.rows.map(r=>Object.fromEntries(Object.entries(r).reverse()))}),settings.inventoryHash);
 for(const snapshot of [{...inventory,synthetic:false},{...inventory,approved:false},{...inventory,rows:[{...inventory.rows[0],to:999}]},{...inventory,revision:'printed-review'}])assert.throws(()=>assertStagingInventory(snapshot,settings));
});
test('invalid project and false registration never initialize SDK dependencies',async()=>{
 let calls=0;const dependencies=()=>{calls++;throw Error('SDK_MUST_NOT_BE_INITIALIZED')};
 const req={method:'POST',path:'/v1/pass-registrations/complete'};
 const invalid=response();await createStagingPassHandler({env:{...base(),GCLOUD_PROJECT:'dns-core'},createDependencies:dependencies})(req,invalid);assert.equal(invalid.code,503);assert.equal(invalid.body.error,'STAGING_UNAVAILABLE');
 const disabled=response();await createStagingPassHandler({env:base(),createDependencies:dependencies})(req,disabled);assert.equal(disabled.code,503);assert.equal(disabled.body.error,'REGISTRATION_DISABLED');assert.equal(calls,0);
});
test('staging refuses an unpinned inventory before Auth or pass changes',async()=>{
 let authCalls=0,reads=0;
 const db={collection(name){assert.equal(name,'passInventorySnapshots');return {doc(){return {async get(){reads++;return {exists:true,data:()=>({...inventory,synthetic:false})}}}}}}};
 const res=response();await createStagingPassHandler({env:base(),createDependencies:()=>({db,auth:{verifyIdToken(){authCalls++}},hmacSecret:'synthetic-only-hmac-key-1234567890123456'})})({method:'POST',path:'/v1/pass-validations/check'},res);
 assert.equal(res.code,503);assert.equal(authCalls,0);assert.equal(reads,1);
});
