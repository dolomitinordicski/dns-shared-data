#!/usr/bin/env node
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const valueAfter = flag => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const projectId = valueAfter('--project');
const bucketName = valueAfter('--bucket');
if (!projectId || !bucketName) {
  throw new Error('Usage: node scripts/audit-flyer-assets-rollout.mjs --project PROJECT_ID --bucket BUCKET_NAME');
}

const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId, storageBucket: bucketName });
const bucket = getStorage(app).bucket(bucketName);
const db = getFirestore(app);

let pageToken;
let objectCount = 0;
do {
  const [files, , response] = await bucket.getFiles({
    prefix: 'flyerAssets/',
    autoPaginate: false,
    maxResults: 1000,
    pageToken,
  });
  objectCount += files.length;
  pageToken = response?.nextPageToken;
} while (pageToken);

const grants = await db.collection('accessGrants').get();
const scopes = new Map();
for (const snapshot of grants.docs) {
  const data = snapshot.data();
  const permissions = Array.isArray(data.permissions)
    ? data.permissions.filter(permission => permission === 'flyer.read' || permission === 'flyer.write')
    : [];
  if (!permissions.length || typeof data.scopeType !== 'string' || typeof data.scopeId !== 'string') continue;
  const key = `${data.scopeType}\u0000${data.scopeId}`;
  const summary = scopes.get(key) ?? {
    scopeType: data.scopeType,
    scopeId: data.scopeId,
    permissions: new Set(),
    grants: 0,
    activeGrants: 0,
  };
  permissions.forEach(permission => summary.permissions.add(permission));
  summary.grants += 1;
  if (data.active === true) summary.activeGrants += 1;
  scopes.set(key, summary);
}

console.log(JSON.stringify({
  projectId,
  bucket: bucketName,
  flyerAssetObjectCount: objectCount,
  flyerPermissionScopes: [...scopes.values()]
    .map(scope => ({ ...scope, permissions: [...scope.permissions].sort() }))
    .sort((a, b) => `${a.scopeType}/${a.scopeId}`.localeCompare(`${b.scopeType}/${b.scopeId}`)),
  readOnly: true,
}, null, 2));
