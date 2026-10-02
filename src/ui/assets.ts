export const DNS_ASSET_UI_RUNTIME_VERSION = '1.0.0' as const;

const STYLE_ID = 'dns-asset-ui-runtime-style';

export function initDNSAssetUIRuntime(documentRoot?: Document) {
  const root = documentRoot ?? (typeof document !== 'undefined' ? document : undefined);
  if (!root?.head || root.getElementById(STYLE_ID)) return;
  const style = root.createElement('style');
  style.id = STYLE_ID;
  style.textContent = [
    '.dns-asset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.75rem}',
    '.dns-asset-card{display:grid;grid-template-rows:minmax(110px,1fr) auto;min-width:0;border:1px solid var(--color-dns-border,rgba(65,116,131,.20));border-radius:var(--dns-card-radius,10px);background:#fff;overflow:hidden}',
    '.dns-asset-preview{display:grid;place-items:center;min-height:110px;padding:.8rem;background:var(--color-dns-bg,#F4F8F9)}',
    '.dns-asset-preview img,.dns-asset-preview svg{max-width:100%;max-height:120px;object-fit:contain}',
    '.dns-asset-meta{display:grid;gap:.2rem;padding:.65rem .7rem}',
    '.dns-asset-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 10px/1.35 var(--font-display,"Be Vietnam Pro",sans-serif);color:var(--color-dns-deep,#0D4D5E)}',
    '.dns-asset-detail{font:400 9px/1.35 var(--font-alt,Roboto,sans-serif);color:var(--color-dns-muted,#5A7F8A)}',
    '.dns-asset-card[aria-selected="true"]{border-color:var(--color-dns-mid,#417483);box-shadow:0 0 0 2px rgba(65,116,131,.10)}',
    '.dns-asset-usage{display:flex;flex-wrap:wrap;gap:.25rem}',
    '.dns-asset-usage-tag{padding:.15rem .35rem;border-radius:999px;background:rgba(170,208,209,.18);font:600 8px/1.2 var(--font-alt,Roboto,sans-serif);color:var(--color-dns-mid,#417483)}',
    '@media(max-width:767px){.dns-asset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  ].join('\n');
  root.head.appendChild(style);
}
