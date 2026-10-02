import fs from 'node:fs';
import {
  DNS_FOUNDATION_RELEASE,
  DNS_FOUNDATION_RELEASE_VERSION,
  DNS_FOUNDATION_RELEASE_REF,
} from '../dist/release.js';
import { DNS_DESIGN_SYSTEM_VERSION } from '../dist/design-system.js';
import { DNS_DATA_CONTRACTS_VERSION } from '../dist/data-contracts.js';
import { DNS_FOUNDATION_RUNTIME_VERSION } from '../dist/foundation.js';

const errors = [];
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('releases/v1.0.0/manifest.json', 'utf8'));

if (pkg.version !== DNS_FOUNDATION_RELEASE_VERSION) {
  errors.push(`package.json version ${pkg.version} != release ${DNS_FOUNDATION_RELEASE_VERSION}`);
}
if (pkg.private !== true) errors.push('Foundation package must remain private in v1.0.0.');
if (DNS_FOUNDATION_RELEASE_VERSION !== '1.0.0') errors.push('Unexpected Foundation stable release version.');
if (DNS_FOUNDATION_RELEASE_REF !== 'release/v1.0.0') errors.push('Unexpected Foundation release ref.');
if (DNS_FOUNDATION_RELEASE.channel !== 'stable') errors.push('Release channel must be stable.');
if (DNS_FOUNDATION_RELEASE.status !== 'frozen') errors.push('Release status must be frozen.');
if (DNS_FOUNDATION_RUNTIME_VERSION !== '1.0.0') errors.push('Runtime component mismatch.');
if (DNS_DESIGN_SYSTEM_VERSION !== '1.24.0') errors.push('Design System component mismatch.');
if (DNS_DATA_CONTRACTS_VERSION !== '0.8.0') errors.push('Data Contracts component mismatch.');

if (manifest.foundationRelease !== DNS_FOUNDATION_RELEASE_VERSION) errors.push('Snapshot manifest release mismatch.');
if (manifest.ref !== DNS_FOUNDATION_RELEASE_REF) errors.push('Snapshot manifest ref mismatch.');
if (manifest.components.foundationRuntime !== DNS_FOUNDATION_RUNTIME_VERSION) errors.push('Manifest runtime mismatch.');
if (manifest.components.designSystem !== DNS_DESIGN_SYSTEM_VERSION) errors.push('Manifest Design System mismatch.');
if (manifest.components.dataContracts !== DNS_DATA_CONTRACTS_VERSION) errors.push('Manifest Data Contracts mismatch.');

for (const prohibited of ['main','master','raw-commit-sha']) {
  if (!DNS_FOUNDATION_RELEASE.pinning.prohibitedRefs.includes(prohibited)) {
    errors.push(`Missing prohibited consumer ref: ${prohibited}`);
  }
}

if (!pkg.exports?.['./release']) errors.push('Package ./release export missing.');

if (errors.length) {
  console.error('F8 release/freeze validation failed:');
  errors.forEach((e) => console.error('- ' + e));
  process.exit(1);
}

console.log('✓ Foundation v1.0.0 stable/frozen release contract valid');
