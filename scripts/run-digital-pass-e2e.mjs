/** Local Auth + Functions + Firestore acceptance. Never deploys, authenticates to GCP or calls Brevo. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
import {stagingInventoryDigest} from '../server/digital-pass-staging.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const staging=process.env.DNS_PASS_E2E_STAGING==='true';
const project=staging?'demo-dns-pass-staging-c1':'demo-dns-core';
const sourceRoot=staging?join(root,'.digital-pass-staging'):root;
const inventory=staging?JSON.parse(await readFile(join(sourceRoot,'synthetic-inventory.json'),'utf8')):null;
if(staging){const config=JSON.parse(await readFile(join(root,'firebase.e2e.json'),'utf8'));config.firestore.rules=join(root,'firestore.rules');await writeFile(join(sourceRoot,'firebase.e2e.json'),JSON.stringify(config));}
const require=createRequire(join(root,'tools/digital-pass-e2e/package.json'));
if(!process.env.DNS_E2E_FIREBASE_CLI && require('firebase-tools/package.json').version!=='15.34.2')throw Error('Install the isolated tools: npm install --prefix tools/digital-pass-e2e --ignore-scripts');
const cli=process.env.DNS_E2E_FIREBASE_CLI || require.resolve('firebase-tools/lib/bin/firebase.js');
const output=resolve(process.env.DNS_PASS_E2E_OUTPUT_DIR || join(root,'.digital-pass-e2e/results'));
await mkdir(output,{recursive:true});
const envFile=join(sourceRoot,'server/.env.local'),secretFile=join(sourceRoot,'server/.secret.local');
for(const name of ['.env','.env.'+project,'.env.local','.secret.local']) {
 try {await readFile(join(sourceRoot,'server',name));throw Error('Refusing to overwrite/load existing server/'+name)}
 catch(error){if(error.code!=='ENOENT')throw error}
}
const syntheticSecret='DNS_PASS_HMAC_KEY=synthetic-only-HMAC-key-not-production-1234567890\n';
const config=enabled=>[
 'DNS_PASS_ALLOWED_ORIGINS=http://127.0.0.1:5179',
 'DNS_PASS_INVENTORY_REVISION='+(staging?inventory.revision:'synthetic-http-e2e'),
 'DNS_PASS_VALID_FROM='+(staging?new Date(Date.now()-60000).toISOString():'2020-01-01T00:00:00Z'),
 'DNS_PASS_VALID_UNTIL='+(staging?new Date(Date.now()+86400000).toISOString():'2030-01-01T00:00:00Z'),
 'DNS_PASS_PRIVACY_NOTICE_VERSION=synthetic-e2e-only-v1',
 ...(staging?['DNS_PASS_ENVIRONMENT=staging','DNS_PASS_STAGING_PROJECT_ID='+project,'DNS_PASS_STAGING_RUNTIME_SERVICE_ACCOUNT=dns-digital-pass-runtime@'+project+'.iam.gserviceaccount.com','DNS_PASS_DATA_MODE=synthetic','DNS_PASS_MARKETING_ENABLED=false','DNS_PASS_INVENTORY_SHA256='+stagingInventoryDigest(inventory),'DNS_PASS_STAGING_TEST_UNTIL='+new Date(Date.now()+3600000).toISOString()]:[]),
 'DNS_GOOGLE_WALLET_ISSUER_ID=synthetic-disabled-wallet',
 'DNS_PASS_VERIFICATION_BASE=http://127.0.0.1:5101/'+project+'/europe-west8/digitalPassApi',
 'DNS_PASS_REGISTRATION_ENABLED='+enabled,
 'DNS_PASS_REGION=europe-west8',
 ...(!staging?['DNS_POLLS_REGION=europe-west8','DNS_POLLS_ALLOWED_ORIGINS=http://127.0.0.1:5179','DNS_POLLS_BRIDGE_SERVICE_ACCOUNT=synthetic@demo-dns-core.iam.gserviceaccount.com']:[]),
].join('\n')+'\n';
let writtenEnv='',running;
const modes=process.env.DNS_PASS_E2E_ONLY_MODE?[process.env.DNS_PASS_E2E_ONLY_MODE]:['disabled','enabled'];
if(modes.some(x=>!['disabled','enabled'].includes(x)))throw Error('INVALID_LOCAL_MODE');
try {
 await writeFile(secretFile,syntheticSecret,{flag:'wx'});
 for(const mode of modes){
  writtenEnv=config(mode==='enabled');await writeFile(envFile,writtenEnv);
  const env={...process.env,CI:'true',FIREBASE_CLI_DISABLE_UPDATE_CHECK:'true',
   XDG_CONFIG_HOME:join(root,'.digital-pass-e2e/config'),
   FIREBASE_FUNCTIONS_DISCOVERY_OUTPUT_PATH:'true',FUNCTIONS_DISCOVERY_TIMEOUT:'120',
   DNS_PASS_E2E_MODE:mode,DNS_PASS_E2E_OUTPUT_DIR:output,
   GCLOUD_PROJECT:project,GOOGLE_CLOUD_PROJECT:project};
  for(const key of ['GOOGLE_APPLICATION_CREDENTIALS','GOOGLE_GHA_CREDS_PATH','CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE','FIREBASE_TOKEN','BREVO_API_KEY'])delete env[key];
  const command='"'+process.execPath+'" --test "'+join(root,'tests/digital-pass-http-emulator.test.mjs')+'"';
  console.log('Starting local-only acceptance phase:',mode);
  running=spawn(process.execPath,[cli,'emulators:exec','--project',project,'--config','firebase.e2e.json','--only','auth,firestore,functions','--non-interactive',command],{cwd:sourceRoot,env,stdio:'inherit',windowsHide:true});
  const code=await new Promise((ok,fail)=>{running.once('exit',ok);running.once('error',fail)});
  running=null;if(code!==0)throw Error('Local E2E phase failed: '+mode+' (exit '+code+')');
 }
 console.log('Local acceptance completed. Evidence:',output);
} finally {
 running?.kill();
 // Remove only the overrides this invocation created and only if unchanged.
 for(const [path,value] of [[envFile,writtenEnv],[secretFile,syntheticSecret]]) {
  try {if(await readFile(path,'utf8')===value)await unlink(path)}catch(error){if(error.code!=='ENOENT')throw error}
 }
}
