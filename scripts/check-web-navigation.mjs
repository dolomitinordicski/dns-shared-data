import { pathToFileURL } from 'node:url';

const moduleUrl = pathToFileURL(process.cwd() + '/web-runtime/navigation.js').href + '?check=' + Date.now();
const runtime = await import(moduleUrl);

if (typeof runtime.initDNSNavigationRuntime !== 'function') {
  console.error('Browser navigation runtime does not export initDNSNavigationRuntime');
  process.exit(1);
}

console.log('✓ browser navigation runtime parses and exports initDNSNavigationRuntime');

const styleInitializerSource = runtime.initDNSNavigationStyles.toString();
const styleInitializerBody = styleInitializerSource.slice(styleInitializerSource.indexOf('{') + 1);
if (
  !styleInitializerBody.includes('setNavigationVariables(documentRoot.documentElement') ||
  !styleInitializerBody.includes('ensureNavigationStyles(documentRoot') ||
  /\binitDNSNavigationStyles\s*\(/.test(styleInitializerBody)
) {
  console.error('Standalone navigation style initializer must apply its styles without recursion');
  process.exit(1);
}

console.log('✓ standalone navigation style initializer applies tokens and styles without recursion');


const chromeUrl = pathToFileURL(process.cwd() + '/web-runtime/tool-chrome.js').href + '?check=' + Date.now();
const chrome = await import(chromeUrl);

if (typeof chrome.initDNSToolChromeRuntime !== 'function') {
  console.error('Browser Tool Chrome runtime does not export initDNSToolChromeRuntime');
  process.exit(1);
}

if (typeof chrome.setDNSToolChromeActiveSection !== 'function') {
  console.error('Browser Tool Chrome runtime does not export setDNSToolChromeActiveSection');
  process.exit(1);
}

console.log('✓ browser Tool Chrome runtime parses and exports canonical helpers');
