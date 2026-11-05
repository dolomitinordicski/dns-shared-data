import { persistHistory2024_25 } from './verify-2024-25.mjs';
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

async function driveError(response) {
  const body = await response.json().catch(() => ({}));
  const error = body?.error ?? {};
  const reason = error.errors?.[0]?.reason;
  return [error.status, reason, error.message].filter(Boolean).join(': ').slice(0, 300) || `HTTP ${response.status}`;
}

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
      const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=mimeType&supportsAllDrives=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!metadataResponse.ok) throw new Error(`Cannot inspect source ${filename}: ${await driveError(metadataResponse)}. No source data has been written.`);
      const metadata = await metadataResponse.json();
      const nativeSpreadsheet = metadata.mimeType === 'application/vnd.google-apps.spreadsheet';
      const sourceUrl = nativeSpreadsheet
        ? `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=application%2Fvnd.openxmlformats-officedocument.spreadsheetml.sheet`
        : `https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`;
      const response = await fetch(sourceUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Cannot read source ${filename}: ${await driveError(response)}. No source data has been written.`);
      }
      if (nativeSpreadsheet) console.log('Exported the native Google Sheet to XLSX; the extractor will verify the immutable data fingerprint.');
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
  const result = await persistHistory2024_25(db, entries, importHash);
  console.log(result.exportChanged
    ? 'Existing 2024-25 content verified; only export-byte metadata differs. Original records and metadata preserved without writes.'
    : '2024-25 import and all records verified by read-back.');
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
