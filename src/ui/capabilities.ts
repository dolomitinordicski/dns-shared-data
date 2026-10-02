export const DNS_CAPABILITY_UI_VERSION = '1.0.0' as const;

const STYLE_ID = 'dns-capability-ui-style';

export function initDNSCapabilityUIRuntime(documentRoot?: Document) {
  const root = documentRoot ?? (typeof document !== 'undefined' ? document : undefined);
  if (!root?.head || root.getElementById(STYLE_ID)) return;
  const style = root.createElement('style');
  style.id = STYLE_ID;
  style.textContent = [
    '.dns-capability-menu{display:flex;flex-wrap:wrap;align-items:center;gap:.45rem}',
    '.dns-capability-group{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem}',
    '.dns-capability-action{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;min-height:34px;padding:.45rem .65rem;border:1px solid var(--color-dns-border,rgba(65,116,131,.20));border-radius:var(--dns-control-radius,6px);background:#fff;color:var(--color-dns-deep,#0D4D5E);font:600 9px/1 var(--font-display,"Be Vietnam Pro",sans-serif);cursor:pointer}',
    '.dns-capability-action:hover{border-color:var(--color-dns-mid,#417483);background:rgba(170,208,209,.10)}',
    '.dns-capability-action[data-state="running"]{opacity:.72;cursor:progress}',
    '.dns-capability-action[data-state="success"]{border-color:rgba(15,110,86,.30);color:#0F6E56}',
    '.dns-capability-action[data-state="error"]{border-color:rgba(153,60,29,.30);color:#993C1D}',
    '.dns-capability-action[data-state="unavailable"],.dns-capability-action:disabled{opacity:.50;cursor:not-allowed}',
    '.dns-capability-badge{display:inline-flex;align-items:center;min-height:20px;padding:.15rem .38rem;border-radius:999px;background:rgba(170,208,209,.18);font:600 8px/1 var(--font-alt,Roboto,sans-serif);color:var(--color-dns-mid,#417483)}',
    '.dns-capability-status{font:500 9px/1.35 var(--font-alt,Roboto,sans-serif);color:var(--color-dns-muted,#5A7F8A)}',
    '@media(max-width:767px){.dns-capability-menu,.dns-capability-group{width:100%}.dns-capability-action{flex:1 1 auto}}',
  ].join('\n');
  root.head.appendChild(style);
}
