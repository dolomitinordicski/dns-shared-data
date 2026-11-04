import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDigitalPassHandler } from '../server/digital-pass-http.mjs';

test('controlled deploy fails closed: registration is disabled before authentication or Firestore access', async () => {
  const handler = createDigitalPassHandler({
    db: null, auth: null, hmacSecret: 'test-only-secret-with-at-least-thirty-two-bytes',
    allowedOrigins: ['https://example.test'], inventoryRevision: 'pilot-test',
    validFrom: 1, validUntil: 2000000000000, noticeVersion: 'test-v1'
    // registrationEnabled intentionally omitted: must default to false
  });
  const headers = new Map();
  const req = { method: 'POST', path: '/v1/pass-registrations/complete', get: key => undefined };
  const res = {
    set: (name, value) => { headers.set(name, value); return res; },
    status: code => { res.statusCode = code; return res; },
    json: body => { res.body = body; return res; }
  };
  await handler(req, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: 'REGISTRATION_DISABLED' });
  assert.equal(headers.get('Cache-Control'), 'no-store');
});
