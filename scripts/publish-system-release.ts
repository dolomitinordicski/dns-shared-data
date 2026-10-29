import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const file = process.argv.find(arg => arg.startsWith('--file='))?.slice(7);
const apply = process.argv.includes('--apply');
if (!file) throw new Error('Provide --file=path/to/release.json');
const input = JSON.parse(readFileSync(file, 'utf8'));
const validString = (v: unknown, max = 3000): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
if (!validString(input.id, 120) || !/^[a-z0-9][a-z0-9-]*$/.test(input.id)) throw new Error('Invalid release ID');
if (!validString(input.toolId, 100) || !validString(input.version, 80)) throw new Error('Invalid tool/version');
if (!['technical', 'feature', 'urgent'].includes(input.type) || !['dns', 'area'].includes(input.audience)) throw new Error('Invalid type/audience');
if (input.audience === 'area' && input.type === 'technical') throw new Error('Technical release cannot target areas');
if (!['it', 'de'].every(lang => validString(input.title?.[lang], 200) && validString(input.description?.[lang]))) throw new Error('Missing bilingual title/description');
const release = {
  toolId: input.toolId, version: input.version, type: input.type, audience: input.audience,
  published: true, publishedAt: new Date().toISOString(),
  title: { it: input.title.it, de: input.title.de },
  description: { it: input.description.it, de: input.description.de },
};
if (!apply) {
  console.log(JSON.stringify({ mode: 'DRY_RUN', id: input.id, ...release }, null, 2));
} else {
  if (process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || process.env.GITHUB_REF !== 'refs/heads/main') {
    throw new Error('Publishing requires manually dispatched workflow on main');
  }
  initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
  const ref = getFirestore().collection('systemReleases').doc(input.id);
  await getFirestore().runTransaction(async tx => {
    const previous = await tx.get(ref);
    if (previous.exists) throw new Error('Release ID already published; immutable publication');
    tx.create(ref, release);
  });
  console.log('Published approved release: ' + input.id);
}
