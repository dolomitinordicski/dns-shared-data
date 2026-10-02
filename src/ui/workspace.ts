import { DNS_WORKSPACE_CONTRACT } from '../workspace.js';

export const DNS_WORKSPACE_RUNTIME_VERSION = '1.0.0' as const;

const STYLE_ID = 'dns-workspace-runtime-style';

export interface DNSWorkspaceRuntimeHandle {
  setInspectorState(state: 'open' | 'collapsed' | 'hidden'): void;
  setMobilePanelOpen(open: boolean): void;
  refresh(): void;
  disconnect(): void;
}

export function initDNSWorkspaceRuntime(documentRoot?: Document): DNSWorkspaceRuntimeHandle {
  const root = documentRoot ?? (typeof document !== 'undefined' ? document : undefined);
  if (!root?.documentElement) {
    return { setInspectorState() {}, setMobilePanelOpen() {}, refresh() {}, disconnect() {} };
  }

  if (!root.getElementById(STYLE_ID)) {
    const style = root.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      ':root{--dns-workspace-inspector-min:'+DNS_WORKSPACE_CONTRACT.desktopInspectorMinPx+'px;--dns-workspace-inspector-max:'+DNS_WORKSPACE_CONTRACT.desktopInspectorMaxPx+'px}',
      '[data-dns-workspace-layout]{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto minmax(0,1fr);min-width:0;min-height:0;height:100%}',
      '[data-dns-workspace-toolbar]{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:.45rem;min-width:0;padding:.55rem .7rem;border-bottom:1px solid var(--color-dns-border,rgba(65,116,131,.20));background:#fff}',
      '[data-dns-workspace-canvas]{position:relative;min-width:0;min-height:0;overflow:auto;background:var(--color-dns-bg,#F4F8F9)}',
      '[data-dns-workspace-inspector]{width:clamp(var(--dns-workspace-inspector-min),28vw,var(--dns-workspace-inspector-max));min-width:var(--dns-workspace-inspector-min);overflow:auto;border-left:1px solid var(--color-dns-border,rgba(65,116,131,.20));background:#fff}',
      '[data-dns-workspace-inspector][data-state="collapsed"]{width:48px;min-width:48px}',
      '[data-dns-workspace-inspector][data-state="hidden"]{display:none}',
      '[data-dns-workspace-mobile-panel]{display:none}',
      '.dns-workspace-toolbar-group{display:flex;align-items:center;gap:.35rem}',
      '.dns-workspace-toolbar-spacer{flex:1 1 auto}',
      '.dns-workspace-section{padding:.8rem;border-bottom:1px solid var(--color-dns-subtle-border,rgba(65,116,131,.08))}',
      '.dns-workspace-section-title{margin:0 0 .55rem;font:700 9px/1.3 var(--font-alt,Roboto,sans-serif);letter-spacing:.06em;text-transform:uppercase;color:var(--color-dns-mid,#417483)}',
      '@media(max-width:'+DNS_WORKSPACE_CONTRACT.mobileBreakpointPx+'px){[data-dns-workspace-layout]{grid-template-columns:minmax(0,1fr)}[data-dns-workspace-inspector]{display:none}[data-dns-workspace-mobile-panel][data-dns-open="true"]{display:block;position:fixed;left:0;right:0;bottom:0;z-index:11500;max-height:72vh;overflow:auto;border-radius:14px 14px 0 0;background:#fff;box-shadow:0 -12px 36px rgba(13,77,94,.16)}}',
    ].join('\n');
    root.head.appendChild(style);
  }

  const refresh = () => {
    root.documentElement.dataset.dnsWorkspaceRuntime = DNS_WORKSPACE_RUNTIME_VERSION;
  };
  refresh();

  return {
    setInspectorState(state) {
      const inspector = root.querySelector<HTMLElement>('[data-dns-workspace-inspector]');
      if (inspector) inspector.dataset.state = state;
    },
    setMobilePanelOpen(open) {
      const panel = root.querySelector<HTMLElement>('[data-dns-workspace-mobile-panel]');
      if (panel) panel.dataset.dnsOpen = open ? 'true' : 'false';
    },
    refresh,
    disconnect() {
      delete root.documentElement.dataset.dnsWorkspaceRuntime;
    },
  };
}
