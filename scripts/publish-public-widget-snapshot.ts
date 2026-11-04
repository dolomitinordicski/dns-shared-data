import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import { isDNSPublicWidgetSnapshot } from '../src/public-widget.js';

const file = process.argv.find((arg) => arg.endsWith('.json'));
const apply = process.argv.includes('--apply');
if (!file) throw new Error('Provide an approved public snapshot JSON file');

const raw: unknown = JSON.parse(await readFile(file, 'utf8'));
if (!isDNSPublicWidgetSnapshot(raw)) throw new Error('Invalid public widget snapshot');
const snapshot = raw;
const documentId = snapshot.seasonId + '__' + (snapshot.areaId ?? 'all');
if (!/^[-a-z0-9]+__[-a-z0-9]+$/.test(documentId)) throw new Error('Invalid document identifier');
if (!Number.isFinite(Date.parse(snapshot.publishedAt))) throw new Error('Invalid publication time');
if (snapshot.pricing.items.some(p => !Number.isFinite(p.amount) || p.amount < 0 || p.currency !== 'EUR')) {
  throw new Error('Invalid public prices');
}

if (!apply) {
  console.log('Validated ' + documentId + ' (dry run; no writes)');
} else {
  if (process.env.GOOGLE_CLOUD_PROJECT !== 'dns-core') {
    throw new Error('Explicit dns-core project required');
  }
  initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
  const db = getFirestore();
  const ref = db.collection('widgetPublicSnapshots').doc(documentId);
  const previous = await ref.get();
  if (previous.exists && previous.data()?.snapshot?.revision === snapshot.revision) {
    throw new Error('Revision already published');
  }
  if (previous.exists && Date.parse(previous.data()?.snapshot?.publishedAt ?? '') >= Date.parse(snapshot.publishedAt)) {
    throw new Error('Publication must be newer than the current snapshot');
  }
  await ref.set({ documentId, publicationStatus: 'published', snapshot });
  const saved = await ref.get();
  if (!saved.exists || saved.data()?.snapshot?.revision !== snapshot.revision) {
    throw new Error('Publication read-back failed');
  }
  console.log('Published ' + documentId);
}
