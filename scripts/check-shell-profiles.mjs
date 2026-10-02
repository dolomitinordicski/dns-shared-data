import {
  DNS_SHELL_PROFILE_IDS,
  DNS_SHELL_PROFILES,
  getDNSShellProfile,
} from '../dist/shell-profiles.js';
import { initDNSFoundation } from '../dist/foundation.js';

const errors = [];

if (JSON.stringify(DNS_SHELL_PROFILE_IDS) !== JSON.stringify(['operational','portal','workspace'])) {
  errors.push('Shell profile IDs must be operational, portal, workspace.');
}
if (getDNSShellProfile().id !== 'operational') {
  errors.push('Operational must remain the default shell profile.');
}
if (DNS_SHELL_PROFILES.operational.navigation.mode !== 'tabs') {
  errors.push('Operational shell must use tabs navigation.');
}
if (DNS_SHELL_PROFILES.portal.navigation.mode !== 'app') {
  errors.push('Portal shell must use app navigation.');
}
if (!DNS_SHELL_PROFILES.portal.header.showAccountContext) {
  errors.push('Portal shell must support account context.');
}
if (DNS_SHELL_PROFILES.workspace.navigation.mode !== 'workspace') {
  errors.push('Workspace shell must use workspace navigation.');
}
if (DNS_SHELL_PROFILES.workspace.footer.required) {
  errors.push('Workspace footer must not be required.');
}

for (const profile of DNS_SHELL_PROFILE_IDS) {
  const runtime = initDNSFoundation({ shellProfile: profile });
  if (runtime.getLanguage() !== 'de') {
    errors.push(`${profile}: no-DOM Foundation runtime must still default to German.`);
  }
  runtime.disconnect();
}

if (errors.length) {
  console.error('Shell profile validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('✓ shell profile contract valid (Operational / Portal / Workspace)');
