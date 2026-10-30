/** Local materialization only. Never runs Firebase/gcloud/npm or seeds any data. */
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {resolve,dirname,join,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stagingSettings,stagingInventoryDigest} from '../server/digital-pass-staging.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [projectId,mode]=process.argv.slice(2);
if(mode&&mode!=='--emulator')throw Error('INVALID_PREPARATION_MODE');
const emulated=mode==='--emulator';
const inventory=JSON.parse(await readFile(join(root,'tools/digital-pass-staging/synthetic-inventory.json'),'utf8'));
const now=Date.now();
const settings={DNS_PASS_ENVIRONMENT:'staging',DNS_PASS_STAGING_PROJECT_ID:projectId,GCLOUD_PROJECT:projectId,DNS_PASS_STAGING_RUNTIME_SERVICE_ACCOUNT:`dns-digital-pass-runtime@${projectId}.iam.gserviceaccount.com`,DNS_PASS_REGION:'europe-west8',DNS_PASS_DATA_MODE:'synthetic',DNS_PASS_MARKETING_ENABLED:'false',DNS_PASS_ALLOWED_ORIGINS:`https://${projectId}.web.app`,DNS_PASS_VERIFICATION_BASE:`https://europe-west8-${projectId}.cloudfunctions.net/digitalPassApi`,DNS_PASS_INVENTORY_REVISION:inventory.revision,DNS_PASS_INVENTORY_SHA256:stagingInventoryDigest(inventory),DNS_PASS_PRIVACY_NOTICE_VERSION:'synthetic-staging-v1',DNS_PASS_VALID_FROM:new Date(now-60000).toISOString(),DNS_PASS_VALID_UNTIL:new Date(now+86400000).toISOString(),DNS_PASS_REGISTRATION_ENABLED:'false'};
if(emulated)Object.assign(settings,{FUNCTIONS_EMULATOR:'true',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8188',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9199',DNS_PASS_ALLOWED_ORIGINS:'http://127.0.0.1:5179',DNS_PASS_VERIFICATION_BASE:`http://127.0.0.1:5101/${projectId}/europe-west8/digitalPassApi`});
stagingSettings(settings);
const target=join(root,'.digital-pass-staging');await mkdir(target);await mkdir(join(target,'server'));
const seen=new Set();
async function copyModule(name){
 if(seen.has(name))return;seen.add(name);
 if(!/^digital-pass-[a-z-]+\.mjs$/.test(name)&&name!=='firebase-staging-entry.mjs')throw Error('UNEXPECTED_STAGING_MODULE');
 const source=join(root,'server',name),content=await readFile(source,'utf8');
 await writeFile(join(target,'server',name),content);
 for(const match of content.matchAll(/from ['"]\.\/([^'"]+)['"]/g))await copyModule(basename(match[1]));
}
await copyModule('firebase-staging-entry.mjs');
await cp(join(root,'tools/digital-pass-staging/package.json'),join(target,'server/package.json'));
await cp(join(root,'tools/digital-pass-staging/package-lock.json'),join(target,'server/package-lock.json'));
await writeFile(join(target,'server',emulated?'.env.example':`.env.${projectId}`),Object.entries(settings).filter(([k])=>!['GCLOUD_PROJECT','FUNCTIONS_EMULATOR','FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST'].includes(k)).map(([k,v])=>`${k}=${v}`).join('\n')+'\n');
await writeFile(join(target,'synthetic-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
await writeFile(join(target,'firebase.json'),JSON.stringify({functions:[{source:'server',codebase:'digital-pass-staging',ignore:['node_modules','*.log']}]},null,2)+'\n');
await writeFile(join(target,'.firebaserc'),JSON.stringify({projects:{default:projectId}},null,2)+'\n');
console.log(JSON.stringify({localOnly:true,cloudChanges:false,projectId,registrationEnabled:false,marketingEnabled:false,modules:[...seen].sort(),target}));
