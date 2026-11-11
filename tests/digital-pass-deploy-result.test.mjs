import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanupOnlyDeployment} from '../scripts/deploy-digital-pass-pilot.mjs';
const name='projects/dns-core/locations/europe-west8/functions/digitalPassApi';
const before={name,updateTime:'2026-11-11T08:00:00Z',serviceConfig:{revision:'digitalpassapi-00001-old'}};
const after={name,state:'ACTIVE',environment:'GEN_2',updateTime:'2026-11-11T10:01:00Z',buildConfig:{entryPoint:'digitalPassApi',runtime:'nodejs22'},serviceConfig:{revision:'digitalpassapi-00002-new',serviceAccountEmail:'dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com'}};
const output="functions[digital-pass:digitalPassApi(europe-west8)] Successful update operation.\nError: Functions successfully deployed but could not set up cleanup policy in location europe-west8. Pass the --force option to automatically set up a cleanup policy or run 'firebase functions:artifacts:setpolicy' to manually set up a cleanup policy.";
const input={exitCode:1,output,before,after,startedAt:Date.parse('2026-11-11T10:00:00Z')};
test('known cleanup-only error requires a fresh live revision and keeps later infrastructure checks mandatory',()=>{
 assert.equal(cleanupOnlyDeployment(input),true);
 assert.equal(cleanupOnlyDeployment({...input,output:'\u001b[32m'+output+'\u001b[0m'}),true);
});
test('deploy failures, stale metadata, wrong target and unexpected errors are never converted to success',()=>{
 for(const change of [
  {exitCode:2},{output:output+'\nError: permission denied'},
  {output:output.replace('Successful update operation.','Upload complete.')},
  {after:{...after,state:'FAILED'}},
  {after:{...after,name:name+'Other'}},
  {after:{...after,environment:'GEN_1'}},
  {after:{...after,buildConfig:{entryPoint:'pollsBridgeApi',runtime:'nodejs22'}}},
  {after:{...after,serviceConfig:{...after.serviceConfig,revision:before.serviceConfig.revision}}},
  {after:{...after,serviceConfig:{...after.serviceConfig,serviceAccountEmail:'other@example.test'}}},
  {startedAt:Date.parse('2026-11-11T11:00:00Z')},
  {output:output.replace('europe-west8. Pass','us-central1. Pass')},
 ])assert.equal(cleanupOnlyDeployment({...input,...change}),false);
});
