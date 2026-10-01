import { pathToFileURL } from 'node:url';

const moduleUrl = pathToFileURL(process.cwd() + '/web-runtime/navigation.js').href + '?check=' + Date.now();
const runtime = await import(moduleUrl);

if (typeof runtime.initDNSNavigationRuntime !== 'function') {
  console.error('Browser navigation runtime does not export initDNSNavigationRuntime');
  process.exit(1);
}

console.log('✓ browser navigation runtime parses and exports initDNSNavigationRuntime');
