export const DNS_FOOTER_RUNTIME_VERSION = '1.0.0' as const;
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
}
[data-dns-tool-footer] > :not(.dns-footer-graphic) {
  position: relative;
  z-index: 1;
}
.dns-footer-graphic {
  position: absolute;
  right: -24px;
  bottom: -72px;
  width: min(220px, 42vw);
  height: auto;
  z-index: 0;
  pointer-events: none;
  user-select: none;
}
@media (max-width: 767px) {
  .dns-footer-graphic {
    right: -54px;
    bottom: -62px;
    width: 180px;
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
