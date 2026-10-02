import {
  DNS_ASSET_TYPE_IDS,
  DNS_ASSET_STATUS_IDS,
  DNS_ASSET_USAGE_IDS,
  DNS_ASSET_RULES,
  assetSupportsUsage,
} from '../dist/assets.js';
import {
  DNS_WORKSPACE_REGION_IDS,
  DNS_WORKSPACE_CONTRACT,
  DNS_WORKSPACE_RULES,
} from '../dist/workspace.js';
import { initDNSAssetUIRuntime } from '../dist/ui/assets.js';
import { initDNSWorkspaceRuntime } from '../dist/ui/workspace.js';
import { initDNSFoundation } from '../dist/foundation.js';

const errors = [];

if (JSON.stringify(DNS_ASSET_TYPE_IDS) !== JSON.stringify(['brand','region-logo','organization-logo','graphic','icon','photo','template','document'])) {
  errors.push('Unexpected asset type set.');
}
if (JSON.stringify(DNS_ASSET_STATUS_IDS) !== JSON.stringify(['draft','active','deprecated','archived'])) {
  errors.push('Unexpected asset status set.');
}
if (JSON.stringify(DNS_ASSET_USAGE_IDS) !== JSON.stringify(['web','print','portal','workspace','export','download'])) {
  errors.push('Unexpected asset usage set.');
}
if (JSON.stringify(DNS_WORKSPACE_REGION_IDS) !== JSON.stringify(['toolbar','canvas','inspector','mobile-panel'])) {
  errors.push('Unexpected workspace regions.');
}
if (DNS_WORKSPACE_CONTRACT.desktopInspectorMinPx !== 280 || DNS_WORKSPACE_CONTRACT.desktopInspectorMaxPx !== 380) {
  errors.push('Unexpected workspace inspector geometry.');
}
if (!DNS_ASSET_RULES.some((r) => r.includes('unofficial logos'))) errors.push('Canonical-logo rule missing.');
if (!DNS_WORKSPACE_RULES.some((r) => r.includes('authored artifact'))) errors.push('Workspace creative-boundary rule missing.');

const sample = { usages: ['web','workspace'] };
if (!assetSupportsUsage(sample, 'workspace')) errors.push('Asset usage helper failed.');
if (assetSupportsUsage(sample, 'print')) errors.push('Asset usage helper returned false positive.');

initDNSAssetUIRuntime(undefined);
const workspace = initDNSWorkspaceRuntime(undefined);
workspace.setInspectorState('collapsed');
workspace.setMobilePanelOpen(true);
workspace.disconnect();

const foundation = initDNSFoundation({ shellProfile: 'workspace' });
foundation.workspaceRuntime?.setInspectorState('open');
foundation.disconnect();

if (errors.length) {
  console.error('F7 asset/workspace validation failed:');
  errors.forEach((e) => console.error('- ' + e));
  process.exit(1);
}
console.log('✓ F7 asset/workspace contract valid');
