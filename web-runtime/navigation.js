// Browser mirror of src/ui/navigation.ts.
// Source of truth remains the TypeScript module in src/ui/navigation.ts.

const STYLE_ID = 'dns-navigation-runtime-style';
const NAVIGATION_INTENT_TIMEOUT_MS = 1200;

function setNavigationVariables(root, navigation) {
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

function ensureNavigationStyles(documentRoot, navigation, responsive) {
  let style = documentRoot.getElementById(STYLE_ID);
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
  padding: ${desktopTabs.tabPaddingYRem}rem ${desktopTabs.tabPaddingXRem}rem calc(${desktopTabs.tabPaddingYRem}rem - .03rem);
  transition: color ${navigation.tabs.transitionMs}ms ease, border-color ${navigation.tabs.transitionMs}ms ease;
}
.dns-tab:hover { color: var(--dns-tab-hover); }
.dns-tab-active {
  color: var(--dns-tab-active);
  border-bottom-color: var(--dns-tab-indicator);
}
@media (min-width: ${desktop}px) {
  .dns-tab-nav { overflow: visible; }
  .dns-tab-nav-inner {
    min-width: 0;
    flex-wrap: wrap;
    padding-top: .18rem;
    padding-bottom: .18rem;
  }
}
@media (max-width: ${desktop - 1}px) {
  .dns-tab-nav { overflow-x: auto; overflow-y: hidden; }
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
@media (max-width: ${mobileMax}px) {
  .dns-tab-nav { scroll-snap-type: x proximity; }
  .dns-tab-nav-inner { padding-left: .9rem; padding-right: .9rem; }
  .dns-tab { scroll-snap-align: start; }
}
`;
}

function pageTop(element) {
  return element.getBoundingClientRect().top + window.scrollY;
}

export function initDNSNavigationRuntime(options) {
  const documentRoot = options.root ?? document;
  const navigation = options.navigation;
  const responsive = options.responsive;
  const activeClassName = options.activeClassName ?? 'dns-tab-active';
  const activationOffsetPx = options.activationOffsetPx ?? 16;
  const tabs = Array.from(options.sectionTabs ?? []);
  const sections = Array.from(options.sectionElements ?? []);

  setNavigationVariables(documentRoot.documentElement, navigation);
  ensureNavigationStyles(documentRoot, navigation, responsive);

  let frame = 0;
  let activeId = '';
  let navigationIntentId = '';
  let navigationIntentTimer = 0;
  const updateStickyMetrics = () => {
    const headerHeight = Math.ceil(options.header.getBoundingClientRect().height);
    const navHeight = Math.ceil(options.nav.getBoundingClientRect().height);
    documentRoot.documentElement.style.setProperty('--dns-header-height', `${headerHeight}px`);
    documentRoot.documentElement.style.setProperty('--dns-sticky-stack-height', `${headerHeight + navHeight}px`);
  };

  const setActiveSection = (id) => {
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

  const holdNavigationIntent = (id) => {
    navigationIntentId = id;
    if (navigationIntentTimer) window.clearTimeout(navigationIntentTimer);
    navigationIntentTimer = window.setTimeout(() => {
      navigationIntentId = '';
      navigationIntentTimer = 0;
      requestRefresh();
    }, NAVIGATION_INTENT_TIMEOUT_MS);
  };

  const updateProgress = () => {
    const maxScroll = Math.max(1, documentRoot.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    if (options.progressBar) options.progressBar.style.transform = `scaleX(${ratio})`;
    options.progressTrack?.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  };

  const updateActiveSection = () => {
    if (!sections.length) return;
    const activationLine = window.scrollY +
      options.header.getBoundingClientRect().height +
      options.nav.getBoundingClientRect().height +
      activationOffsetPx;
    let candidate = sections[0];
    for (const section of sections) {
      if (pageTop(section) <= activationLine) candidate = section;
      else break;
    }
    const atBottom = window.scrollY + window.innerHeight >= documentRoot.documentElement.scrollHeight - 2;
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
    updateStickyMetrics();
    updateProgress();
    updateActiveSection();
  };
  const requestRefresh = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(refreshNow);
  };

  const observer = new ResizeObserver(requestRefresh);
  observer.observe(options.header);
  observer.observe(options.nav);
  window.addEventListener('scroll', requestRefresh, { passive: true });
  window.addEventListener('resize', requestRefresh);
  window.addEventListener('load', requestRefresh);
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    const id = tab.dataset.section;
    if (id) {
      holdNavigationIntent(id);
      setActiveSection(id);
    }
  }));

  requestRefresh();

  return {
    refresh: requestRefresh,
    setActiveSection,
    disconnect() {
      observer.disconnect();
      clearNavigationIntent();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestRefresh);
      window.removeEventListener('resize', requestRefresh);
      window.removeEventListener('load', requestRefresh);
    },
  };
}
