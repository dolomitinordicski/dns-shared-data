import { DNS_FOUNDATION_RELEASE_VERSION } from '../version.js';

export const DNS_FOOTER_RUNTIME_VERSION = '1.3.0' as const;
export const DNS_FOOTER_GRAPHIC_URL =
  `https://raw.githubusercontent.com/dolomitinordicski/dns-shared-data/foundation-v${DNS_FOUNDATION_RELEASE_VERSION}/graphics/swoosh.svg` as const;

const STYLE_ID = 'dns-footer-runtime-style';
const DNS_WIKI_URL = 'https://dolomitinordicski.github.io/dns-wiki/';

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
  border-top: 1px solid var(--dns-footer-border, rgba(255,255,255,.14));
  background: linear-gradient(115deg, #0A2934 0%, #123D4B 55%, #235365 100%);
  color: var(--dns-footer-text, #FFFFFF);
}
[data-dns-tool-footer]::before {\n  content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;\n  background: linear-gradient(125deg, transparent 64%, rgba(190,225,228,.07) 64%, rgba(190,225,228,.07) 77%, transparent 77%);\n}\n[data-dns-tool-footer] > :not(.dns-footer-graphic) {
  position: relative;
  z-index: 1;
}
.dns-tool-footer-shell {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  max-width: var(--dns-shell-max-width, 1440px);
  min-height: 64px;
  min-width: 0;
  margin-inline: auto;
  align-items: center;
  justify-content: space-between;
  gap: .75rem 1.5rem;
  padding: 1rem var(--dns-shell-padding-x, 32px);
}
.dns-tool-footer-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: .5rem 1rem;
  min-width: 0;
  color: rgba(255,255,255,.86);
  font: 500 11px/1.4 var(--font-alt,Roboto,sans-serif);
}
.dns-tool-footer-links a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.dns-tool-footer-links a:focus-visible {
  outline: 2px solid #AAD0D1;
  outline-offset: 3px;
}
.dns-tool-footer-version { opacity: .78; white-space: nowrap; }
.dns-tool-footer-primary {
  min-width: 0;
  color: rgba(255,255,255,.90);
  font: 600 11px/1.35 var(--font-display,"Be Vietnam Pro",sans-serif);
  letter-spacing: .05em;
  text-transform: uppercase;
}
.dns-tool-footer-meta {
  min-width: 0;
  max-width: min(65%, 680px);
  color: rgba(255,255,255,.78);
  font: 400 10px/1.45 var(--font-alt,Roboto,sans-serif);
  letter-spacing: .04em;
  text-transform: uppercase;
  text-align: right;
}
.dns-footer-graphic {
  position: absolute;
  right: -18px;
  top: 50%;
  width: min(230px, 42vw);\n  opacity: .23;
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
  .dns-tool-footer-links { justify-content: flex-start; }
  .dns-tool-footer-meta {
    max-width: 100%;
    text-align: left;
  }
  .dns-footer-graphic {
    right: -42px;
    top: 50%;
    width: 165px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dns-tool-footer-shell { scroll-behavior: auto; }
}
@media print {
  .dns-footer-graphic { display: none !important; }
}
`;
    documentRoot.head.appendChild(style);
  }

  const labels: Record<string, { guide: string; support: string }> = {
    it: { guide: 'Guida', support: 'Supporto' },
    de: { guide: 'Anleitung', support: 'Support' },
    en: { guide: 'Help', support: 'Support' },
  };
  const refresh = () => {
    for (const footer of documentRoot.querySelectorAll<HTMLElement>('[data-dns-tool-footer]')) {
      const lang = (footer.dataset.dnsLang || documentRoot.documentElement.lang || 'it').slice(0, 2).toLowerCase();
      const label = labels[lang] ?? labels.it;
      let links = footer.querySelector<HTMLElement>('.dns-tool-footer-links');
      if (!links) {
        links = documentRoot.createElement('div');
        links.className = 'dns-tool-footer-links';
        links.dataset.dnsFoundationGenerated = 'true';
        footer.querySelector('.dns-tool-footer-shell')?.appendChild(links);
      }
      if (links?.dataset.dnsFoundationGenerated === 'true') {
        const tool = footer.dataset.dnsToolName || '';
        const version = footer.dataset.dnsToolVersion || '';
        const guideUrl = footer.dataset.dnsGuideUrl || DNS_WIKI_URL;
        const guideEnabled = footer.dataset.dnsGuideEnabled !== 'false';
        const subject = `[DNS Support] ${tool || 'DNS Tool'}${version ? ` | v${version}` : ''} | Foundation v${DNS_FOUNDATION_RELEASE_VERSION}`;
        const signature = JSON.stringify([lang, tool, version, guideUrl, guideEnabled, DNS_FOUNDATION_RELEASE_VERSION]);
        if (links.dataset.dnsFooterSignature !== signature) {
        links.dataset.dnsFooterSignature = signature;
        links.replaceChildren();
        if (guideEnabled && guideUrl.startsWith('https://')) {
          const guide = documentRoot.createElement('a');
          guide.href = guideUrl; guide.target = '_blank'; guide.rel = 'noopener noreferrer';
          guide.textContent = label.guide; links.appendChild(guide);
        }
        const support = documentRoot.createElement('a');
        support.href = `mailto:info@dolomitinordicski.com?subject=${encodeURIComponent(subject)}`;
        support.textContent = label.support; links.appendChild(support);
        const meta = documentRoot.createElement('span');
        meta.className = 'dns-tool-footer-version';
        meta.textContent = `${tool}${tool && version ? ' · ' : ''}${version ? `v${version} · ` : ''}Foundation v${DNS_FOUNDATION_RELEASE_VERSION}`;
        links.appendChild(meta);
        }
      }
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
