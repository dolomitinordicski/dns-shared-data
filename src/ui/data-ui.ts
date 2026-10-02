export const DNS_DATA_UI_RUNTIME_VERSION = '1.0.0' as const;

const STYLE_ID = 'dns-data-ui-runtime-style';

export function initDNSDataUIRuntime(documentRoot: Document = document) {
  if (!documentRoot?.head || documentRoot.getElementById(STYLE_ID)) return;

  const style = documentRoot.createElement('style');
  style.id = STYLE_ID;
  style.textContent = [
    '.dns-field[data-state="valid"] :is(.dns-input,.dns-select,.dns-textarea){border-color:#0F6E56}',
    '.dns-field[data-state="dirty"] :is(.dns-input,.dns-select,.dns-textarea){box-shadow:inset 3px 0 0 #9A6A16}',
    '.dns-field[data-state="saving"] :is(.dns-input,.dns-select,.dns-textarea){opacity:.72}',
    '.dns-field[data-state="saved"] :is(.dns-input,.dns-select,.dns-textarea){border-color:#0F6E56}',
    '.dns-field[data-required="true"] .dns-field-label::after{content:" *";color:#993C1D}',
    '.dns-field-status{font:500 9px/1.4 var(--font-alt,Roboto,sans-serif);color:var(--color-dns-muted,#5A7F8A)}',
    '.dns-field[data-state="error"] .dns-field-status{color:#993C1D}',
    '.dns-field[data-state="saved"] .dns-field-status{color:#0F6E56}',
    '.dns-upload{display:grid;gap:.65rem;padding:1rem;border:1px dashed var(--color-dns-border,rgba(65,116,131,.20));border-radius:var(--dns-card-radius,10px);background:#fff}',
    '.dns-upload[data-state="dragging"]{border-color:var(--color-dns-mid,#417483);background:rgba(170,208,209,.12)}',
    '.dns-upload[data-state="uploading"]{opacity:.78}',
    '.dns-upload[data-state="success"]{border-color:rgba(15,110,86,.38)}',
    '.dns-upload[data-state="error"]{border-color:rgba(153,60,29,.38)}',
    '.dns-upload[data-state="disabled"]{opacity:.55;pointer-events:none}',
    '.dns-upload-title{font:600 11px/1.35 var(--font-display,"Be Vietnam Pro",sans-serif);color:var(--color-dns-deep,#0D4D5E)}',
    '.dns-upload-copy{font:400 10px/1.5 var(--font-alt,Roboto,sans-serif);color:var(--color-dns-muted,#5A7F8A)}',
    '.dns-upload-progress{width:100%;height:5px;border:0;border-radius:999px;overflow:hidden;background:rgba(65,116,131,.12)}',
    '.dns-upload-progress::-webkit-progress-value{background:var(--color-dns-mid,#417483)}',
    '.dns-data-toolbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:space-between;margin:0 0 .8rem}',
    '.dns-data-toolbar-main,.dns-data-toolbar-actions{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}',
    '.dns-data-search{min-width:min(280px,100%)}',
    '.dns-data-count{font:500 9px/1.4 var(--font-alt,Roboto,sans-serif);color:var(--color-dns-muted,#5A7F8A)}',
    '.dns-bulk-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.7rem;padding:.65rem .75rem;margin:.5rem 0;border:1px solid rgba(65,116,131,.22);border-radius:var(--dns-control-radius,6px);background:rgba(170,208,209,.16)}',
    '.dns-pagination{display:flex;align-items:center;justify-content:flex-end;gap:.45rem;margin-top:.75rem}',
    '.dns-column-picker{min-width:180px}',
    '.dns-state[data-state="unauthorized"] .dns-state-icon,.dns-state[data-state="forbidden"] .dns-state-icon{color:#993C1D;border-color:rgba(153,60,29,.30)}',
    '.dns-state[data-state="not-found"] .dns-state-icon,.dns-state[data-state="stale"] .dns-state-icon{color:#9A6A16;border-color:rgba(154,106,22,.30)}',
    '.dns-state[data-state="saving"] .dns-state-icon,.dns-state[data-state="syncing"] .dns-state-icon{border-style:dotted;animation:dns-spin 1.2s linear infinite}',
    '.dns-state[data-state="saved"] .dns-state-icon{color:#0F6E56;border-color:rgba(15,110,86,.30)}',
    '.dns-drawer{position:fixed;top:0;right:0;bottom:0;z-index:11000;width:min(420px,92vw);background:#fff;box-shadow:-12px 0 36px rgba(13,77,94,.16);overflow:auto}',
    '.dns-popover,.dns-dropdown,.dns-menu{z-index:11500;border:1px solid var(--color-dns-border,rgba(65,116,131,.20));border-radius:var(--dns-control-radius,6px);background:#fff;box-shadow:0 8px 24px rgba(13,77,94,.14)}',
    '.dns-tooltip{z-index:11600;max-width:280px;padding:.4rem .55rem;border-radius:4px;background:#08343F;color:#fff;font:400 10px/1.4 var(--font-alt,Roboto,sans-serif)}',
    '.dns-blocking-overlay{position:fixed;inset:0;z-index:13000;display:grid;place-items:center;padding:1rem;background:rgba(8,52,63,.62)}',
    '@media(max-width:767px){.dns-data-toolbar{align-items:stretch}.dns-data-toolbar-main,.dns-data-toolbar-actions{width:100%}.dns-data-search{width:100%}}',
    '@media(prefers-reduced-motion:reduce){.dns-state[data-state="saving"] .dns-state-icon,.dns-state[data-state="syncing"] .dns-state-icon{animation:none}}',
  ].join('\n');
  documentRoot.head.appendChild(style);
}
