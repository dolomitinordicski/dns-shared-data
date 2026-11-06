import assert from 'node:assert/strict';
import test from 'node:test';
import { preflightDNSPrintAssets } from '../src/ui/print-preflight.ts';

test('missing print sheet fails closed', async () => {
  const result = await preflightDNSPrintAssets(null);
  assert.equal(result.ready, false);
  assert.deepEqual(result.errors, ['print-sheet-missing']);
});

test('empty printable sheet passes without external assets', async () => {
  const sheet = {
    ownerDocument: { fonts: { ready: Promise.resolve() } },
    querySelectorAll: () => [],
  } as unknown as HTMLElement;
  const result = await preflightDNSPrintAssets(sheet);
  assert.equal(result.ready, true);
  assert.equal(result.imageCount, 0);
});

test('missing image source blocks print', async () => {
  const img = { getAttribute: () => null, naturalWidth: 0 };
  const sheet = {
    ownerDocument: {},
    querySelectorAll: (selector: string) => selector === 'img' ? [img] : [],
  } as unknown as HTMLElement;
  const result = await preflightDNSPrintAssets(sheet);
  assert.equal(result.ready, false);
  assert.ok(result.errors.includes('print-image-source-missing'));
});
