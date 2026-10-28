import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDNSAccessibilityThemeEarly } from '../src/ui/accessibility.ts';

function withBrowser(stored: string | null, osDark: boolean, run: (element: { dataset: Record<string, string> }) => void) {
  const previousWindow = (globalThis as any).window;
  const previousDocument = (globalThis as any).document;
  const element = { dataset: {} as Record<string, string> };
  (globalThis as any).window = {
    localStorage: { getItem: () => stored },
    matchMedia: () => ({ matches: osDark }),
  };
  (globalThis as any).document = { documentElement: element };
  try { run(element); } finally {
    if (previousWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = previousWindow;
    if (previousDocument === undefined) delete (globalThis as any).document;
    else (globalThis as any).document = previousDocument;
  }
}

test('SSR bootstrap is safe', () => {
  assert.equal(applyDNSAccessibilityThemeEarly(), 'light');
});

test('OS preference is used only without an explicit stored theme', () => {
  withBrowser(null, true, el => {
    assert.equal(applyDNSAccessibilityThemeEarly(), 'dark');
    assert.equal(el.dataset.dnsTheme, 'dark');
  });
  withBrowser(JSON.stringify({ theme: 'light' }), true, el => {
    assert.equal(applyDNSAccessibilityThemeEarly(), 'light');
    assert.equal(el.dataset.dnsTheme, 'light');
  });
});

test('invalid stored theme falls back to OS preference', () => {
  withBrowser(JSON.stringify({ theme: 'invalid' }), true, el => {
    assert.equal(applyDNSAccessibilityThemeEarly(), 'dark');
    assert.equal(el.dataset.dnsTheme, 'dark');
  });
  withBrowser('{bad', false, el => {
    assert.equal(applyDNSAccessibilityThemeEarly(), 'light');
    assert.equal(el.dataset.dnsTheme, 'light');
  });
});
