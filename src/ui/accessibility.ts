import { initDNSContentPatterns } from './content-patterns.js';

export const DNS_ACCESSIBILITY_RUNTIME_VERSION = '1.2.0' as const;

export type DNSAccessibilityLanguage = 'de' | 'it';

export interface DNSAccessibilitySettings {
  textScale: 100 | 115 | 130;
  highContrast: boolean;
  relaxedSpacing: boolean;
  reduceMotion: boolean;
  strongFocus: boolean;
  comfortableDensity: boolean;
  grid: boolean;
  largeReadingText: boolean;
}

export interface DNSAccessibilityRuntimeOptions {
  mountTarget?: HTMLElement | null;
  language?: DNSAccessibilityLanguage;
  storageKey?: string;
  settings?: Partial<DNSAccessibilitySettings>;
}

export const DNS_ACCESSIBILITY_DEFAULTS: DNSAccessibilitySettings = {
  textScale: 100,
  highContrast: false,
  relaxedSpacing: false,
  reduceMotion: false,
  strongFocus: false,
  comfortableDensity: false,
  grid: false,
  largeReadingText: false,
};

const STYLE_ID = 'dns-accessibility-runtime-style';

const COPY = {
  de: {
    open: 'Barrierefreiheit',
    title: 'Barrierefreiheit',
    kicker: 'DNS Foundation',
    textSize: 'Textgröße',
    standard: 'Standard',
    medium: 'Größer',
    large: 'Sehr groß',
    highContrast: 'Hoher Kontrast',
    relaxedSpacing: 'Mehr Textabstand',
    reduceMotion: 'Bewegung reduzieren',
    strongFocus: 'Fokus verstärken',
    comfortableDensity: 'Komfortable Dichte',
    grid: 'Grid',
    largeReadingText: 'Sehr großer Lesetext',
    reset: 'Zurücksetzen',
    close: 'Schließen',
    local: 'Einstellungen werden nur in diesem Browser gespeichert.',
  },
  it: {
    open: 'Accessibilità',
    title: 'Accessibilità',
    kicker: 'DNS Foundation',
    textSize: 'Dimensione testo',
    standard: 'Standard',
    medium: 'Più grande',
    large: 'Molto grande',
    highContrast: 'Contrasto elevato',
    relaxedSpacing: 'Spaziatura testo',
    reduceMotion: 'Riduci movimento',
    strongFocus: 'Focus rinforzato',
    comfortableDensity: 'Densità confortevole',
    grid: 'Grid',
    largeReadingText: 'Testo di lettura molto grande',
    reset: 'Ripristina',
    close: 'Chiudi',
    local: 'Le preferenze vengono salvate solo in questo browser.',
  },
} as const;

function normalizeSettings(input: Partial<DNSAccessibilitySettings> = {}): DNSAccessibilitySettings {
  const scale = input.textScale === 115 || input.textScale === 130 ? input.textScale : 100;
  return {
    ...DNS_ACCESSIBILITY_DEFAULTS,
    ...input,
    textScale: scale,
  };
}

function readStoredSettings(storageKey: string): DNSAccessibilitySettings {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return DNS_ACCESSIBILITY_DEFAULTS;
    return normalizeSettings(JSON.parse(raw) as Partial<DNSAccessibilitySettings>);
  } catch {
    return DNS_ACCESSIBILITY_DEFAULTS;
  }
}

function writeStoredSettings(storageKey: string, settings: DNSAccessibilitySettings) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // The runtime remains functional for the current session.
  }
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
:root {
  --dns-a11y-text-scale: 1;
  --dns-a11y-focus-width: var(--dns-focus-width, 2px);
  --dns-a11y-focus-offset: var(--dns-focus-offset, 2px);
}
html.dns-a11y-text-scale { font-size: calc(100% * var(--dns-a11y-text-scale)); }
html.dns-a11y-high-contrast {
  --color-dns-deep: #000000;
  --color-dns-mid: #000000;
  --color-dns-muted: #000000;
  --color-dns-dark-text: #000000;
  --color-dns-border: rgba(0,0,0,.58);
  --color-dns-subtle-border: rgba(0,0,0,.30);
}
html.dns-a11y-high-contrast body { background: #fff; }
html.dns-a11y-high-contrast :is(.dns-card, input, select, textarea, button) {
  border-color: rgba(13,77,94,.48) !important;
}
html.dns-a11y-relaxed-spacing :is(p, li, td, th, label) {
  line-height: 1.65 !important;
  letter-spacing: .015em;
}
/* DNS Foundation v1.16: tables use a subtle alternating Deep Glacier Blue tint by default. */
table tbody tr:nth-child(even) > :is(td, th) {
  background: var(--dns-table-row-alt, rgba(170,208,209,.18));
}
html.dns-a11y-reduce-motion *,
html.dns-a11y-reduce-motion *::before,
html.dns-a11y-reduce-motion *::after {
  scroll-behavior: auto !important;
  animation-duration: .01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: .01ms !important;
}
html.dns-a11y-strong-focus :is(button, a[href], input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid var(--color-dns-light, #AAD0D1) !important;
  outline-offset: 3px !important;
  box-shadow: 0 0 0 1px var(--color-dns-deep, #0D4D5E) !important;
}
html.dns-a11y-comfort-density :is(button, input, select, textarea) { min-height: 44px; }
html.dns-a11y-comfort-density :is(th, td) { padding-top: .75rem !important; padding-bottom: .75rem !important; }
html.dns-a11y-grid table { border-collapse: collapse !important; }
html.dns-a11y-grid :is(table, th, td) { border-color: var(--dns-table-grid-strong, rgba(65,116,131,.42)) !important; }
html.dns-a11y-grid :is(th, td) { border-width: 1px !important; border-style: solid !important; }
html.dns-a11y-large-reading-text :is(.dns-readable-copy, .dns-insight-body, .dns-alert-body, .analytics-editorial-summary p, .analytics-methodology p, .analytics-assumption-note) {
  font-size: var(--dns-reading-text-large-size, 16px) !important;
  line-height: var(--dns-reading-text-large-line-height, 1.7) !important;
  letter-spacing: .005em;
}

.dns-a11y-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  min-height: 30px;
  border: 1px solid rgba(255,255,255,.30);
  border-radius: var(--dns-control-radius, 6px);
  background: transparent;
  color: #fff;
  cursor: pointer;
  font: 700 11px/1 var(--font-alt, Roboto, sans-serif);
  letter-spacing: .02em;
}
.dns-a11y-trigger:hover,
.dns-a11y-trigger[aria-expanded="true"] {
  border-color: var(--color-dns-light, #AAD0D1);
  background: rgba(170,208,209,.16);
}
.dns-a11y-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  justify-items: end;
  align-items: stretch;
  background: rgba(8,52,63,.34);
}
.dns-a11y-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: transparent;
  cursor: default;
}
.dns-a11y-panel {
  position: relative;
  z-index: 1;
  width: min(390px, 100vw);
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid var(--color-dns-border, rgba(65,116,131,.20));
  background: var(--color-dns-surface, #fff);
  color: var(--color-dns-deep, #0D4D5E);
  box-shadow: -8px 0 30px rgba(13,77,94,.15);
  font-family: var(--font-display, "Be Vietnam Pro", sans-serif);
}
.dns-a11y-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--color-dns-subtle-border, rgba(65,116,131,.08));
  padding: 1.2rem;
}
.dns-a11y-panel-kicker {
  color: var(--color-dns-mid, #417483);
  font: 700 9px/1.2 var(--font-alt, Roboto, sans-serif);
  letter-spacing: .08em;
  text-transform: uppercase;
}
.dns-a11y-panel-title { margin: .25rem 0 0; font-size: 20px; font-weight: 600; }
.dns-a11y-close {
  width: 32px; height: 32px;
  border: 1px solid var(--color-dns-border, rgba(65,116,131,.20));
  border-radius: var(--dns-control-radius, 6px);
  background: transparent;
  color: var(--color-dns-deep, #0D4D5E);
  cursor: pointer;
}
.dns-a11y-body { display: grid; gap: 1.1rem; padding: 1.2rem; }
.dns-a11y-section {
  display: grid;
  gap: .55rem;
  border-bottom: 1px solid var(--color-dns-subtle-border, rgba(65,116,131,.08));
  padding-bottom: 1rem;
}
.dns-a11y-section:last-of-type { border-bottom: 0; }
.dns-a11y-label {
  color: var(--color-dns-mid, #417483);
  font: 700 9px/1.2 var(--font-alt, Roboto, sans-serif);
  letter-spacing: .07em;
  text-transform: uppercase;
}
.dns-a11y-scale {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .4rem;
}
.dns-a11y-scale button,
.dns-a11y-reset {
  border: 1px solid var(--color-dns-border, rgba(65,116,131,.20));
  border-radius: var(--dns-control-radius, 6px);
  background: var(--color-dns-bg, #F4F8F9);
  color: var(--color-dns-deep, #0D4D5E);
  cursor: pointer;
  padding: .65rem .55rem;
  font-size: 10px;
  font-weight: 600;
}
.dns-a11y-scale button[aria-pressed="true"] {
  border-color: var(--color-dns-mid, #417483);
  background: var(--color-dns-light, #AAD0D1);
}
.dns-a11y-toggle {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 1rem;
  min-height: 42px;
  border-bottom: 1px solid var(--color-dns-subtle-border, rgba(65,116,131,.08));
  padding: .45rem 0;
  font-size: 12px;
}
.dns-a11y-toggle:last-child { border-bottom: 0; }
.dns-a11y-toggle input { width: 18px; height: 18px; accent-color: var(--color-dns-mid, #417483); }
.dns-a11y-local {
  color: var(--color-dns-muted, #5A7F8A);
  font: 400 9px/1.5 var(--font-alt, Roboto, sans-serif);
}
@media (max-width: 640px) {
  .dns-a11y-overlay { align-items: end; }
  .dns-a11y-panel {
    width: 100vw;
    height: min(82svh, 680px);
    border-top: 1px solid var(--color-dns-border, rgba(65,116,131,.20));
    border-left: 0;
    border-radius: 12px 12px 0 0;
  }
}
`;
  document.head.appendChild(style);
}

function applySettings(settings: DNSAccessibilitySettings) {
  const root = document.documentElement;
  root.style.setProperty('--dns-a11y-text-scale', String(settings.textScale / 100));
  root.classList.toggle('dns-a11y-text-scale', settings.textScale !== 100);
  root.classList.toggle('dns-a11y-high-contrast', settings.highContrast);
  root.classList.toggle('dns-a11y-relaxed-spacing', settings.relaxedSpacing);
  root.classList.toggle('dns-a11y-reduce-motion', settings.reduceMotion);
  root.classList.toggle('dns-a11y-strong-focus', settings.strongFocus);
  root.classList.toggle('dns-a11y-comfort-density', settings.comfortableDensity);
  root.classList.toggle('dns-a11y-grid', settings.grid);
  root.classList.toggle('dns-a11y-large-reading-text', settings.largeReadingText);
  root.dataset.dnsA11yTextScale = String(settings.textScale);
}

export function initDNSAccessibilityRuntime(options: DNSAccessibilityRuntimeOptions = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      getSettings: () => normalizeSettings(options.settings),
      setSettings: () => {},
      togglePanel: () => {},
      setLanguage: () => {},
      disconnect: () => {},
    };
  }

  ensureStyles();
  initDNSContentPatterns();

  const storageKey = options.storageKey ?? 'dns-accessibility-v1';
  let language: DNSAccessibilityLanguage = options.language === 'it' ? 'it' : 'de';
  let settings = normalizeSettings({
    ...readStoredSettings(storageKey),
    ...(options.settings ?? {}),
  });
  let overlay: HTMLDivElement | null = null;
  let lastFocused: HTMLElement | null = null;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'dns-a11y-trigger';
  trigger.textContent = 'Aa';
  trigger.setAttribute('aria-expanded', 'false');

  const mountTarget = options.mountTarget ?? document.body;
  mountTarget.appendChild(trigger);

  const sync = () => {
    applySettings(settings);
    writeStoredSettings(storageKey, settings);
    trigger.title = COPY[language].open;
    trigger.setAttribute('aria-label', COPY[language].open);
  };

  const updatePanel = () => {
    if (!overlay) return;
    const c = COPY[language];
    const panel = overlay.querySelector<HTMLElement>('.dns-a11y-panel');
    if (!panel) return;

    panel.innerHTML = `
      <div class="dns-a11y-panel-header">
        <div>
          <div class="dns-a11y-panel-kicker">${c.kicker}</div>
          <h2 id="dns-a11y-title" class="dns-a11y-panel-title">${c.title}</h2>
        </div>
        <button type="button" class="dns-a11y-close" aria-label="${c.close}">×</button>
      </div>
      <div class="dns-a11y-body">
        <section class="dns-a11y-section">
          <div class="dns-a11y-label">${c.textSize}</div>
          <div class="dns-a11y-scale">
            <button type="button" data-scale="100" aria-pressed="${settings.textScale === 100}">${c.standard}</button>
            <button type="button" data-scale="115" aria-pressed="${settings.textScale === 115}">${c.medium}</button>
            <button type="button" data-scale="130" aria-pressed="${settings.textScale === 130}">${c.large}</button>
          </div>
        </section>
        <section class="dns-a11y-section">
          ${[
            ['highContrast', c.highContrast],
            ['relaxedSpacing', c.relaxedSpacing],
            ['reduceMotion', c.reduceMotion],
            ['strongFocus', c.strongFocus],
            ['comfortableDensity', c.comfortableDensity],
            ['grid', c.grid],
            ['largeReadingText', c.largeReadingText],
          ].map(([key, label]) => `
            <label class="dns-a11y-toggle">
              <span>${label}</span>
              <input type="checkbox" data-setting="${key}" ${settings[key as keyof DNSAccessibilitySettings] ? 'checked' : ''}>
            </label>
          `).join('')}
        </section>
        <button type="button" class="dns-a11y-reset">${c.reset}</button>
        <div class="dns-a11y-local">${c.local}<br>Alt + A · Esc</div>
      </div>
    `;

    panel.querySelector('.dns-a11y-close')?.addEventListener('click', closePanel);
    panel.querySelector('.dns-a11y-reset')?.addEventListener('click', () => {
      settings = { ...DNS_ACCESSIBILITY_DEFAULTS };
      sync();
      updatePanel();
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-scale]').forEach((button) => {
      button.addEventListener('click', () => {
        const scale = Number(button.dataset.scale);
        settings = { ...settings, textScale: scale === 115 ? 115 : scale === 130 ? 130 : 100 };
        sync();
        updatePanel();
      });
    });
    panel.querySelectorAll<HTMLInputElement>('[data-setting]').forEach((input) => {
      input.addEventListener('change', () => {
        const key = input.dataset.setting as keyof DNSAccessibilitySettings;
        if (key === 'textScale' || !key) return;
        settings = { ...settings, [key]: input.checked };
        sync();
      });
    });
  };

  function openPanel() {
    if (overlay) return;
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlay = document.createElement('div');
    overlay.className = 'dns-a11y-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'dns-a11y-title');
    overlay.innerHTML = '<button type="button" class="dns-a11y-backdrop" aria-label="Close"></button><div class="dns-a11y-panel" tabindex="-1"></div>';
    document.body.appendChild(overlay);
    trigger.setAttribute('aria-expanded', 'true');
    overlay.querySelector('.dns-a11y-backdrop')?.addEventListener('click', closePanel);
    updatePanel();
    overlay.querySelector<HTMLElement>('.dns-a11y-panel')?.focus();
  }

  function closePanel() {
    overlay?.remove();
    overlay = null;
    trigger.setAttribute('aria-expanded', 'false');
    lastFocused?.focus();
  }

  function togglePanel() {
    if (overlay) closePanel();
    else openPanel();
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) return;

    if (event.altKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      togglePanel();
    } else if (event.key === 'Escape' && overlay) {
      event.preventDefault();
      closePanel();
    }
  };

  trigger.addEventListener('click', togglePanel);
  window.addEventListener('keydown', handleKeyDown);
  sync();

  return {
    getSettings: () => ({ ...settings }),
    setSettings(next: Partial<DNSAccessibilitySettings>) {
      settings = normalizeSettings({ ...settings, ...next });
      sync();
      updatePanel();
    },
    togglePanel,
    setLanguage(next: DNSAccessibilityLanguage) {
      language = next === 'it' ? 'it' : 'de';
      sync();
      updatePanel();
    },
    disconnect() {
      closePanel();
      trigger.removeEventListener('click', togglePanel);
      window.removeEventListener('keydown', handleKeyDown);
      trigger.remove();
    },
  };
}
