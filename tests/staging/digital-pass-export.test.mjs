import test from 'node:test';
import assert from 'node:assert/strict';
const staging=await import('../../.digital-pass-staging/server/firebase-staging-entry.mjs');
test('materialized SDK export contains one private v2 function, staging runtime param and only HMAC',()=>{
 assert.deepEqual(Object.keys(staging),['digitalPassApi']);
 const e=JSON.parse(JSON.stringify(staging.digitalPassApi.__endpoint));
 assert.equal(e.platform,'gcfv2');assert.deepEqual(e.region,['europe-west8']);
 assert.deepEqual(e.httpsTrigger.invoker,['private']);assert.equal(e.minInstances,0);assert.equal(e.maxInstances,1);
 assert.equal(e.timeoutSeconds,60);assert.equal(e.availableMemoryMb,256);assert.equal(e.cpu,1);
 assert.equal(e.serviceAccountEmail,'params.DNS_PASS_STAGING_RUNTIME_SERVICE_ACCOUNT');
 assert.deepEqual(e.secretEnvironmentVariables,[{key:'DNS_PASS_HMAC_KEY'}]);assert.equal(e.vpc,null);
});
