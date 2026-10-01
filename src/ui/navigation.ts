import { DNS_DESIGN_SYSTEM } from '../design-system.js';

type WidenToken<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T extends readonly (infer U)[] ? readonly WidenToken<U>[] :
  T extends object ? { [K in keyof T]: WidenToken<T[K]> } :
  T;

export type DNSNavigationTokens = WidenToken<typeof DNS_DESIGN_SYSTEM.navigation>;
export type DNSResponsiveTokens = WidenToken<typeof DNS_DESIGN_SYSTEM.responsive>;

export interface DNSNavigationRuntimeOptions {
  root?: Document;
  header: HTMLElement;
  nav: HTMLElement;
  progressTrack?: HTMLElement | null;
  progressBar?: HTMLElement | null;
  sectionTabs?: readonly HTMLElement[];
  sectionElements?: readonly HTMLElement[];
  navigation?: DNSNavigationTokens;
  responsive?: DNSResponsiveTokens;
  activeClassName?: string;
  activationOffsetPx?: number;
  onActiveSectionChange?: (id: string) => void;
}

export interface DNSNavigationRuntimeHandle {
  refresh(): void;
  setActiveSection(id: string): void;
  disconnect(): void;
}

const STYLE_ID = 'dns-navigation-runtime-style';

function setNavigationVariables(
  root: HTMLElement,
  navigation: DNSNavigationTokens,
) {
  const tabs = navigation.tabs;
  root.style.setProperty('--dns-tab-bg', tabs.containerBackground);
  root.style.setProperty('--dns-tab-text', tabs.textColor);
  root.style.setProperty('--dns-tab-active', tabs.activeTextColor);
  root.style.setProperty('--dns-tab-hover', tabs.hoverTextColor);
  root.style.setProperty('--dns-tab-indicator', tabs.activeIndicatorColor);
  root.style.setProperty('--dns-tab-indicator-width', `${tabs.activeIndicatorWidthPx}px`);
  root.style.setProperty('--dns-tab-size', `${tabs.fontSizePx}px`);
  root.style.setProperty('--dns-tab-weight', String(tabs.fontWeight));
  root.style.setProperty('--dns-tab-tracking', `${tabs.letterSpacingEm}em`);
  root.style.setProperty('--dns-nav-surface-bg', tabs.surfaceBackground ?? tabs.containerBackground);
  root.style.setProperty('--dns-nav-backdrop-blur', `${tabs.backdropBlurPx ?? 0}px`);
  root.style.setProperty('--dns-scroll-progress-height', `${tabs.scrollProgress?.heightPx ?? 0}px`);
  root.style.setProperty('--dns-scroll-progress-color', tabs.scrollProgress?.color ?? '#AAD0D1');
  root.style.setProperty('--dns-scroll-progress-track', tabs.scrollProgress?.track ?? 'transparent');
}

function ensureNavigationStyles(
  documentRoot: Document,
  navigation: DNSNavigationTokens,
  responsive: DNSResponsiveTokens,
) {
  let style = documentRoot.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = documentRoot.createElement('style');
    style.id = STYLE_ID;
    documentRoot.head.appendChild(style);
  }

  const desktop = responsive.breakpointsPx.desktopMin;
  const mobileMax = responsive.breakpointsPx.mobileMax;

  style.textContent = `
.dns-tab-nav {
  position: sticky;
  top: var(--dns-header-height, 0px);
  z-index: 25;
  background: var(--dns-nav-surface-bg);
  backdrop-filter: blur(var(--dns-nav-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--dns-nav-backdrop-blur));
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.dns-scroll-progress-track {
  position: relative;
  width: 100%;
  height: var(--dns-scroll-progress-height);
  overflow: hidden;
  background: var(--dns-scroll-progress-track);
}

.dns-scroll-progress-bar {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--dns-scroll-progress-color);
  transform: scaleX(0);
  transform-origin: left center;
  will-change: transform;
}

.dns-tab-nav-inner {
  display: flex;
  align-items: center;
  min-width: max-content;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.dns-tab {
  flex: 0 0 auto;
  border: 0;
  border-bottom: var(--dns-tab-indicator-width) solid transparent;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  color: var(--dns-tab-text);
  font-size: var(--dns-tab-size);
  font-weight: var(--dns-tab-weight);
  letter-spacing: var(--dns-tab-tracking);
  text-transform: uppercase;
  white-space: nowrap;
  transition:
    color ${navigation.tabs.transitionMs}ms ease,
    border-color ${navigation.tabs.transitionMs}ms ease;
}

.dns-tab:hover {
  color: var(--dns-tab-hover);
}

.dns-tab-active {
  color: var(--dns-tab-active);
  border-bottom-color: var(--dns-tab-indicator);
}

@media (min-width: ${desktop}px) {
  .dns-tab-nav {
    overflow: visible;
  }
  .dns-tab-nav-inner {
    min-width: 0;
    flex-wrap: wrap;
    padding-top: .18rem;
    padding-bottom: .18rem;
  }
}

@media (max-width: ${desktop - 1}px) {
  .dns-tab-nav {
    overflow-x: auto;
    overflow-y: hidden;
  }
  .dns-tab-nav-inner {
    min-width: max-content;
    flex-wrap: nowrap;
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (max-width: ${mobileMax}px) {
  .dns-tab-nav {
    scroll-snap-type: x proximity;
  }
  .dns-tab-nav-inner {
    padding-left: .9rem;
    padding-right: .9rem;
  }
  .dns-tab {
    scroll-snap-align: start;
  }
}
`;
}

function pageTop(element: HTMLElement) {
  return element.getBoundingClientRect().top + window.scrollY;
}

export function initDNSNavigationRuntime(
  options: DNSNavigationRuntimeOptions,
): DNSNavigationRuntimeHandle {
  const documentRoot =
    options.root ?? (typeof document !== 'undefined' ? document : undefined);

  if (!documentRoot || typeof window === 'undefined') {
    return {
      refresh() {},
      setActiveSection() {},
      disconnect() {},
    };
  }

  const navigation = options.navigation ?? DNS_DESIGN_SYSTEM.navigation;
  const responsive = options.responsive ?? DNS_DESIGN_SYSTEM.responsive;
  const activeClassName = options.activeClassName ?? 'dns-tab-active';
  const activationOffsetPx = options.activationOffsetPx ?? 16;
  const tabs = Array.from(options.sectionTabs ?? []);
  const sections = Array.from(options.sectionElements ?? []);

  setNavigationVariables(documentRoot.documentElement, navigation);
  ensureNavigationStyles(documentRoot, navigation, responsive);

  let frame = 0;
  let activeId = '';
  let stickyObserver: ResizeObserver | null = null;

  const updateStickyMetrics = () => {
    const headerHeight = Math.ceil(options.header.getBoundingClientRect().height);
    const navHeight = Math.ceil(options.nav.getBoundingClientRect().height);
    const root = documentRoot.documentElement;
    root.style.setProperty('--dns-header-height', `${headerHeight}px`);
    root.style.setProperty('--dns-sticky-stack-height', `${headerHeight + navHeight}px`);
  };

  const setActiveSection = (id: string) => {
    if (!id || id === activeId) return;
    activeId = id;

    tabs.forEach((tab) => {
      const isActive = tab.dataset.section === id;
      tab.classList.toggle(activeClassName, isActive);
      if (isActive) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });

    options.onActiveSectionChange?.(id);
  };

  const updateProgress = () => {
    if (!options.progressBar && !options.progressTrack) return;
    const maxScroll = Math.max(1, documentRoot.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    if (options.progressBar) options.progressBar.style.transform = `scaleX(${ratio})`;
    options.progressTrack?.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  };

  const updateActiveSection = () => {
    if (!sections.length) return;

    const headerHeight = options.header.getBoundingClientRect().height;
    const navHeight = options.nav.getBoundingClientRect().height;
    const activationLine = window.scrollY + headerHeight + navHeight + activationOffsetPx;

    let candidate = sections[0];
    for (const section of sections) {
      if (pageTop(section) <= activationLine) candidate = section;
      else break;
    }

    const atBottom =
      window.scrollY + window.innerHeight >=
      documentRoot.documentElement.scrollHeight - 2;

    if (atBottom) candidate = sections[sections.length - 1];

    if (candidate?.id) setActiveSection(candidate.id);
  };

  const refreshNow = () => {
    frame = 0;
    updateStickyMetrics();
    updateProgress();
    updateActiveSection();
  };

  const requestRefresh = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(refreshNow);
  };

  stickyObserver = new ResizeObserver(requestRefresh);
  stickyObserver.observe(options.header);
  stickyObserver.observe(options.nav);

  window.addEventListener('scroll', requestRefresh, { passive: true });
  window.addEventListener('resize', requestRefresh);
  window.addEventListener('load', requestRefresh);

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.section;
      if (id) setActiveSection(id);
    });
  });

  requestRefresh();

  return {
    refresh: requestRefresh,
    setActiveSection,
    disconnect() {
      stickyObserver?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestRefresh);
      window.removeEventListener('resize', requestRefresh);
      window.removeEventListener('load', requestRefresh);
    },
  };
}
