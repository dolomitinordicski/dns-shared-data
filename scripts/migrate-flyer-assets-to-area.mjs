#!/usr/bin/env node
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const valueAfter = flag => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const projectId = valueAfter('--project');
const bucketName = valueAfter('--bucket');
const apply = process.argv.includes('--apply');
if (!projectId || !bucketName) {
  throw new Error('Usage: node scripts/migrate-flyer-assets-to-area.mjs --project PROJECT_ID --bucket BUCKET_NAME [--apply]');
}

const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId, storageBucket: bucketName });
const bucket = getStorage(app).bucket(bucketName);
const [files] = await bucket.getFiles({ prefix: 'flyerAssets/' });
const legacy = files.flatMap(file => {
  const match = file.name.match(/^flyerAssets\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (!match) return [];
  return [{ file, ownerUid: match[1], areaId: match[2], fileName: match[3] }];
});

const results = [];
for (const entry of legacy) {
  const destinationName = `flyerAssets/${entry.areaId}/${entry.fileName}`;
  const destination = bucket.file(destinationName);
  const [exists] = await destination.exists();
  if (exists) {
    const [[sourceMetadata], [destinationMetadata]] = await Promise.all([
      entry.file.getMetadata(),
      destination.getMetadata(),
    ]);
    const sameContent = Boolean(
      (sourceMetadata.md5Hash && sourceMetadata.md5Hash === destinationMetadata.md5Hash)
      || (sourceMetadata.crc32c && sourceMetadata.crc32c === destinationMetadata.crc32c),
    );
    results.push({ source: entry.file.name, destination: destinationName, action: sameContent ? 'skip-identical' : 'collision' });
    continue;
  }
  if (apply) await entry.file.copy(destination);
  results.push({ source: entry.file.name, destination: destinationName, action: apply ? 'copied' : 'would-copy' });
}

console.log(JSON.stringify({
  projectId,
  bucket: bucketName,
  mode: apply ? 'apply-copy-only' : 'dry-run',
  legacyObjects: legacy.length,
  copied: results.filter(result => result.action === 'copied').length,
  collisions: results.filter(result => result.action === 'collision').length,
  sourceObjectsDeleted: 0,
  results,
}, null, 2));

if (results.some(result => result.action === 'collision')) process.exitCode = 2;
