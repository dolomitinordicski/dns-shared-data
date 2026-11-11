/** Single Firebase deploy, with a narrow recovery for the known post-deploy
 * Artifact Registry policy prompt. Never retries or changes shared policy.
 */
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const name='projects/dns-core/locations/europe-west8/functions/digitalPassApi';
const runtime='dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com';
const cleanupError="Error: Functions successfully deployed but could not set up cleanup policy in location europe-west8. Pass the --force option to automatically set up a cleanup policy or run 'firebase functions:artifacts:setpolicy' to manually set up a cleanup policy.";
export function cleanupOnlyDeployment({exitCode,output,before,after,startedAt}) {
 const plain=output.replace(/\u001b\[[0-9;]*m/g,'');
 const errors=plain.split(/\r?\n/).map(x=>x.trim()).filter(x=>x.startsWith('Error:'));
 return exitCode===1 && errors.length===1 && errors[0]===cleanupError &&
  /functions\[digital-pass:digitalPassApi\(europe-west8\)\]\s+Successful (?:create|update) operation\./.test(plain) &&
  before?.name===name && after?.name===name && after.state==='ACTIVE' && after.environment==='GEN_2' &&
  after.buildConfig?.entryPoint==='digitalPassApi' && after.buildConfig?.runtime==='nodejs22' &&
  after.serviceConfig?.serviceAccountEmail===runtime &&
  typeof before.serviceConfig?.revision==='string' && typeof after.serviceConfig?.revision==='string' &&
  before.serviceConfig.revision!==after.serviceConfig.revision &&
  Number.isFinite(startedAt) && Date.parse(after.updateTime)>=startedAt &&
  Date.parse(after.updateTime)>Date.parse(before.updateTime);
}
function metadata() {
 const r=spawnSync('gcloud',['functions','describe','digitalPassApi','--gen2','--region=europe-west8','--project=dns-core','--format=json'],{encoding:'utf8'});
 if(r.status!==0)throw Error('DIGITAL_PASS_DEPLOY_METADATA_UNAVAILABLE');
 return JSON.parse(r.stdout);
}
export function deployPilot() {
 const before=metadata(),startedAt=Date.now();
 const r=spawnSync(process.execPath,['tools/digital-pass-e2e/node_modules/firebase-tools/lib/bin/firebase.js','deploy','--config','.digital-pass-real-pilot/firebase.json','--only','functions:digital-pass:digitalPassApi','--project','dns-core','--non-interactive'],{encoding:'utf8',maxBuffer:8*1024*1024});
 const output=(r.stdout||'')+'\n'+(r.stderr||'');
 process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');
 if(r.status===0)return;
 if(r.status===1 && output.includes('Functions successfully deployed but could not set up cleanup policy')) {
  const after=metadata();
  if(cleanupOnlyDeployment({exitCode:r.status,output,before,after,startedAt})) {
   console.log('::warning::Firebase reported only the known post-deploy cleanup-policy error. A fresh ACTIVE Gen2 revision with the expected runtime and entry point was confirmed. Shared Artifact Registry policy was not changed. Mandatory infrastructure checks still follow.');
   return;
  }
 }
 throw Error('DIGITAL_PASS_DEPLOY_FAILED_NO_RETRY');
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))deployPilot();
