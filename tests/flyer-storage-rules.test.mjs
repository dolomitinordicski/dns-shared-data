import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getBytes, getMetadata, listAll, ref, uploadBytes } from 'firebase/storage';

const projectId = 'demo-dns-storage';
const bucket = `${projectId}.firebasestorage.app`;
const areaA = 'seiser-alm-dolomites-val-gardena';
const areaB = 'drei-zinnen';
const orgA = 'seiser-alm-marketing';
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
let env;

function context(uid) {
  return env.authenticatedContext(uid, { email: `${uid}@example.test` });
}

function storage(uid) {
  return context(uid).storage(`gs://${bucket}`);
}

function firestore(uid) {
  return context(uid).firestore();
}

function areaFile(uid, areaId, name = 'test.jpg') {
  return ref(storage(uid), `flyerAssets/${areaId}/${name}`);
}

async function uploadArea(uid, areaId, name = 'test.jpg', bytes = jpeg, contentType = 'image/jpeg') {
  return uploadBytes(areaFile(uid, areaId, name), bytes, { contentType });
}

async function seed() {
  await env.withSecurityRulesDisabled(async disabled => {
    const db = disabled.firestore();
    const put = (path, data) => setDoc(doc(db, path), data);
    const users = [
      'admin', 'writerA', 'readerA', 'writerA2', 'replacementA', 'otherB',
      'orgOnly', 'networkReader', 'networkWriter', 'inactive', 'expired',
      'disabled', 'future', 'malformed', 'offset', 'none',
    ];
    for (const uid of users) {
      await put(`users/${uid}`, {
        active: uid !== 'inactive',
        globalRoles: uid === 'admin' ? ['dns-admin'] : [],
      });
    }

    await put(`reportingAreas/${areaA}`, { id: areaA, active: true });
    await put(`reportingAreas/${areaB}`, { id: areaB, active: true });
    await put(`organizations/${orgA}`, { id: orgA, reportingAreaIds: [areaA] });

    const grant = async (uid, scopeType, scopeId, permissions, validity = {}) => put(
      `accessGrants/${uid}__${scopeType}__${scopeId}`,
      { active: true, userId: uid, scopeType, scopeId, permissions, ...validity },
    );
    for (const uid of ['writerA', 'writerA2', 'replacementA']) {
      await grant(uid, 'reportingArea', areaA, ['flyer.read', 'flyer.write', 'flyer.assets.manage']);
    }
    await grant('readerA', 'reportingArea', areaA, ['flyer.read']);
    await grant('otherB', 'reportingArea', areaB, ['flyer.read', 'flyer.write']);
    await grant('orgOnly', 'organization', orgA, ['flyer.read', 'flyer.write']);
    await grant('networkReader', 'network', 'dolomiti-nordicski', ['flyer.read']);
    await grant('networkWriter', 'network', 'dolomiti-nordicski', ['flyer.write']);
    await grant('inactive', 'reportingArea', areaA, ['flyer.read', 'flyer.write']);
    await put(`accessGrants/disabled__reportingArea__${areaA}`, {
      active: false,
      userId: 'disabled',
      scopeType: 'reportingArea',
      scopeId: areaA,
      permissions: ['flyer.read', 'flyer.write'],
    });
    await grant('expired', 'reportingArea', areaA, ['flyer.read', 'flyer.write'], { validTo: '2000-01-01T00:00:00Z' });
    await grant('future', 'reportingArea', areaA, ['flyer.read', 'flyer.write'], { validFrom: '2100-01-01T00:00:00Z' });
    await grant('malformed', 'reportingArea', areaA, ['flyer.read', 'flyer.write'], { validTo: 'not-a-date' });
    await grant('offset', 'reportingArea', areaA, ['flyer.read', 'flyer.write', 'flyer.assets.manage'], {
      validFrom: '2026-01-01T00:00:00+01:00',
      validTo: '2099-01-01T00:00:00+01:00',
    });

    await put('flyerAssets/seed-asset', {
      id: 'seed-asset',
      scopeType: 'reportingArea',
      scopeId: areaA,
      schema: 'dns.flyer-asset',
      version: 1,
      assetType: 'image',
      storagePath: `flyerAssets/${areaA}/shared.jpg`,
      updatedBy: 'writerA',
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });
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

test('area writer uploads, lists, reads and deletes in area A', async () => {
  await assertSucceeds(uploadArea('writerA', areaA));
  const listed = await assertSucceeds(listAll(ref(storage('writerA'), `flyerAssets/${areaA}`)));
  assert.equal(listed.items.length, 1);
  await assertSucceeds(getBytes(areaFile('writerA', areaA)));
  await assertSucceeds(deleteObject(areaFile('writerA', areaA)));
});

test('area reader reads another account file but cannot create, overwrite or delete', async () => {
  await assertSucceeds(uploadArea('writerA', areaA, 'shared.jpg'));
  await assertSucceeds(listAll(ref(storage('readerA'), `flyerAssets/${areaA}`)));
  await assertSucceeds(getBytes(areaFile('readerA', areaA, 'shared.jpg')));
  await assertFails(uploadArea('readerA', areaA, 'reader.jpg'));
  await assertFails(uploadArea('readerA', areaA, 'shared.jpg'));
  await assertFails(deleteObject(areaFile('readerA', areaA, 'shared.jpg')));
});

test('second writer in the same area uploads and reads the first writer file', async () => {
  await assertSucceeds(uploadArea('writerA', areaA, 'first.jpg'));
  await assertSucceeds(getBytes(areaFile('writerA2', areaA, 'first.jpg')));
  await assertSucceeds(uploadArea('writerA2', areaA, 'second.jpg'));
});

test('replacement uid with area write reads and deletes files from the former uid', async () => {
  await assertSucceeds(uploadArea('writerA', areaA, 'former-account.jpg'));
  await assertSucceeds(getBytes(areaFile('replacementA', areaA, 'former-account.jpg')));
  await assertSucceeds(deleteObject(areaFile('replacementA', areaA, 'former-account.jpg')));
});

test('account from area B cannot access area A', async () => {
  await assertSucceeds(uploadArea('writerA', areaA, 'private.jpg'));
  await assertFails(getBytes(areaFile('otherB', areaA, 'private.jpg')));
  await assertFails(listAll(ref(storage('otherB'), `flyerAssets/${areaA}`)));
  await assertFails(uploadArea('otherB', areaA, 'foreign.jpg'));
  await assertSucceeds(uploadArea('otherB', areaB, 'own.jpg'));
});

test('organization-only grant is explicitly ineffective for Storage', async () => {
  await assertFails(uploadArea('orgOnly', areaA, 'organization.jpg'));
  await assertFails(listAll(ref(storage('orgOnly'), `flyerAssets/${areaA}`)));
});

test('network read and write grants apply across areas without admin', async () => {
  await assertSucceeds(uploadArea('networkWriter', areaA, 'network.jpg'));
  await assertSucceeds(getBytes(areaFile('networkWriter', areaA, 'network.jpg')));
  await assertSucceeds(getBytes(areaFile('networkReader', areaA, 'network.jpg')));
  await assertFails(uploadArea('networkReader', areaA, 'denied.jpg'));
  await assertSucceeds(uploadArea('networkWriter', areaB, 'other-area.jpg'));
});

test('inactive, expired, future, malformed and absent grants fail closed in Storage and Firestore', async () => {
  for (const uid of ['inactive', 'disabled', 'expired', 'future', 'malformed', 'none']) {
    await assertFails(uploadArea(uid, areaA, `${uid}.jpg`));
    await assertFails(listAll(ref(storage(uid), `flyerAssets/${areaA}`)));
    await assertFails(getDoc(doc(firestore(uid), 'flyerAssets', 'seed-asset')));
  }
});

test('RFC3339 offset dates behave consistently in Storage and Firestore', async () => {
  await assertSucceeds(uploadArea('offset', areaA, 'offset.jpg'));
  await assertSucceeds(getDoc(doc(firestore('offset'), 'flyerAssets', 'seed-asset')));
});

test('admin has complete access to area paths', async () => {
  await assertSucceeds(uploadArea('admin', areaA, 'support.jpg'));
  await assertSucceeds(deleteObject(areaFile('admin', areaA, 'support.jpg')));
});

test('legacy owner-scoped path is removed and denied even to admin', async () => {
  await assertFails(uploadBytes(
    ref(storage('writerA'), `flyerAssets/writerA/${areaA}/legacy.jpg`),
    jpeg,
    { contentType: 'image/jpeg' },
  ));
  await assertFails(uploadBytes(
    ref(storage('admin'), `flyerAssets/writerA/${areaA}/legacy-admin.jpg`),
    jpeg,
    { contentType: 'image/jpeg' },
  ));
});

test('upload validation rejects wrong types, extensions, empty, oversized and long names', async () => {
  await assertFails(uploadArea('writerA', areaA, 'bad.png', jpeg, 'image/png'));
  await assertFails(uploadArea('writerA', areaA, 'bad.exe', jpeg, 'image/jpeg'));
  await assertFails(uploadArea('writerA', areaA, 'empty.jpg', new Uint8Array(), 'image/jpeg'));
  await assertFails(uploadArea('writerA', areaA, 'huge.jpg', new Uint8Array(12 * 1024 * 1024 + 1), 'image/jpeg'));
  await assertFails(uploadArea('writerA', areaA, `${'x'.repeat(141)}.jpg`, jpeg, 'image/jpeg'));
});

test('anonymous users and unmatched paths are denied', async () => {
  const anonymous = env.unauthenticatedContext().storage(`gs://${bucket}`);
  await assertFails(uploadBytes(ref(anonymous, `flyerAssets/${areaA}/anon.jpg`), jpeg, { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(storage('writerA'), 'other/path.jpg'), jpeg, { contentType: 'image/jpeg' }));
});

test('Firestore flyer asset metadata must point to its own scope folder', async () => {
  const valid = {
    id: 'valid-area-asset',
    scopeType: 'reportingArea',
    scopeId: areaA,
    schema: 'dns.flyer-asset',
    version: 1,
    assetType: 'image',
    storagePath: `flyerAssets/${areaA}/metadata.jpg`,
    updatedBy: 'writerA',
    updatedAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(firestore('writerA'), 'flyerAssets', valid.id), valid));
  await assertFails(setDoc(doc(firestore('writerA'), 'flyerAssets', 'wrong-area'), {
    ...valid,
    id: 'wrong-area',
    storagePath: `flyerAssets/${areaB}/metadata.jpg`,
  }));
  await assertFails(setDoc(doc(firestore('writerA'), 'flyerAssets', 'legacy-path'), {
    ...valid,
    id: 'legacy-path',
    storagePath: `flyerAssets/writerA/${areaA}/metadata.jpg`,
  }));
});
