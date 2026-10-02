export const DNS_IDENTITY_UI_RUNTIME_VERSION = '1.0.0' as const;

const STYLE_ID = 'dns-identity-ui-runtime-style';

export function initDNSIdentityUIRuntime(documentRoot?: Document) {
  const root = documentRoot ?? (typeof document !== 'undefined' ? document : undefined);
  if (!root?.head || root.getElementById(STYLE_ID)) return;

  const style = root.createElement('style');
  style.id = STYLE_ID;
  style.textContent = [
    '.dns-account-context{display:flex;align-items:center;gap:.65rem;min-width:0;color:#fff}',
    '.dns-account-avatar{display:grid;place-items:center;flex:0 0 auto;width:32px;height:32px;border:1px solid rgba(255,255,255,.28);border-radius:50%;background:rgba(255,255,255,.08);font:700 10px/1 var(--font-alt,Roboto,sans-serif);color:#fff}',
    '.dns-account-meta{display:grid;min-width:0;gap:.1rem}',
    '.dns-account-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 10px/1.25 var(--font-display,"Be Vietnam Pro",sans-serif);color:#fff}',
    '.dns-account-secondary{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:400 9px/1.25 var(--font-alt,Roboto,sans-serif);color:rgba(255,255,255,.65)}',
    '.dns-organization-context{display:flex;align-items:center;gap:.5rem;min-width:0}',
    '.dns-organization-switcher{min-width:180px;max-width:320px;height:34px;padding:.35rem 2rem .35rem .55rem;border:1px solid rgba(255,255,255,.26);border-radius:var(--dns-control-radius,6px);background:rgba(255,255,255,.08);color:#fff;font:500 10px/1 var(--font-alt,Roboto,sans-serif)}',
    '.dns-organization-switcher option{color:#0D4D5E;background:#fff}',
    '.dns-membership-role{display:inline-flex;align-items:center;min-height:22px;padding:.2rem .45rem;border:1px solid rgba(170,208,209,.30);border-radius:999px;color:#AAD0D1;font:600 8px/1 var(--font-alt,Roboto,sans-serif);letter-spacing:.05em;text-transform:uppercase}',
    '.dns-access-indicator{display:inline-flex;align-items:center;gap:.35rem;min-height:24px;padding:.25rem .5rem;border:1px solid var(--dns-access-border,rgba(65,116,131,.20));border-radius:999px;background:var(--dns-access-bg,#fff);color:var(--dns-access-text,#417483);font:600 9px/1 var(--font-alt,Roboto,sans-serif)}',
    '.dns-access-indicator::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}',
    '.dns-access-indicator[data-state="allowed"]{--dns-access-bg:rgba(15,110,86,.07);--dns-access-text:#0F6E56;--dns-access-border:rgba(15,110,86,.20)}',
    '.dns-access-indicator[data-state="restricted"]{--dns-access-bg:rgba(154,106,22,.08);--dns-access-text:#9A6A16;--dns-access-border:rgba(154,106,22,.20)}',
    '.dns-access-indicator[data-state="no-access"],.dns-access-indicator[data-state="inactive"]{--dns-access-bg:rgba(153,60,29,.08);--dns-access-text:#993C1D;--dns-access-border:rgba(153,60,29,.20)}',
    '.dns-access-state{display:grid;gap:.65rem;padding:1rem;border:1px solid var(--color-dns-border,rgba(65,116,131,.20));border-radius:var(--dns-card-radius,10px);background:#fff}',
    '.dns-access-state[data-state="restricted"]{border-left:4px solid #9A6A16}',
    '.dns-access-state[data-state="no-access"],.dns-access-state[data-state="inactive"]{border-left:4px solid #993C1D}',
    '.dns-access-state-title{margin:0;font:700 12px/1.35 var(--font-display,"Be Vietnam Pro",sans-serif);color:var(--color-dns-deep,#0D4D5E)}',
    '.dns-access-state-copy{margin:0;font:400 11px/1.55 var(--font-alt,Roboto,sans-serif);color:var(--color-dns-muted,#5A7F8A)}',
    '.dns-session-action{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:.45rem .6rem;border:1px solid rgba(255,255,255,.24);border-radius:var(--dns-control-radius,6px);background:transparent;color:#fff;font:600 9px/1 var(--font-display,"Be Vietnam Pro",sans-serif);cursor:pointer}',
    '.dns-session-action:hover{background:rgba(255,255,255,.08)}',
    '@media(max-width:767px){.dns-account-secondary,.dns-membership-role{display:none}.dns-organization-switcher{min-width:0;max-width:52vw}}',
  ].join('\n');
  root.head.appendChild(style);
}
