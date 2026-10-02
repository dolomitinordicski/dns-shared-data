import {
  DNS_PRINT_PROFILE_IDS,
  DNS_PRINT_PROFILES,
  DNS_CREATIVE_EXPORT_BOUNDARY,
  getDNSPrintProfile,
} from '../dist/print-profiles.js';
import { initDNSPrintRuntime } from '../dist/ui/print.js';
import { initDNSFoundation } from '../dist/foundation.js';

const errors = [];

if (JSON.stringify(DNS_PRINT_PROFILE_IDS) !== JSON.stringify(['operational-table','report','document'])) {
  errors.push('Print profile IDs must be operational-table, report, document.');
}
if (getDNSPrintProfile().id !== 'operational-table') {
  errors.push('Operational Table must remain the default print profile.');
}
if (DNS_PRINT_PROFILES['operational-table'].orientation !== 'landscape') {
  errors.push('Operational Table must remain landscape.');
}
if (DNS_PRINT_PROFILES.report.orientation !== 'portrait') {
  errors.push('Report must be portrait.');
}
if (DNS_PRINT_PROFILES.document.contentMode !== 'form-document') {
  errors.push('Document profile must use form-document mode.');
}
if (DNS_CREATIVE_EXPORT_BOUNDARY.foundationPrintProfile !== false) {
  errors.push('Creative export must remain outside Foundation print profiles.');
}

for (const profile of DNS_PRINT_PROFILE_IDS) {
  const runtime = initDNSPrintRuntime({ profile });
  if (runtime.getProfile() !== profile) {
    errors.push(`${profile}: print runtime profile resolution failed.`);
  }
  runtime.setProfile(profile);
  runtime.printNow(profile);
  runtime.disconnect();

  const foundation = initDNSFoundation({ printProfile: profile });
  foundation.printNow(profile);
  foundation.disconnect();
}

if (errors.length) {
  console.error('Print profile validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('✓ print profile contract valid (Operational Table / Report / Document + creative-export boundary)');
