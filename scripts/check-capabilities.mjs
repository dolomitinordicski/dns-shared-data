import fs from 'node:fs';
import { DNS_CAPABILITY_IDS, DNS_CAPABILITIES } from '../dist/capabilities.js';
import { createDNSCapabilityRuntime } from '../dist/capability-runtime.js';
import { DNS_FOUNDATION_RELEASE, DNS_FOUNDATION_RELEASE_VERSION, DNS_FOUNDATION_RELEASE_REF } from '../dist/release.js';
import { DNS_FOUNDATION_RUNTIME_VERSION } from '../dist/foundation.js';
import { DNS_DESIGN_SYSTEM_VERSION } from '../dist/design-system.js';
import { DNS_DATA_CONTRACTS_VERSION } from '../dist/data-contracts.js';

const errors = [];
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const current = JSON.parse(fs.readFileSync('releases/v1.1.3/manifest.json','utf8'));
const previous = JSON.parse(fs.readFileSync('releases/v1.0.0/manifest.json','utf8'));

if (DNS_CAPABILITY_IDS.length !== 16) errors.push('Expected 16 governed capabilities.');
for (const id of ['export.csv','export.xlsx','export.pdf','import.xlsx','calendar.ics','clipboard.copy','qr.generate','print']) {
  if (!DNS_CAPABILITY_IDS.includes(id)) errors.push('Missing capability: '+id);
}
if (DNS_CAPABILITIES['export.csv'].implementation !== 'foundation-native') errors.push('CSV export must be Foundation-native.');
if (DNS_CAPABILITIES['export.xlsx'].implementation !== 'adapter') errors.push('XLSX export must be adapter-based.');
if (DNS_CAPABILITIES['export.pdf'].implementation !== 'adapter') errors.push('PDF export must be adapter-based.');

const runtime = createDNSCapabilityRuntime({ declared: ['export.csv','export.xlsx','print'] });
if (!runtime.has('export.csv')) errors.push('Native CSV capability should be available.');
if (runtime.has('export.xlsx')) errors.push('XLSX must remain unavailable until adapter registration.');
runtime.register({ id:'test-xlsx', capabilities:['export.xlsx'], execute(){ return {ok:true}; } });
if (!runtime.has('export.xlsx')) errors.push('Registered XLSX adapter should become available.');

let dynamicLanguage = 'de';
let observedAdapterLanguage = null;
const languageRuntime = createDNSCapabilityRuntime({
  declared: ['export.xlsx'],
  getLanguage: () => dynamicLanguage,
});
languageRuntime.register({
  id: 'test-language',
  capabilities: ['export.xlsx'],
  execute(_input, context) {
    observedAdapterLanguage = context.language;
    return { ok: true };
  },
});
dynamicLanguage = 'it';
await languageRuntime.run('export.xlsx', {});
if (observedAdapterLanguage !== 'it') errors.push('Capability adapter must receive current Foundation language at invocation time.');

if (pkg.version !== '1.2.1') errors.push('Package must be 1.2.1.');
if (DNS_FOUNDATION_RELEASE_VERSION !== '1.2.1') errors.push('Release must be 1.2.1.');
if (DNS_FOUNDATION_RELEASE_REF !== 'foundation-v1.2.1') errors.push('Release ref must be foundation-v1.2.1.');
if (DNS_FOUNDATION_RUNTIME_VERSION !== '1.2.1') errors.push('Runtime must be 1.2.1.');
if (DNS_DESIGN_SYSTEM_VERSION !== '1.25.0') errors.push('Design System must be 1.25.0.');
if (DNS_DATA_CONTRACTS_VERSION !== '0.8.0') errors.push('Data Contracts must remain 0.8.0.');
if (current.components.capabilities !== '1.0.0') errors.push('Capability component version mismatch.');
if (previous.foundationRelease !== '1.0.0' || previous.ref !== 'release/v1.0.0') errors.push('Historical v1.0.0 snapshot changed.');
if (DNS_FOUNDATION_RELEASE.channel !== 'stable') errors.push('Current release must remain stable.');

if (errors.length) {
  console.error('C1 shared capabilities validation failed:');
  errors.forEach(e=>console.error('- '+e));
  process.exit(1);
}
console.log('✓ C1 shared capabilities / Foundation 1.2.1 contract valid');
