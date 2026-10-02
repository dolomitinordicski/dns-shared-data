import fs from 'node:fs';

const errors = [];
const manifest = JSON.parse(fs.readFileSync('releases/v1.0.0/manifest.json', 'utf8'));

if (manifest.foundationRelease !== '1.0.0') errors.push('Historical Foundation v1.0.0 snapshot version changed.');
if (manifest.ref !== 'release/v1.0.0') errors.push('Historical Foundation v1.0.0 release ref changed.');
if (manifest.channel !== 'stable') errors.push('Historical v1.0.0 channel changed.');
if (manifest.status !== 'frozen') errors.push('Historical v1.0.0 status changed.');
if (manifest.components.foundationRuntime !== '1.0.0') errors.push('Historical v1.0.0 runtime changed.');
if (manifest.components.designSystem !== '1.24.0') errors.push('Historical v1.0.0 Design System changed.');
if (manifest.components.dataContracts !== '0.8.0') errors.push('Historical v1.0.0 Data Contracts changed.');

if (errors.length) {
  console.error('F8 historical release validation failed:');
  errors.forEach((e) => console.error('- ' + e));
  process.exit(1);
}

console.log('✓ historical Foundation v1.0.0 freeze remains intact');
