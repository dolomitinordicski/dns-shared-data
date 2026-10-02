export const DNS_FOOTER_RUNTIME_VERSION = '1.1.0' as const;
export const DNS_FOOTER_GRAPHIC_URL =
  'https://dolomitinordicski.github.io/dns-shared-data/graphics/swoosh.svg' as const;

const STYLE_ID = 'dns-footer-runtime-style';

export function initDNSFooterRuntime(root?: Document) {
  const documentRoot = root ?? (typeof document !== 'undefined' ? document : undefined);
  if (!documentRoot) return;

  if (!documentRoot.getElementById(STYLE_ID)) {
    const style = documentRoot.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
[data-dns-tool-footer] {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  min-height: 64px;
}
[data-dns-tool-footer] > :not(.dns-footer-graphic) {
  position: relative;
  z-index: 1;
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
}
