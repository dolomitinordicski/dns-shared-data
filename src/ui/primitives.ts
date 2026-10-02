import { translateDNSFoundation, type DNSUILanguage } from '../localization.js';
import { openDNSOverlay } from './overlay.js';

export const DNS_UI_PRIMITIVES_VERSION = '1.0.0' as const;

export type DNSStatus = 'draft' | 'live' | 'locked' | 'ready' | 'warning' | 'error' | 'archived' | 'synced';
export type DNSAlertVariant = 'info' | 'success' | 'warning' | 'error';
export type DNSButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'icon';
export type DNSEmptyState = 'loading' | 'empty' | 'error' | 'offline' | 'unauthorized' | 'forbidden' | 'not-found' | 'saving' | 'saved' | 'syncing' | 'stale';

const STYLE_ID = 'dns-ui-primitives-style';
const TOAST_ROOT_ID = 'dns-toast-root';

export function initDNSUIPrimitives() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.dns-status{display:inline-flex;align-items:center;gap:.4rem;min-height:22px;padding:.2rem .5rem;border:1px solid var(--dns-status-border,rgba(65,116,131,.20));border-radius:999px;background:var(--dns-status-bg,#fff);color:var(--dns-status-text,var(--color-dns-mid,#417483));font:600 9px/1 var(--font-alt,Roboto,sans-serif);letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
.dns-status::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.85}
.dns-status[data-status="draft"]{--dns-status-bg:rgba(90,127,138,.08);--dns-status-text:#5A7F8A}
.dns-status[data-status="live"],.dns-status[data-status="ready"],.dns-status[data-status="synced"]{--dns-status-bg:rgba(15,110,86,.07);--dns-status-text:#0F6E56;--dns-status-border:rgba(15,110,86,.20)}
.dns-status[data-status="locked"]{--dns-status-bg:rgba(13,77,94,.08);--dns-status-text:#0D4D5E}
.dns-status[data-status="warning"]{--dns-status-bg:rgba(154,106,22,.08);--dns-status-text:#9A6A16;--dns-status-border:rgba(154,106,22,.20)}
.dns-status[data-status="error"]{--dns-status-bg:rgba(153,60,29,.08);--dns-status-text:#993C1D;--dns-status-border:rgba(153,60,29,.20)}
.dns-status[data-status="archived"]{--dns-status-bg:rgba(49,49,49,.06);--dns-status-text:#666;--dns-status-border:rgba(49,49,49,.15)}

.dns-state{display:grid;justify-items:center;gap:.55rem;min-height:150px;padding:1.4rem;border:1px dashed var(--color-dns-border,rgba(65,116,131,.20));border-radius:var(--dns-card-radius,10px);background:#fff;text-align:center}
.dns-state-icon{width:34px;height:34px;border:1px solid var(--color-dns-light,#AAD0D1);border-radius:50%;display:grid;place-items:center;color:var(--color-dns-mid,#417483);font-weight:700}
.dns-state-title{font-size:12px;font-weight:700;color:var(--color-dns-deep,#0D4D5E)}
.dns-state-copy{max-width:520px;margin:0;color:var(--color-dns-muted,#5A7F8A);font:400 11px/1.55 var(--font-alt,Roboto,sans-serif)}
.dns-state[data-state="error"] .dns-state-icon{color:#993C1D;border-color:rgba(153,60,29,.30)}
.dns-state[data-state="offline"] .dns-state-icon{color:#9A6A16;border-color:rgba(154,106,22,.30)}
.dns-state[data-state="loading"] .dns-state-icon{border-style:dotted;animation:dns-spin 1.2s linear infinite}
@keyframes dns-spin{to{transform:rotate(360deg)}}

.dns-button{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;min-height:36px;padding:.55rem .8rem;border:1px solid transparent;border-radius:var(--dns-control-radius,6px);font:600 10px/1 var(--font-display,"Be Vietnam Pro",sans-serif);letter-spacing:.04em;text-decoration:none;cursor:pointer;transition:background-color 200ms ease,border-color 200ms ease,color 200ms ease,transform 200ms ease}
.dns-button[data-variant="primary"]{background:var(--color-dns-deep,#0D4D5E);color:#fff}
.dns-button[data-variant="primary"]:hover{background:var(--color-dns-mid,#417483)}
.dns-button[data-variant="secondary"]{background:#fff;color:var(--color-dns-deep,#0D4D5E);border-color:var(--color-dns-border,rgba(65,116,131,.20))}
.dns-button[data-variant="secondary"]:hover{background:var(--color-dns-bg,#F4F8F9)}
.dns-button[data-variant="tertiary"]{background:transparent;color:var(--color-dns-mid,#417483);padding-left:.35rem;padding-right:.35rem}
.dns-button[data-variant="danger"]{background:#993C1D;color:#fff}
.dns-button[data-variant="icon"]{width:36px;padding:0;background:#fff;color:var(--color-dns-deep,#0D4D5E);border-color:var(--color-dns-border,rgba(65,116,131,.20))}
.dns-button:disabled,.dns-button[aria-disabled="true"]{opacity:.5;cursor:not-allowed;transform:none}

.dns-field{display:grid;gap:.35rem}
.dns-field-label{color:var(--color-dns-mid,#417483);font:700 9px/1.3 var(--font-alt,Roboto,sans-serif);letter-spacing:.06em;text-transform:uppercase}
.dns-field-help{color:var(--color-dns-muted,#5A7F8A);font:400 9px/1.45 var(--font-alt,Roboto,sans-serif)}
.dns-input,.dns-select,.dns-textarea{width:100%;min-height:36px;border:1px solid var(--color-dns-border,rgba(65,116,131,.20));border-radius:var(--dns-control-radius,6px);background:#fff;color:var(--color-dns-deep,#0D4D5E);padding:.55rem .65rem;font:400 11px/1.4 var(--font-alt,Roboto,sans-serif);outline:none}
.dns-textarea{min-height:88px;resize:vertical}
.dns-input:focus,.dns-select:focus,.dns-textarea:focus{border-color:var(--color-dns-mid,#417483);box-shadow:0 0 0 2px rgba(65,116,131,.10)}
.dns-field[data-state="error"] :is(.dns-input,.dns-select,.dns-textarea){border-color:#993C1D}
.dns-field-error{color:#993C1D;font:500 9px/1.4 var(--font-alt,Roboto,sans-serif)}
.dns-input:disabled,.dns-select:disabled,.dns-textarea:disabled{background:#F4F8F9;color:#7A8C91;cursor:not-allowed}
.dns-input[readonly],.dns-textarea[readonly]{background:rgba(244,248,249,.65)}
.dns-check{display:inline-flex;align-items:center;gap:.5rem;font:400 11px/1.4 var(--font-alt,Roboto,sans-serif);color:var(--color-dns-deep,#0D4D5E)}
.dns-check input{width:17px;height:17px;accent-color:var(--color-dns-mid,#417483)}

.dns-table-wrap{width:100%;overflow-x:auto}
.dns-table{width:100%;border-collapse:separate;border-spacing:0;background:#fff;font-family:var(--font-alt,Roboto,sans-serif)}
.dns-table thead th{position:sticky;top:var(--dns-table-sticky-top,0);z-index:2;background:#fff;border-bottom:1px solid var(--dns-table-header-border,rgba(65,116,131,.20));padding:.55rem .6rem;color:var(--color-dns-mid,#417483);font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;text-align:left}
.dns-table tbody td,.dns-table tbody th{border-bottom:1px solid var(--dns-table-row-border,rgba(65,116,131,.08));padding:.5rem .6rem;font-size:11px}
.dns-table tbody tr:nth-child(even)>*{background:var(--dns-table-row-alt,rgba(170,208,209,.18))}
.dns-table .dns-num{text-align:right;font-variant-numeric:tabular-nums}
.dns-table .dns-total>*{font-weight:700;border-top:2px solid var(--color-dns-mid,#417483);background:rgba(170,208,209,.26)!important}
.dns-table .dns-subtotal>*{font-weight:600;border-top:1px solid var(--color-dns-mid,#417483)}
.dns-table tr[aria-selected="true"]>*{background:rgba(170,208,209,.38)!important}
.dns-table tr[data-dirty="true"]>*:first-child{box-shadow:inset 3px 0 0 #9A6A16}
.dns-table th[data-sort]{cursor:pointer}
.dns-table th[data-sort="asc"]::after{content:" ↑"}
.dns-table th[data-sort="desc"]::after{content:" ↓"}
.dns-table .dns-sticky-col{position:sticky;left:0;z-index:1;background:#fff}
.dns-table tbody tr:nth-child(even)>.dns-sticky-col{background:var(--dns-table-row-alt,rgba(170,208,209,.18))}

.dns-note,.dns-methodology,.dns-source,.dns-definition,.dns-help{border-radius:var(--dns-control-radius,6px);padding:.75rem .85rem;font:400 11px/1.55 var(--font-alt,Roboto,sans-serif)}
.dns-note{background:rgba(170,208,209,.14);color:var(--color-dns-deep,#0D4D5E)}
.dns-methodology{border:1px solid var(--color-dns-border,rgba(65,116,131,.20));background:#fff;color:var(--color-dns-muted,#5A7F8A)}
.dns-source{border-top:1px solid var(--color-dns-subtle-border,rgba(65,116,131,.08));border-radius:0;padding:.5rem 0 0;color:var(--color-dns-muted,#5A7F8A);font-size:9px;font-style:italic}
.dns-definition{border-left:3px solid var(--color-dns-light,#AAD0D1);background:#fff;color:var(--color-dns-deep,#0D4D5E)}
.dns-help{background:var(--color-dns-bg,#F4F8F9);color:var(--color-dns-muted,#5A7F8A)}

.dns-toolbar{display:flex;flex-wrap:wrap;align-items:end;gap:.7rem;margin:0 0 1rem}
.dns-toolbar-group{display:flex;flex-wrap:wrap;align-items:end;gap:.5rem}
.dns-context-select{background:var(--color-dns-light,#AAD0D1);color:var(--color-dns-deep,#0D4D5E);border:1px solid var(--color-dns-mid,#417483);font-weight:600}

.dns-modal-overlay{position:fixed;inset:0;z-index:11000;display:grid;place-items:center;padding:1rem;background:rgba(8,52,63,.42)}
.dns-modal{width:min(560px,100%);max-height:min(86vh,760px);overflow:auto;border-radius:var(--dns-card-radius,10px);background:#fff;box-shadow:0 18px 50px rgba(13,77,94,.22)}
.dns-modal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1rem 1.1rem;border-bottom:1px solid var(--color-dns-subtle-border,rgba(65,116,131,.08))}
.dns-modal-title{margin:0;font-size:16px;font-weight:600;color:var(--color-dns-deep,#0D4D5E)}
.dns-modal-body{padding:1rem 1.1rem;color:var(--color-dns-deep,#0D4D5E);font:400 12px/1.6 var(--font-alt,Roboto,sans-serif)}
.dns-modal-actions{display:flex;justify-content:flex-end;gap:.5rem;padding:.85rem 1.1rem;border-top:1px solid var(--color-dns-subtle-border,rgba(65,116,131,.08))}

#dns-toast-root{position:fixed;right:1rem;bottom:1rem;z-index:12000;display:grid;gap:.5rem;width:min(360px,calc(100vw - 2rem))}
.dns-toast{display:grid;grid-template-columns:auto 1fr auto;align-items:start;gap:.65rem;padding:.75rem .85rem;border:1px solid var(--color-dns-border,rgba(65,116,131,.20));border-left:4px solid var(--dns-toast-accent,var(--color-dns-mid,#417483));border-radius:var(--dns-control-radius,6px);background:#fff;box-shadow:0 8px 24px rgba(13,77,94,.14);font:400 11px/1.45 var(--font-alt,Roboto,sans-serif)}
.dns-toast[data-variant="success"]{--dns-toast-accent:#0F6E56}.dns-toast[data-variant="warning"]{--dns-toast-accent:#9A6A16}.dns-toast[data-variant="error"]{--dns-toast-accent:#993C1D}
.dns-toast button{border:0;background:transparent;color:var(--color-dns-muted,#5A7F8A);cursor:pointer}
@media(prefers-reduced-motion:reduce){.dns-state[data-state="loading"] .dns-state-icon{animation:none}}
`;
  document.head.appendChild(style);
}

export function showDNSToast(message: string, variant: DNSAlertVariant = 'info', timeoutMs = 3500) {
  if (typeof document === 'undefined') return;
  initDNSUIPrimitives();
  let root = document.getElementById(TOAST_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = TOAST_ROOT_ID;
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-atomic', 'false');
    document.body.appendChild(root);
  }
  const toast = document.createElement('div');
  toast.className = 'dns-toast';
  toast.dataset.variant = variant;
  toast.innerHTML = '<span aria-hidden="true">•</span><div></div><button type="button" aria-label="Close">×</button>';
  const body = toast.querySelector('div');
  if (body) body.textContent = message;
  const close = () => toast.remove();
  toast.querySelector('button')?.addEventListener('click', close);
  root.appendChild(toast);
  if (timeoutMs > 0) window.setTimeout(close, timeoutMs);
}

export interface DNSConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  language?: DNSUILanguage;
}

export function confirmDNSAction(options: DNSConfirmOptions): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  initDNSUIPrimitives();

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'dns-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'dns-modal';
    modal.setAttribute('role', 'dialog');

    const titleId = 'dns-modal-title-' + Date.now();
    modal.setAttribute('aria-labelledby', titleId);
    modal.innerHTML =
      '<div class="dns-modal-header"><h2 class="dns-modal-title" id="' + titleId + '"></h2></div>' +
      '<div class="dns-modal-body"></div>' +
      '<div class="dns-modal-actions">' +
      '<button type="button" class="dns-button" data-action="cancel" data-variant="secondary"></button>' +
      '<button type="button" class="dns-button" data-action="confirm" data-variant="' + (options.destructive ? 'danger' : 'primary') + '"></button>' +
      '</div>';

    const title = modal.querySelector('.dns-modal-title');
    const body = modal.querySelector('.dns-modal-body');
    const cancel = modal.querySelector<HTMLButtonElement>('[data-action="cancel"]');
    const confirm = modal.querySelector<HTMLButtonElement>('[data-action="confirm"]');
    const language = options.language ?? 'de';

    if (title) title.textContent = options.title;
    if (body) body.textContent = options.message;
    if (cancel) cancel.textContent = options.cancelLabel ?? translateDNSFoundation('action.cancel', language);
    if (confirm) confirm.textContent = options.confirmLabel ?? translateDNSFoundation('action.confirm', language);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    let settled = false;
    const done = (value: boolean) => {
      if (settled) return;
      settled = true;
      overlayHandle.disconnect();
      overlay.remove();
      resolve(value);
    };

    cancel?.addEventListener('click', () => done(false));
    confirm?.addEventListener('click', () => done(true));

    const overlayHandle = openDNSOverlay({
      type: 'confirm',
      element: overlay,
      initialFocus: confirm,
      closeOnBackdrop: true,
      onClose(reason) {
        if (reason !== 'programmatic') done(false);
      },
    });
  });
}
