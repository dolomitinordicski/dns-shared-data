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
export type DNSHeaderTokens = WidenToken<typeof DNS_DESIGN_SYSTEM.header>;
export type DNSMotionTokens = WidenToken<typeof DNS_DESIGN_SYSTEM.motion>;

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
  headerTokens?: DNSHeaderTokens;
  motion?: DNSMotionTokens;
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
const NAVIGATION_INTENT_TIMEOUT_MS = 1200;

function setNavigationVariables(
  root: HTMLElement,
  navigation: DNSNavigationTokens,
  header: DNSHeaderTokens,
  motion: DNSMotionTokens,
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
  root.style.setProperty('--dns-header-reveal-duration', `${motion.headerReveal?.durationMs ?? motion.fastMs ?? 200}ms`);
  root.style.setProperty('--dns-header-reveal-easing', motion.headerReveal?.easing ?? motion.easing ?? 'ease');
  root.style.setProperty('--dns-header-hide-percent', String(header.scrollBehavior?.hiddenTranslatePercent ?? -100));
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
  const desktopTabs = responsive.tabs.desktop;
  const tabletTabs = responsive.tabs.tablet;
  const mobileTabs = responsive.tabs.mobile;

  style.textContent = `
.dns-foundation-header {
  position: sticky;
  top: 0;
  z-index: 30;
  transform: translateY(0);
  transition: transform var(--dns-header-reveal-duration, 220ms) var(--dns-header-reveal-easing, ease);
  will-change: transform;
}
.dns-foundation-header[data-dns-scroll-state="hidden"] {
  transform: translateY(calc(var(--dns-header-hide-percent, -100) * 1%));
}
.dns-tab-nav {
  position: sticky;
  top: var(--dns-header-visible-height, var(--dns-header-height, 0px));
  z-index: 25;
  background: var(--dns-nav-surface-bg);
  backdrop-filter: blur(var(--dns-nav-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--dns-nav-backdrop-blur));
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
  transition: top var(--dns-header-reveal-duration, 220ms) var(--dns-header-reveal-easing, ease);
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
  padding: ${desktopTabs.tabPaddingYRem}rem ${desktopTabs.tabPaddingXRem}rem calc(${desktopTabs.tabPaddingYRem}rem - .03rem);
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
  .dns-tab {
    padding: ${tabletTabs.tabPaddingYRem}rem ${tabletTabs.tabPaddingXRem}rem calc(${tabletTabs.tabPaddingYRem}rem - .03rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dns-foundation-header,
  .dns-tab-nav {
    transition-duration: 0ms !important;
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
    padding: ${mobileTabs.tabPaddingYRem}rem ${mobileTabs.tabPaddingXRem}rem calc(${mobileTabs.tabPaddingYRem}rem - .03rem);
    font-size: 10px;
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
  const headerTokens = options.headerTokens ?? DNS_DESIGN_SYSTEM.header;
  const motion = options.motion ?? DNS_DESIGN_SYSTEM.motion;
  const activeClassName = options.activeClassName ?? 'dns-tab-active';
  const activationOffsetPx = options.activationOffsetPx ?? 16;
  const tabs = Array.from(options.sectionTabs ?? []);
  const sections = Array.from(options.sectionElements ?? []);

  setNavigationVariables(documentRoot.documentElement, navigation, headerTokens, motion);
  ensureNavigationStyles(documentRoot, navigation, responsive);

  options.header.classList.add('dns-foundation-header');
  options.header.dataset.dnsScrollState = 'shown';

  let frame = 0;
  let activeId = '';
  let navigationIntentId = '';
  let navigationIntentTimer = 0;
  let stickyObserver: ResizeObserver | null = null;
  let lastScrollY = Math.max(0, window.scrollY);
  let headerVisible = true;

  const setHeaderVisible = (visible: boolean) => {
    if (headerVisible === visible) return;
    headerVisible = visible;
    options.header.dataset.dnsScrollState = visible ? 'shown' : 'hidden';
  };

  const updateHeaderVisibility = () => {
    const behavior = headerTokens.scrollBehavior;
    if (!behavior?.enabled || !behavior.hideOnScrollDown) {
      setHeaderVisible(true);
      lastScrollY = Math.max(0, window.scrollY);
      return;
    }

    const y = Math.max(0, window.scrollY);
    if (y <= (behavior.topRevealPx ?? 12)) {
      setHeaderVisible(true);
      lastScrollY = y;
      return;
    }

    const delta = y - lastScrollY;
    if (Math.abs(delta) < (behavior.directionDeltaPx ?? 6)) return;

    if (delta > 0 && y > (behavior.hideAfterPx ?? 72)) {
      setHeaderVisible(false);
    } else if (delta < 0 && behavior.revealOnScrollUp !== false) {
      setHeaderVisible(true);
    }

    lastScrollY = y;
  };

  const updateStickyMetrics = () => {
    const headerHeight = Math.ceil(options.header.getBoundingClientRect().height);
    const navHeight = Math.ceil(options.nav.getBoundingClientRect().height);
    const visibleHeaderHeight = headerVisible ? headerHeight : 0;
    const root = documentRoot.documentElement;
    root.style.setProperty('--dns-header-height', `${headerHeight}px`);
    root.style.setProperty('--dns-header-visible-height', `${visibleHeaderHeight}px`);
    root.style.setProperty('--dns-sticky-stack-height', `${visibleHeaderHeight + navHeight}px`);
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

  const clearNavigationIntent = () => {
    navigationIntentId = '';
    if (navigationIntentTimer) {
      window.clearTimeout(navigationIntentTimer);
      navigationIntentTimer = 0;
    }
  };

  const holdNavigationIntent = (id: string) => {
    navigationIntentId = id;
    if (navigationIntentTimer) window.clearTimeout(navigationIntentTimer);
    navigationIntentTimer = window.setTimeout(() => {
      navigationIntentId = '';
      navigationIntentTimer = 0;
      requestRefresh();
    }, NAVIGATION_INTENT_TIMEOUT_MS);
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

    const headerHeight = headerVisible ? options.header.getBoundingClientRect().height : 0;
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

    if (navigationIntentId) {
      if (candidate?.id === navigationIntentId) {
        clearNavigationIntent();
      } else {
        setActiveSection(navigationIntentId);
        return;
      }
    }

    if (candidate?.id) setActiveSection(candidate.id);
  };

  const refreshNow = () => {
    frame = 0;
    updateHeaderVisibility();
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
      if (id) {
        holdNavigationIntent(id);
        setActiveSection(id);
      }
    });
  });

  requestRefresh();

  return {
    refresh: requestRefresh,
    setActiveSection,
    disconnect() {
      stickyObserver?.disconnect();
      clearNavigationIntent();
      options.header.classList.remove('dns-foundation-header');
      delete options.header.dataset.dnsScrollState;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestRefresh);
      window.removeEventListener('resize', requestRefresh);
      window.removeEventListener('load', requestRefresh);
    },
  };
}
