import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateActivationCode, hashActivationCode, prepareActivation, confirmPossession } from '../server/digital-pass-activation.mjs';

class MemoryDb {
  constructor() { this.values = new Map(); }
  collection(name) { return { doc: id => ({ key: name + '/' + id }) }; }
  async runTransaction(fn) {
    const staged = [];
    const tx = {
      get: async ref => ({ exists: this.values.has(ref.key), data: () => this.values.get(ref.key) }),
      set: (ref, val) => staged.push(['set', ref.key, val]),
      update: (ref, val) => staged.push(['update', ref.key, val]),
      create: (ref, val) => staged.push(['create', ref.key, val]),
    };
    const answer = await fn(tx);
    for (const [op, key, val] of staged) {
      if (op === 'create' && this.values.has(key)) throw new Error('DUPLICATE');
      this.values.set(key, op === 'update' ? { ...this.values.get(key), ...val } : val);
    }
    return answer;
  }
}
const assignment = { physicalPassId: 'season2026-dns-1234', organizationId: 'toblach',
  seasonId: '2026-27', productCode: 'sk-dns', eligibleForDnsSeasonPilot: true, sourceRevision: 'matrix-v1', printedNumber: '001234' };
const actor = { uid: 'operatorA', grants: [
  { organizationId: 'toblach', permissions: ['passActivation.issue', 'passPossession.attest'] },
] };
const hmacSecret = 'random-server-secret-from-secret-manager-not-client';

test('six-character uppercase human-readable activation code and keyed verifier', () => {
  for (let i = 0; i < 100; i++) assert.match(generateActivationCode(), /^[A-HJ-NP-Z2-9]{6}$/);
  assert.notEqual(hashActivationCode('K7PM2R', 'passA', hmacSecret),
    hashActivationCode('K7PM2R', 'passB', hmacSecret));
});

test('prepare and Validate attest sale atomically, without storing plaintext', async () => {
  const db = new MemoryDb();
  const a = await prepareActivation({ db, actor, passNumber: '1234',
    seasonId: '2026-27', productCode: 'sk-dns',
    resolveAssignment: async () => assignment, hmacSecret, now: 1000 });
  assert.equal(a.code.length, 6);
  const record = db.values.get('passActivationChallenges/' + assignment.physicalPassId);
  assert.equal(record.code, undefined);
  assert.equal(record.status, 'PREPARED');
  await assert.rejects(prepareActivation({ db, actor, passNumber: '1234',
    seasonId: '2026-27', productCode: 'sk-dns',
    resolveAssignment: async () => assignment, hmacSecret, now: 1001 }), /PREPARATION_ALREADY_EXISTS/);
  const first = await confirmPossession({ db, actor, physicalPassId: assignment.physicalPassId, preparationId: db.values.get('passActivationChallenges/' + assignment.physicalPassId)?.nonce, now: 1100 });
  assert.equal(first.alreadyValidated, false);
  const second = await confirmPossession({ db, actor, physicalPassId: assignment.physicalPassId, preparationId: db.values.get('passActivationChallenges/' + assignment.physicalPassId)?.nonce, now: 1101 });
  assert.equal(second.alreadyValidated, true);
  assert.equal(db.values.get('passActivationChallenges/' + assignment.physicalPassId).status, 'ENABLED');
});

test('wrong organization cannot issue or validate; cannot Validate expired preparation', async () => {
  const db = new MemoryDb();
  const wrong = { uid: 'other', grants: [
    { organizationId: 'other', permissions: ['passActivation.issue', 'passPossession.attest'] },
  ] };
  await assert.rejects(prepareActivation({ db, actor: wrong, passNumber: '1234',
    seasonId: '2026-27', productCode: 'sk-dns',
    resolveAssignment: async () => assignment, hmacSecret }), /FORBIDDEN/);
  await prepareActivation({ db, actor, passNumber: '1234',
    seasonId: '2026-27', productCode: 'sk-dns',
    resolveAssignment: async () => assignment, hmacSecret, now: 1000 });
  await assert.rejects(confirmPossession({ db, actor: wrong,
    physicalPassId: assignment.physicalPassId, preparationId: db.values.get('passActivationChallenges/' + assignment.physicalPassId)?.nonce, now: 1100 }), /FORBIDDEN/);
  await assert.rejects(confirmPossession({ db, actor,
    physicalPassId: assignment.physicalPassId, preparationId: db.values.get('passActivationChallenges/' + assignment.physicalPassId)?.nonce, now: 1000 + 11 * 60 * 1000 }), /INVALID_PREPARATION/);
});



test('instructor matrix assignments can be prepared without seasonal-pass privilege leakage', async () => {
  const db = new MemoryDb();
  const instructor = { ...assignment, physicalPassId:'ski-instructor-pass-1234',
    organizationId:'ski-school', productCode:'sk-instructor', passDesign:'dns-ski-instructor', eligibleForDnsSeasonPilot:false,
    eligibleForDigitalPass:true };
  const prepared = await prepareActivation({ db, actor:{uid:'instructor-operator',grants:[
    {organizationId:'ski-school',permissions:['passActivation.issue','passPossession.attest']},
  ]}, passNumber:'1234', seasonId:'2026-27', productCode:'sk-instructor',
  resolveAssignment:async()=>instructor, hmacSecret, now:2000 });
  assert.equal(db.values.get('passActivationChallenges/'+instructor.physicalPassId).productCode,'sk-instructor');
  assert.equal(prepared.physicalPassId,instructor.physicalPassId);
});
