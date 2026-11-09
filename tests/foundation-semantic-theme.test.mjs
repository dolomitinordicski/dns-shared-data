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
