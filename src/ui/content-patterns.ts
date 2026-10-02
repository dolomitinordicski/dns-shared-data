export const DNS_CONTENT_PATTERNS_VERSION = '1.0.0' as const;

const STYLE_ID = 'dns-content-patterns-style';

export function initDNSContentPatterns() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.dns-insight,
.dns-alert {
  --dns-message-accent: var(--color-dns-mid, #417483);
  --dns-message-bg: #fff;
  display: grid;
  grid-template-columns: 30px minmax(0,1fr);
  gap: .8rem;
  align-items: start;
  margin: 1rem 0;
  border: 1px solid var(--color-dns-border, rgba(65,116,131,.20));
  border-left: 4px solid var(--dns-message-accent);
  border-radius: var(--dns-card-radius, 10px);
  background: var(--dns-message-bg);
  padding: .9rem 1rem;
  color: var(--color-dns-deep, #0D4D5E);
  box-shadow: var(--dns-card-shadow, 0 1px 4px rgba(13,77,94,.07));
}
.dns-insight::before {
  content: "";
  width: 26px;
  height: 26px;
  border: 1.5px solid var(--dns-message-accent);
  border-radius: 5px;
  background:
    linear-gradient(var(--dns-message-accent),var(--dns-message-accent)) 6px 7px/12px 1.5px no-repeat,
    linear-gradient(var(--dns-message-accent),var(--dns-message-accent)) 6px 12px/8px 1.5px no-repeat,
    linear-gradient(var(--dns-message-accent),var(--dns-message-accent)) 6px 17px/11px 1.5px no-repeat;
  opacity: .9;
}
.dns-insight-title,
.dns-alert-title {
  margin: 0 0 .2rem;
  font-family: var(--font-display, "Be Vietnam Pro", sans-serif);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: .05em;
  text-transform: uppercase;
}
.dns-insight-body,
.dns-alert-body {
  margin: 0;
  font-family: var(--font-alt, Roboto, sans-serif);
  font-size: 12px;
  line-height: 1.6;
}
.dns-insight {
  --dns-message-accent: var(--color-dns-light, #AAD0D1);
  --dns-message-bg: var(--color-dns-deep, #0D4D5E);
  border-color: transparent;
  color: #fff;
}
.dns-insight .dns-insight-title { color: var(--color-dns-light, #AAD0D1); }
.dns-insight .dns-insight-body { color: #fff; }
.dns-insight-body > :first-child,
.dns-alert-body > :first-child { margin-top: 0; }
.dns-insight-body > :last-child,
.dns-alert-body > :last-child { margin-bottom: 0; }
.dns-insight-body p,
.dns-alert-body p { margin: 0 0 .35rem; }

.dns-alert { grid-template-columns: 24px minmax(0,1fr); }
.dns-alert::before {
  content: "!";
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  color: var(--dns-message-accent);
  font: 700 12px/1 var(--font-alt, Roboto, sans-serif);
}
.dns-alert[data-variant="info"] {
  --dns-message-accent: var(--color-dns-mid, #417483);
  --dns-message-bg: rgba(170,208,209,.12);
}
.dns-alert[data-variant="success"] {
  --dns-message-accent: #0F6E56;
  --dns-message-bg: rgba(15,110,86,.06);
}
.dns-alert[data-variant="warning"] {
  --dns-message-accent: #9A6A16;
  --dns-message-bg: rgba(154,106,22,.07);
}
.dns-alert[data-variant="error"] {
  --dns-message-accent: #993C1D;
  --dns-message-bg: rgba(153,60,29,.07);
}
@media (max-width:640px) {
  .dns-insight,.dns-alert { grid-template-columns: 26px minmax(0,1fr); padding:.8rem; gap:.65rem; }
}
`;
  document.head.appendChild(style);
}
