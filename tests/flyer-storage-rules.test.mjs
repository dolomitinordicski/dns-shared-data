import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { deleteObject, getBytes, getMetadata, listAll, ref, uploadBytes } from 'firebase/storage';

const projectId = 'demo-dns-storage';
const bucket = `${projectId}.firebasestorage.app`;
const areaA = 'dns-test-area';
const areaB = 'dns-test-area-b';
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
let env;

function storage(uid) {
  return env.authenticatedContext(uid, { email: `${uid}@example.test` }).storage(`gs://${bucket}`);
}

function file(uid, ownerUid, areaId, name = 'test.jpg') {
  return ref(storage(uid), `flyerAssets/${ownerUid}/${areaId}/${name}`);
}

async function upload(uid, ownerUid, areaId, name = 'test.jpg', bytes = jpeg, contentType = 'image/jpeg') {
  return uploadBytes(file(uid, ownerUid, areaId, name), bytes, { contentType });
}

async function seed() {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const put = (path, data) => setDoc(doc(db, path), data);
    for (const uid of ['admin', 'writer', 'reader', 'writeonly', 'none', 'inactive', 'expired', 'future', 'malformed', 'other']) {
      await put(`users/${uid}`, {
        active: uid !== 'inactive',
        globalRoles: uid === 'admin' ? ['dns-admin'] : [],
      });
    }
    const grants = {
      writer: ['flyer.read', 'flyer.write'],
      reader: ['flyer.read'],
      writeonly: ['flyer.write'],
      expired: ['flyer.read', 'flyer.write'],
      future: ['flyer.read', 'flyer.write'],
      malformed: ['flyer.read', 'flyer.write'],
      other: ['flyer.read', 'flyer.write'],
    };
    for (const [uid, permissions] of Object.entries(grants)) {
      const areaId = uid === 'other' ? areaB : areaA;
      await put(`accessGrants/${uid}__reportingArea__${areaId}`, {
        active: true,
        userId: uid,
        scopeType: 'reportingArea',
        scopeId: areaId,
        permissions,
        ...(uid === 'expired' ? { validTo: '2000-01-01T00:00:00Z' } : {}),
        ...(uid === 'future' ? { validFrom: '2100-01-01T00:00:00Z' } : {}),
        ...(uid === 'malformed' ? { validTo: 'not-a-date' } : {}),
      });
    }
  });
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8588, rules: await readFile('firestore.rules', 'utf8') },
    storage: { host: '127.0.0.1', port: 9299, rules: await readFile('storage.rules', 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await seed();
});

after(async () => env?.cleanup());

test('writer uploads, lists, reads and deletes only its own area folder', async () => {
  await assertSucceeds(upload('writer', 'writer', areaA));
  const listed = await assertSucceeds(listAll(ref(storage('writer'), `flyerAssets/writer/${areaA}`)));
  assert.equal(listed.items.length, 1);
  await assertSucceeds(getBytes(file('writer', 'writer', areaA)));
  await assertSucceeds(deleteObject(file('writer', 'writer', areaA)));
  await assertFails(upload('writer', 'writer', areaB));
  await assertFails(upload('writer', 'other', areaA));
});

test('reader can list and download but cannot upload or delete', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await uploadBytes(ref(context.storage(`gs://${bucket}`), `flyerAssets/reader/${areaA}/seed.jpg`), jpeg, { contentType: 'image/jpeg' });
  });
  await assertSucceeds(listAll(ref(storage('reader'), `flyerAssets/reader/${areaA}`)));
  await assertSucceeds(getBytes(file('reader', 'reader', areaA, 'seed.jpg')));
  await assertFails(upload('reader', 'reader', areaA));
  await assertFails(deleteObject(file('reader', 'reader', areaA, 'seed.jpg')));
});

test('write-only can upload but cannot list, read or inspect metadata', async () => {
  await assertSucceeds(upload('writeonly', 'writeonly', areaA));
  await assertFails(listAll(ref(storage('writeonly'), `flyerAssets/writeonly/${areaA}`)));
  await assertFails(getBytes(file('writeonly', 'writeonly', areaA)));
  await assertFails(getMetadata(file('writeonly', 'writeonly', areaA)));
});

test('none, inactive and invalid validity windows fail closed', async () => {
  for (const uid of ['none', 'inactive', 'expired', 'future', 'malformed']) {
    await assertFails(upload(uid, uid, areaA));
    await assertFails(listAll(ref(storage(uid), `flyerAssets/${uid}/${areaA}`)));
  }
  await assertFails(uploadBytes(file('none', 'none', areaA), jpeg, { contentType: 'image/jpeg' }));
});

test('another organization cannot access another owner or area', async () => {
  await assertSucceeds(upload('writer', 'writer', areaA, 'private.jpg'));
  await assertFails(getBytes(file('other', 'writer', areaA, 'private.jpg')));
  await assertFails(listAll(ref(storage('other'), `flyerAssets/writer/${areaA}`)));
  await assertSucceeds(upload('other', 'other', areaB, 'own.jpg'));
});

test('admin can administer network and organization folders', async () => {
  await assertSucceeds(upload('admin', 'admin', 'dns_central', 'central.jpg'));
  await assertSucceeds(upload('admin', 'writer', areaA, 'support.jpg'));
  await assertSucceeds(getBytes(file('admin', 'writer', areaA, 'support.jpg')));
  await assertSucceeds(deleteObject(file('admin', 'writer', areaA, 'support.jpg')));
});

test('upload validation rejects wrong types, extensions, empty and oversized data', async () => {
  await assertFails(upload('writer', 'writer', areaA, 'bad.png', jpeg, 'image/png'));
  await assertFails(upload('writer', 'writer', areaA, 'bad.exe', jpeg, 'image/jpeg'));
  await assertFails(upload('writer', 'writer', areaA, 'empty.jpg', new Uint8Array(), 'image/jpeg'));
  await assertFails(upload('writer', 'writer', areaA, 'huge.jpg', new Uint8Array(12 * 1024 * 1024 + 1), 'image/jpeg'));
  await assertFails(upload('writer', 'writer', areaA, `${'x'.repeat(141)}.jpg`, jpeg, 'image/jpeg'));
});

test('anonymous and unmatched paths are denied', async () => {
  const anonymous = env.unauthenticatedContext().storage(`gs://${bucket}`);
  await assertFails(uploadBytes(ref(anonymous, `flyerAssets/writer/${areaA}/anon.jpg`), jpeg, { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(storage('writer'), 'other/path.jpg'), jpeg, { contentType: 'image/jpeg' }));
});
