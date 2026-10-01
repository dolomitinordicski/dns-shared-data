import { GoogleAuth } from 'google-auth-library';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const apply = process.argv.includes('--apply');
const local = process.argv.find((arg) => arg.startsWith('--source-dir='))?.slice(13);
const directory = await mkdtemp(join(tmpdir(), 'dns-history-2024-25-'));

try {
  let payloadPath;
  if (local) {
    payloadPath = join(directory, 'history.json');
    execFileSync('python', ['scripts/history/extract-2024-25.py', local, payloadPath], { stdio: 'inherit' });
  } else {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
    const credentials = await auth.getCredentials();
    console.log(`Source access account: ${credentials.client_email}`);
    const token = await auth.getAccessToken();
    const sources = [
      ['1L6zxTVBcyQmOHpBkY8gKkz-_Mi0Uwv1T', '01-ZUKUNFTSF-HIGE-LOIPENENTWICKLUNG-IM-DOLOMITI-NORDICSKI-NETZWERK-UND-S-DTIROL-internal-use-only.docx'],
      ['14SiOx-1RI8dDP5kZHqa2sdtGv8pF9zND', '02-2.-DNS-Report-2024-25-Schnee-und-Loipen.pdf'],
      ['1HoewTHS9ij3r0Bv0tEZwz8ZRAwxPtZhLfpdutycf_Bc', '03-VERKAUFSTATISTIK-STATISTICHE-DI-VENDITA-2024-25.xlsx'],
    ];
    for (const [id, filename] of sources) {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Cannot read source ${filename}: HTTP ${response.status}. Share the original file with the source access account printed above; no source data has been written.`);
      }
      await writeFile(join(directory, filename), Buffer.from(await response.arrayBuffer()));
    }
    payloadPath = join(directory, 'history.json');
    execFileSync('python', ['scripts/history/extract-2024-25.py', directory, payloadPath], { stdio: 'inherit' });
  }

  const bytes = await readFile(payloadPath);
  const payload = JSON.parse(bytes);
  const importHash = createHash('sha256').update(bytes).digest('hex');
  if (payload.schemaVersion !== 1 || payload.seasonId !== '2024-25') throw new Error('Invalid historical dataset.');
  if (payload.records.length !== 26 || payload.sources.length !== 3) throw new Error('Unexpected 2024-25 record/source count.');
  if (payload.records.some((record) => record.seasonId !== '2024-25' || record.readOnly !== true)) throw new Error('Record season or immutability validation failed.');
  if (new Set(payload.records.map((record) => record.id)).size !== payload.records.length) throw new Error('Duplicate historical record IDs.');

  const entries = [
    ...payload.records.map((record) => ['historicalSeasonRecords', record.id, record]),
    ...payload.sources.map((source) => ['historicalSeasonSources', source.id, { ...source, readOnly: true }]),
    ['historicalSeasonImports', '2024-25', { ...payload.summary, importHash, schemaVersion: 1,
      recordCount: payload.records.length, sourceCount: payload.sources.length }],
  ];
  if (entries.length >= 490 || entries.some(([, id, data]) => !id || Buffer.byteLength(JSON.stringify(data)) > 900000)) {
    throw new Error('Dataset exceeds Firestore import limits.');
  }
  console.log(`Validated ${payload.records.length} immutable 2024-25 records and ${payload.sources.length} source manifests. Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
  if (apply) {
  initializeApp({ credential: applicationDefault(), projectId: 'dns-core' });
  const db = getFirestore();
  const season = await db.doc('seasons/2024-25').get();
  if (!season.exists) throw new Error('Canonical season seasons/2024-25 is missing; import aborted without writes.');
  const refs = entries.map(([collectionName, id]) => db.collection(collectionName).doc(id));
  await db.runTransaction(async (transaction) => {
    const markerRef = db.doc('historicalSeasonImports/2024-25');
    const marker = await transaction.get(markerRef);
    if (marker.exists) {
      if (marker.data().importHash !== importHash) throw new Error('2024-25 import exists with a different hash. No overwrite allowed.');
      console.log('Identical 2024-25 import already exists; preserved.');
      return;
    }
    const existing = await transaction.getAll(...refs);
    if (existing.some((document) => document.exists)) throw new Error('Historical 2024-25 documents exist without an import marker. No overwrite allowed.');
    entries.forEach(([, , data], index) => transaction.create(refs[index], data));
  });

  const persisted = await db.getAll(...refs);
  function normalize(value) {
    return Array.isArray(value) ? value.map(normalize)
      : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]))
        : value;
  }
  persisted.forEach((document, index) => {
    if (!document.exists || JSON.stringify(normalize(document.data())) !== JSON.stringify(normalize(entries[index][2]))) {
      throw new Error(`Read-back verification failed for ${entries[index][0]}/${entries[index][1]}.`);
    }
  });
  console.log('2024-25 import persisted and all records verified by read-back.');
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
