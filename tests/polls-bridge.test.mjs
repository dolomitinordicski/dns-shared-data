import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPollsBridgeHandler } from '../server/polls-bridge-http.mjs';

function environment({ permissions = ['events.read'], admin = false, revoked = false } = {}) {
  const events = [];
  const profile = { active: true, globalRoles: admin ? ['dns-admin'] : [] };
  const grant = { active: true, userId: 'u1', scopeType: 'network',
    scopeId: 'dolomiti-nordicski', permissions };
  const coreDb = { collection: name => ({ doc: id => ({
    get: async () => {
      const value = name === 'users' && id === 'u1' ? profile
        : name === 'accessGrants' && id === 'u1__network__dolomiti-nordicski' ? grant : null;
      return { exists: Boolean(value), data: () => value };
    },
  }) }) };
  const auth = { verifyIdToken: async (token, checkRevoked) => {
    assert.equal(checkRevoked, true);
    if (token !== 'valid' || revoked) throw Object.assign(new Error('Bad token'), { code: 'auth/id-token-revoked' });
    return { uid: 'u1' };
  } };
  const pollsDb = { collection: name => {
    assert.equal(name, 'events');
    return {
      limit: limit => {
        assert.equal(limit, 100);
        return { get: async () => ({ docs: events.map(e => ({ id: e.id, data: () => e })) }) };
      },
      doc: id => ({ create: async event => { events.push({ ...event, id }); } }),
    };
  } };
  const handler = createPollsBridgeHandler({
    auth, coreDb, pollsDb, allowedOrigins: ['https://dolomitinordicski.github.io'],
  });
  async function request({ action = 'events.list', event, token = 'valid', origin = 'https://dolomitinordicski.github.io',
    method = 'POST', extra = {} } = {}) {
    const req = {
      method, body: { action, ...(event === undefined ? {} : { event }), ...extra },
      get: header => ({ Origin: origin, Authorization: token ? 'Bearer ' + token : '' })[header] || '',
      is: type => type === 'application/json',
    };
    const response = { statusCode: 200, headers: {}, payload: undefined,
      set(name, value) { this.headers[name] = value; return this; },
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.payload = payload; return this; },
      end() { return this; },
    };
    await handler(req, response);
    return response;
  }
  return { request, events };
}

const event = { title: 'School Day', description: '', location: 'Toblach',
  startsAt: '2026-11-15T09:30', questions: [] };

test('Core permission is required and event list is bounded', async () => {
  const env = environment();
  const response = await env.request();
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload.events, []);
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.equal((await env.request({ action: 'events.create', event })).statusCode, 403);
});

test('DNS Core admin creates closed events only; client cannot override status or id', async () => {
  const env = environment({ admin: true });
  const created = await env.request({ action: 'events.create', event });
  assert.equal(created.statusCode, 201);
  assert.equal(created.payload.event.status, 'closed');
  assert.equal(created.payload.event.title, 'School Day');
  assert.match(created.payload.event.id, /^[0-9a-f-]{36}$/);
  assert.equal((await env.request({ action: 'events.create',
    event: { ...event, status: 'open', id: 'forged' } })).statusCode, 400);
  assert.equal((await env.request()).payload.events.length, 1);
});

test('network create grant does not grant participant access or unrelated actions', async () => {
  const env = environment({ permissions: ['events.manage'] });
  assert.equal((await env.request({ action: 'events.create', event })).statusCode, 201);
  assert.equal((await env.request({ action: 'registrations.list' })).statusCode, 400);
  assert.equal((await env.request({ action: 'events.list' })).statusCode, 403);
});

test('token revocation, missing bearer, wrong origins and method are denied', async () => {
  assert.equal((await environment({ revoked: true }).request()).statusCode, 401);
  assert.equal((await environment().request({ token: '' })).statusCode, 401);
  assert.equal((await environment().request({ origin: 'https://evil.example' })).statusCode, 403);
  assert.equal((await environment().request({ method: 'GET' })).statusCode, 405);
  assert.equal((await environment().request({ extra: { uid: 'admin' } })).statusCode, 400);
});

test('event validation prevents malformed questions, oversized fields and PII spoofing', async () => {
  const env = environment({ admin: true });
  for (const bad of [
    { ...event, title: ' ' }, { ...event, title: 'X'.repeat(161) },
    { ...event, questions: [{ id: '1', label: 'Question', type: 'select', required: false, options: [] }] },
    { ...event, questions: Array.from({ length: 9 }, (_, i) => ({
      id: String(i), label: 'q', type: 'text', required: false,
    })) },
    { ...event, createdAt: 'forged' },
  ]) assert.equal((await env.request({ action: 'events.create', event: bad })).statusCode, 400);
});
