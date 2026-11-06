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


test('unresolved font readiness fails closed within timeout', async () => {
  const sheet = {
    ownerDocument: { fonts: { ready: new Promise<void>(() => {}) } },
    querySelectorAll: () => [],
  } as unknown as HTMLElement;
  const result = await preflightDNSPrintAssets(sheet, 5);
  assert.equal(result.ready, false);
  assert.ok(result.errors.includes('print-fonts-not-ready'));
});

test('unresolved image decode fails closed within timeout', async () => {
  const img = {
    getAttribute: () => 'https://example.test/logo.png',
    decode: () => new Promise<void>(() => {}),
    naturalWidth: 0,
  };
  const sheet = {
    ownerDocument: {},
    querySelectorAll: (selector: string) => selector === 'img' ? [img] : [],
  } as unknown as HTMLElement;
  const result = await preflightDNSPrintAssets(sheet, 5);
  assert.equal(result.ready, false);
  assert.ok(result.errors.includes('print-image-load-failed'));
});


test('loaded image and dimensioned SVG pass preflight', async () => {
  const img = {
    getAttribute: (key: string) => key === 'src' ? '/logo.png' : null,
    decode: async () => {},
    naturalWidth: 120,
  };
  const svg = { getAttribute: (key: string) => key === 'viewBox' ? '0 0 100 100' : null };
  const sheet = {
    ownerDocument: { fonts: { ready: Promise.resolve() } },
    querySelectorAll: (selector: string) => selector === 'img' ? [img] : selector === 'svg' ? [svg] : [],
  } as unknown as HTMLElement;
  const result = await preflightDNSPrintAssets(sheet);
  assert.equal(result.ready, true);
  assert.equal(result.imageCount, 1);
  assert.equal(result.svgCount, 1);
  assert.deepEqual(result.warnings, []);
});

test('SVG without dimensions warns without blocking print', async () => {
  const svg = { getAttribute: () => null };
  const sheet = {
    ownerDocument: {},
    querySelectorAll: (selector: string) => selector === 'svg' ? [svg] : [],
  } as unknown as HTMLElement;
  const result = await preflightDNSPrintAssets(sheet);
  assert.equal(result.ready, true);
  assert.deepEqual(result.warnings, ['print-svg-dimensions-unverified']);
});

test('failed image does not suppress empty-image error on another image', async () => {
  const images = [
    { getAttribute: () => '/broken.png', decode: async () => { throw new Error('broken'); }, naturalWidth: 0 },
    { getAttribute: () => '/empty.png', decode: async () => {}, naturalWidth: 0 },
  ];
  const sheet = {
    ownerDocument: {},
    querySelectorAll: (selector: string) => selector === 'img' ? images : [],
  } as unknown as HTMLElement;
  const result = await preflightDNSPrintAssets(sheet);
  assert.equal(result.ready, false);
  assert.ok(result.errors.includes('print-image-load-failed'));
  assert.ok(result.errors.includes('print-image-empty'));
});
