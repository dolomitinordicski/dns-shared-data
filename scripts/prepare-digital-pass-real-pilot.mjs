/** Build a private, single-function release directory. No cloud calls or deploy. */
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {controlledPilotSettings} from '../server/digital-pass-controlled-pilot.mjs';
import {dataEntryNumberingStart} from '../server/digital-pass-data-entry-inventory.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const bad=(name='PILOT_RELEASE_CONFIGURATION_REQUIRED')=>{throw Error('PILOT_RELEASE_CONFIGURATION_REQUIRED: '+name)};
export function pilotReleaseConfig(env,now=Date.now()) {
 const phase=env.DNS_PASS_RELEASE_PHASE;
 if(!['verify','activate','stop'].includes(phase))bad('DNS_PASS_RELEASE_PHASE');
 if(env.DNS_PASS_DEPLOY_APPROVED!=='true')bad('DNS_PASS_DEPLOY_APPROVED');
 if(env.DNS_PASS_PRIVACY_REVIEWED!=='true')bad('DNS_PASS_PRIVACY_REVIEWED');
 for(const name of ['DNS_PASS_PILOT_ORGANIZATION_ID','DNS_PASS_PILOT_PASS_NUMBER','DNS_PASS_PILOT_OPERATOR_UID','DNS_PASS_PILOT_UNTIL','DNS_PASS_DATA_ENTRY_START_NUMBER','DNS_PASS_INVENTORY_REVISION','DNS_PASS_PRIVACY_NOTICE_VERSION','DNS_PASS_PRIVACY_URL']){
  if(typeof env[name]!=='string'||!env[name].trim())bad(name);
 }
 const pilot=controlledPilotSettings({enabled:'true',organizationId:env.DNS_PASS_PILOT_ORGANIZATION_ID,
  passNumber:env.DNS_PASS_PILOT_PASS_NUMBER,operatorUid:env.DNS_PASS_PILOT_OPERATOR_UID,until:env.DNS_PASS_PILOT_UNTIL},now);
 if(phase!=='stop' && pilot.until<=now+5*60000)bad('DNS_PASS_PILOT_UNTIL');
 try{dataEntryNumberingStart(env.DNS_PASS_DATA_ENTRY_START_NUMBER)}catch{bad('DNS_PASS_DATA_ENTRY_START_NUMBER')}
 if(!/^data-entry-2026-27-[a-f0-9]{64}$/.test(env.DNS_PASS_INVENTORY_REVISION||'') ||
    !/^dns-digital-pass-2026-27-[a-z0-9-]+$/.test(env.DNS_PASS_PRIVACY_NOTICE_VERSION||''))bad('DNS_PASS_INVENTORY_REVISION or DNS_PASS_PRIVACY_NOTICE_VERSION');
 let privacy;try{privacy=new URL(env.DNS_PASS_PRIVACY_URL)}catch{bad('DNS_PASS_PRIVACY_URL')}
 if(privacy.protocol!=='https:'||privacy.username||privacy.password||privacy.search||privacy.hash)bad('DNS_PASS_PRIVACY_URL');
 const enabled=phase==='activate'?'true':'false';
 return {
  DNS_PASS_REGION:'europe-west8',DNS_PASS_ALLOWED_ORIGINS:'https://dolomitinordicski.github.io',
  DNS_PASS_INVENTORY_SOURCE:'data-entry',DNS_PASS_DATA_ENTRY_START_NUMBER:env.DNS_PASS_DATA_ENTRY_START_NUMBER,
  DNS_PASS_INVENTORY_REVISION:env.DNS_PASS_INVENTORY_REVISION,
  DNS_PASS_VALID_FROM:'2026-11-15T00:00:00+01:00',DNS_PASS_VALID_UNTIL:'2027-05-01T00:00:00+02:00',
  DNS_PASS_PRIVACY_NOTICE_VERSION:env.DNS_PASS_PRIVACY_NOTICE_VERSION,
  DNS_PASS_PILOT_ENABLED:'true',DNS_PASS_PILOT_ORGANIZATION_ID:env.DNS_PASS_PILOT_ORGANIZATION_ID,
  DNS_PASS_PILOT_PASS_NUMBER:env.DNS_PASS_PILOT_PASS_NUMBER,DNS_PASS_PILOT_OPERATOR_UID:env.DNS_PASS_PILOT_OPERATOR_UID,
  DNS_PASS_PILOT_UNTIL:env.DNS_PASS_PILOT_UNTIL,
  DNS_PASS_SALE_CLAIM_ENABLED:enabled,DNS_PASS_REGISTRATION_ENABLED:enabled,
  DNS_GOOGLE_WALLET_ISSUER_ID:'',DNS_PASS_VERIFICATION_BASE:'https://europe-west8-dns-core.cloudfunctions.net/digitalPassApi',
 };
}
export async function preparePilotRelease(env) {
 const config=pilotReleaseConfig(env),target=join(root,'.digital-pass-real-pilot');
 try{await access(target);throw Error('PILOT_OUTPUT_ALREADY_EXISTS')}catch(e){if(e.code!=='ENOENT')throw e}
 let entry=await readFile(join(root,'server/firebase-entry.mjs'),'utf8');
 const otherExport="export { pollsBridgeApi } from './polls-bridge-entry.mjs';";
 if(!entry.includes(otherExport)||!entry.includes("dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com"))throw Error('ENTRYPOINT_REVIEW_REQUIRED');
 entry=entry.replace(otherExport,'').replace('maxInstances: 10','maxInstances: 1');
 const modules=new Map([['firebase-entry.mjs',entry]]);
 for(const [name,content] of modules)for(const match of content.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g)){
  const dependency=match[1];
  if(!/^digital-pass-[a-z-]+\.mjs$/.test(dependency))throw Error('UNEXPECTED_RELEASE_DEPENDENCY');
  if(!modules.has(dependency))modules.set(dependency,await readFile(join(root,'server',dependency),'utf8'));
 }
 const pkg=JSON.parse(await readFile(join(root,'tools/digital-pass-staging/package.json'),'utf8'));
 const lock=JSON.parse(await readFile(join(root,'tools/digital-pass-staging/package-lock.json'),'utf8'));
 pkg.name='dns-digital-pass-functions';pkg.main='firebase-entry.mjs';
 lock.name=pkg.name;lock.packages[''].name=pkg.name;
 await mkdir(join(target,'server'),{recursive:true});
 const save=(file,content)=>writeFile(join(target,file),content,{flag:'wx',mode:0o600});
 for(const[name,content]of modules)await save('server/'+name,content);
 await save('server/package.json',JSON.stringify(pkg,null,2)+'\n');
 await save('server/package-lock.json',JSON.stringify(lock,null,2)+'\n');
 await save('server/.env.dns-core',Object.entries(config).map(([k,v])=>k+'='+JSON.stringify(v)).join('\n')+'\n');
 await save('firebase.json',JSON.stringify({functions:[{source:'server',codebase:'digital-pass',ignore:['node_modules','.env*','*.log']}]},null,2)+'\n');
 console.log('Prepared digitalPassApi only; fixed DNS Core runtime/region, one instance maximum. No cloud changes.');
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))await preparePilotRelease(process.env);
