import {
  DNS_FOUNDATION_RUNTIME_VERSION,
  initDNSFoundation,
} from '../dist/foundation.js';

const errors = [];

if (DNS_FOUNDATION_RUNTIME_VERSION !== '1.2.1') {
  errors.push('Unexpected Foundation runtime version.');
}

const runtime = initDNSFoundation();

if (runtime.getLanguage() !== 'de') {
  errors.push('SSR/no-DOM runtime must default to German.');
}
if (runtime.source !== 'package') {
  errors.push('Default Foundation source must be package.');
}
if (!runtime.designSystemVersion) {
  errors.push('Design System version must be exposed.');
}

let observed = null;
const unsubscribe = runtime.subscribeLanguage((language) => {
  observed = language;
});

runtime.setLanguage('it');

if (runtime.getLanguage() !== 'it') {
  errors.push('setLanguage(it) did not update runtime language.');
}
if (observed !== 'it') {
  errors.push('Language subscriber did not receive update.');
}

unsubscribe();
runtime.printNow();
runtime.refresh();
runtime.disconnect();

if (errors.length) {
  console.error('Foundation runtime validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`✓ Foundation runtime contract valid (v${DNS_FOUNDATION_RUNTIME_VERSION})`);
