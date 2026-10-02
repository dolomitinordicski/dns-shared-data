export const DNS_FOOTER_RUNTIME_VERSION = '1.1.1' as const;
export const DNS_FOOTER_GRAPHIC_URL =
  'https://raw.githubusercontent.com/dolomitinordicski/dns-shared-data/release/v1.1.1/graphics/swoosh.svg' as const;

const STYLE_ID = 'dns-footer-runtime-style';

export interface DNSFooterRuntimeHandle {
  refresh(): void;
  disconnect(): void;
}

export function initDNSFooterRuntime(root?: Document): DNSFooterRuntimeHandle {
  const documentRoot = root ?? (typeof document !== 'undefined' ? document : undefined);
  if (!documentRoot) return { refresh() {}, disconnect() {} };

  if (!documentRoot.getElementById(STYLE_ID)) {
    const style = documentRoot.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
[data-dns-tool-footer] {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  min-height: 64px;
  background: var(--dns-footer-bg, #0D4D5E);
  color: var(--dns-footer-text, #FFFFFF);
}
[data-dns-tool-footer] > :not(.dns-footer-graphic) {
  position: relative;
  z-index: 1;
}
.dns-tool-footer-shell {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  max-width: var(--dns-shell-max-width, 1440px);
  min-height: 64px;
  margin-inline: auto;
  align-items: center;
  justify-content: space-between;
  gap: .75rem 1.5rem;
  padding: 1rem var(--dns-shell-padding-x, 32px);
}
.dns-tool-footer-primary {
  color: rgba(255,255,255,.82);
  font: 600 11px/1.35 var(--font-display,"Be Vietnam Pro",sans-serif);
  letter-spacing: .05em;
  text-transform: uppercase;
}
.dns-tool-footer-meta {
  max-width: calc(100% - 210px);
  color: rgba(255,255,255,.62);
  font: 400 10px/1.45 var(--font-alt,Roboto,sans-serif);
  letter-spacing: .04em;
  text-transform: uppercase;
  text-align: right;
}
.dns-footer-graphic {
  position: absolute;
  right: -18px;
  top: 50%;
  width: min(190px, 38vw);
  height: auto;
  z-index: 0;
  transform: translateY(-50%);
  pointer-events: none;
  user-select: none;
}
@media (max-width: 767px) {
  .dns-tool-footer-shell {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding-inline: var(--dns-shell-padding-x-mobile, 16px);
  }
  .dns-tool-footer-meta {
    max-width: calc(100% - 96px);
    text-align: left;
  }
  .dns-footer-graphic {
    right: -42px;
    top: 50%;
    width: 165px;
  }
}
@media print {
  .dns-footer-graphic { display: none !important; }
}
`;
    documentRoot.head.appendChild(style);
  }

  const refresh = () => {
    for (const footer of documentRoot.querySelectorAll<HTMLElement>('[data-dns-tool-footer]')) {
      if (footer.querySelector('.dns-footer-graphic')) continue;
      const image = documentRoot.createElement('img');
      image.src = DNS_FOOTER_GRAPHIC_URL;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.className = 'dns-footer-graphic';
      footer.appendChild(image);
    }
    documentRoot.documentElement.dataset.dnsFooterRuntime = DNS_FOOTER_RUNTIME_VERSION;
  };

  refresh();

  let observer: MutationObserver | null = null;
  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => refresh());
    observer.observe(documentRoot.documentElement, { childList: true, subtree: true });
  }

  return {
    refresh,
    disconnect() {
      observer?.disconnect();
      observer = null;
      delete documentRoot.documentElement.dataset.dnsFooterRuntime;
    },
  };
}
