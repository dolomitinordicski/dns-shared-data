import {
  DNS_APPLICATION_STATE_IDS,
  DNS_FORM_STATE_IDS,
  DNS_OVERLAY_IDS,
  DNS_DATA_ACTION_IDS,
  DNS_UPLOAD_STATE_IDS,
  DNS_OVERLAY_CONTRACT,
} from '../dist/data-ui.js';
import { openDNSOverlay } from '../dist/ui/overlay.js';
import { initDNSDataUIRuntime } from '../dist/ui/data-ui.js';
import { initDNSFoundation } from '../dist/foundation.js';

const errors = [];

const expectedApp = ['loading','empty','error','offline','unauthorized','forbidden','not-found','saving','saved','syncing','stale'];
const expectedForm = ['default','required','valid','error','readonly','disabled','dirty','saving','saved'];
const expectedOverlay = ['modal','confirm','drawer','popover','dropdown','menu','tooltip','toast','blocking'];
const expectedData = ['search','filter','sort','paginate','columns','select','bulk','export'];
const expectedUpload = ['idle','dragging','uploading','success','error','disabled'];

if (JSON.stringify(DNS_APPLICATION_STATE_IDS) !== JSON.stringify(expectedApp)) errors.push('Unexpected application states.');
if (JSON.stringify(DNS_FORM_STATE_IDS) !== JSON.stringify(expectedForm)) errors.push('Unexpected form states.');
if (JSON.stringify(DNS_OVERLAY_IDS) !== JSON.stringify(expectedOverlay)) errors.push('Unexpected overlay taxonomy.');
if (JSON.stringify(DNS_DATA_ACTION_IDS) !== JSON.stringify(expectedData)) errors.push('Unexpected data action taxonomy.');
if (JSON.stringify(DNS_UPLOAD_STATE_IDS) !== JSON.stringify(expectedUpload)) errors.push('Unexpected upload states.');

if (!DNS_OVERLAY_CONTRACT.modal.trapFocus || !DNS_OVERLAY_CONTRACT.modal.restoreFocus) errors.push('Modal must trap and restore focus.');
if (DNS_OVERLAY_CONTRACT.blocking.escapeCloses) errors.push('Blocking overlay must not Escape-close by default.');
if (DNS_OVERLAY_CONTRACT.toast.trapFocus) errors.push('Toast must not trap focus.');

const overlay = openDNSOverlay({ type: 'modal', element: {} });
overlay.close();
overlay.disconnect();
initDNSDataUIRuntime(undefined);

const foundation = initDNSFoundation();
foundation.disconnect();

if (errors.length) {
  console.error('F5 data UI validation failed:');
  errors.forEach((error) => console.error('- ' + error));
  process.exit(1);
}
console.log('✓ F5 data UI contract valid');
