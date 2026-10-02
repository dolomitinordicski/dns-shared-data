import {
  DNS_MOTION_SEMANTIC_IDS,
  DNS_MOTION_SEMANTICS,
  DNS_INTERACTION_SEMANTIC_IDS,
  DNS_INTERACTION_SEMANTICS,
  getDNSMotionSemantic,
} from '../dist/motion-semantics.js';
import { initDNSSemanticMotionRuntime } from '../dist/ui/semantic-motion.js';
import { initDNSFoundation } from '../dist/foundation.js';

const errors = [];

const expectedMotion = ['enter','exit','expand','collapse','modal','drawer','toast','tab','contextChange','loading'];
const expectedInteraction = ['action','selection','toggle','navigation','destructive'];

if (JSON.stringify(DNS_MOTION_SEMANTIC_IDS) !== JSON.stringify(expectedMotion)) {
  errors.push('Unexpected semantic motion ID set.');
}
if (JSON.stringify(DNS_INTERACTION_SEMANTIC_IDS) !== JSON.stringify(expectedInteraction)) {
  errors.push('Unexpected interaction semantic ID set.');
}

for (const id of DNS_MOTION_SEMANTIC_IDS) {
  const preset = getDNSMotionSemantic(id);
  if (preset.id !== id) errors.push(`${id}: preset ID mismatch.`);
  if (!(preset.durationMs >= 0)) errors.push(`${id}: invalid duration.`);
  if (!preset.easing) errors.push(`${id}: missing easing.`);
}

if (DNS_MOTION_SEMANTICS.exit.durationMs >= DNS_MOTION_SEMANTICS.enter.durationMs) {
  errors.push('Exit should remain faster than enter.');
}
if (DNS_MOTION_SEMANTICS.tab.animate.includes('transform')) {
  errors.push('Tab semantic motion must not slide the view.');
}
if (!DNS_MOTION_SEMANTICS.loading.rules.some((rule) => rule.includes('Reduced motion'))) {
  errors.push('Loading semantic must document reduced-motion behavior.');
}

for (const id of DNS_INTERACTION_SEMANTIC_IDS) {
  if (!DNS_INTERACTION_SEMANTICS[id]) errors.push(`${id}: interaction semantic missing.`);
}

const semanticRuntime = initDNSSemanticMotionRuntime();
semanticRuntime.disconnect();

const foundation = initDNSFoundation();
if (foundation.playMotion({} , 'enter') !== null) {
  errors.push('No-DOM Foundation playMotion should be inert.');
}
foundation.disconnect();

if (errors.length) {
  console.error('Motion semantics validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('✓ motion semantics contract valid (10 motion events / 5 interaction roles)');
