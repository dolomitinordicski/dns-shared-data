import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/ui/accessibility.ts', import.meta.url), 'utf8');
const css = source.match(/style\.textContent = `([\s\S]*?)`;/)?.[1];
assert.ok(css, 'Foundation accessibility stylesheet must be present');

const light = css.match(/:root\s*\{([^}]*)\}/)?.[1];
const dark = css.match(/html\[data-dns-theme="dark"\]\s*\{([^}]*)\}/)?.[1];
assert.ok(light, 'light semantic tokens must be defined at root');
assert.ok(dark, 'dark semantic tokens must be defined under the existing theme selector');

const roles = [
  '--dns-theme-bg', '--dns-theme-surface', '--dns-theme-text',
  '--dns-theme-text-muted', '--dns-theme-border', '--dns-theme-surface-alt',
  '--dns-theme-control-bg', '--dns-theme-control-text',
];

for (const role of roles) {
  test(`${role} exists in both themes and has a distinct value`, () => {
    const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|\\n)\\s*${escaped}:\\s*([^;]+);`);
    const lightValue = light.match(pattern)?.[1]?.trim();
    const darkValue = dark.match(pattern)?.[1]?.trim();
    assert.ok(lightValue, `missing light ${role}`);
    assert.ok(darkValue, `missing dark ${role}`);
    assert.notEqual(lightValue, darkValue, `identical light/dark ${role}`);
  });
}

test('theme selection still supports system, light and dark', () => {
  assert.match(source, /theme: 'system' \| 'light' \| 'dark'/);
  assert.match(source, /settings\.theme === 'system'/);
  assert.match(source, /prefers-color-scheme: dark/);
  assert.match(source, /root\.dataset\.dnsTheme\s*=/);
});

test('theme settings remain persisted under the existing storage contract', () => {
  assert.match(source, /window\.localStorage\.getItem\(storageKey\)/);
  assert.match(source, /window\.localStorage\.setItem\(storageKey,/);
  assert.match(source, /window\.addEventListener\('storage', onStoredSettingsChange\)/);
});

test('embedded theme receiver is opt-in and validates parent source and origin', () => {
  assert.match(source, /themeParentOrigin\?: string/);
  assert.match(source, /event\.source !== window\.parent/);
  assert.match(source, /event\.origin !== options\.themeParentOrigin/);
  assert.match(source, /message\.type !== 'dns:theme:v1'/);
  assert.match(source, /theme !== 'system' && theme !== 'light' && theme !== 'dark'/);
  assert.match(source, /settings = \{ \.\.\.settings, theme \}/);
  assert.match(source, /removeEventListener\('message', onParentThemeMessage\)/);
});

test('Foundation forwards opt-in parent origin to deferred accessibility runtime', () => {
  const foundation = readFileSync(new URL('../src/foundation.ts', import.meta.url), 'utf8');
  assert.match(foundation, /interface DNSFoundationAccessibilityOptions[\s\S]*?themeParentOrigin\?: string/);
  assert.ok(foundation.includes('themeParentOrigin: options.themeParentOrigin'));
});

test('selected preference is distinct from the resolved visual theme', () => {
  assert.match(source, /root\.dataset\.dnsThemeChoice = settings\.theme/);
  assert.match(source, /root\.dataset\.dnsTheme = settings\.theme === 'system'/);
});
