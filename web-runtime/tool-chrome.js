import { DNS_DESIGN_SYSTEM } from './design-system.js';
import { initDNSNavigationRuntime, initDNSNavigationStyles } from './navigation.js';

const DEFAULT_HEADER_SELECTOR = '[data-dns-tool-header]';
const DEFAULT_NAV_SELECTOR = '[data-dns-tool-nav]';
const DEFAULT_TAB_SELECTOR = '[data-section]';
const PROGRESS_TRACK_ATTR = 'data-dns-scroll-progress';
const PROGRESS_BAR_ATTR = 'data-dns-scroll-progress-bar';
const runtimeByNav = new WeakMap();

function noOpHandle() {
  return {
    header: null,
    nav: null,
    refresh() {},
    setActiveSection() {},
    disconnect() {},
  };
}

function ensureProgressElements(documentRoot, nav, label) {
  const existingTrack = nav.querySelector(`[${PROGRESS_TRACK_ATTR}]`);
  const existingBar = existingTrack?.querySelector(`[${PROGRESS_BAR_ATTR}]`);

  if (existingTrack && existingBar) {
    return { track: existingTrack, bar: existingBar, created: false };
  }

  const track = documentRoot.createElement('div');
  track.className = 'dns-scroll-progress-track';
  track.setAttribute(PROGRESS_TRACK_ATTR, '');
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-label', label);
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', '100');
  track.setAttribute('aria-valuenow', '0');

  const bar = documentRoot.createElement('span');
  bar.className = 'dns-scroll-progress-bar';
  bar.setAttribute(PROGRESS_BAR_ATTR, '');

  track.appendChild(bar);
  nav.prepend(track);

  return { track, bar, created: true };
}

function findSectionElements(documentRoot, tabs) {
  const seen = new Set();
  const sections = [];

  for (const tab of tabs) {
    const id = tab.dataset.section?.trim();
    if (!id || seen.has(id)) continue;

    const section = documentRoot.getElementById(id);
    if (!(section instanceof HTMLElement)) continue;

    seen.add(id);
    sections.push(section);
  }

  return sections;
}

export function initDNSToolChromeRuntime(options = {}) {
  const documentRoot =
    options.root ?? (typeof document !== 'undefined' ? document : undefined);

  if (!documentRoot || typeof window === 'undefined') {
    return noOpHandle();
  }

  initDNSNavigationStyles({
    root: documentRoot,
    navigation: options.navigation ?? DNS_DESIGN_SYSTEM.navigation,
    responsive: options.responsive ?? DNS_DESIGN_SYSTEM.responsive,
    headerTokens: options.headerTokens ?? DNS_DESIGN_SYSTEM.header,
    motion: options.motion ?? DNS_DESIGN_SYSTEM.motion,
  });

  const header =
    options.header ??
    documentRoot.querySelector(options.headerSelector ?? DEFAULT_HEADER_SELECTOR);

  const nav =
    options.nav ??
    documentRoot.querySelector(options.navSelector ?? DEFAULT_NAV_SELECTOR);

  if (!(header instanceof HTMLElement) || !(nav instanceof HTMLElement)) {
    let delegate = null;
    let disconnected = false;
    let pendingActiveSection = '';
    let standaloneHeader = header instanceof HTMLElement ? header : null;

    const prepareStandaloneHeader = (candidate) => {
      if (!(candidate instanceof HTMLElement)) return;
      if (standaloneHeader && standaloneHeader !== candidate && standaloneHeader.isConnected) {
        standaloneHeader.classList.remove('dns-foundation-header');
        delete standaloneHeader.dataset.dnsScrollState;
      }
      standaloneHeader = candidate;
      standaloneHeader.dataset.dnsToolHeader = '';
      standaloneHeader.classList.add('dns-foundation-header');
      standaloneHeader.dataset.dnsScrollState = 'shown';
    };

    prepareStandaloneHeader(standaloneHeader);

    const tryInitialize = () => {
      if (disconnected || delegate) return;
      const lateHeader = documentRoot.querySelector(options.headerSelector ?? DEFAULT_HEADER_SELECTOR);
      const lateNav = documentRoot.querySelector(options.navSelector ?? DEFAULT_NAV_SELECTOR);

      if (lateHeader instanceof HTMLElement) prepareStandaloneHeader(lateHeader);
      if (!(lateHeader instanceof HTMLElement) || !(lateNav instanceof HTMLElement)) return;

      observer.disconnect();
      delegate = initDNSToolChromeRuntime({
        ...options,
        root: documentRoot,
        header: lateHeader,
        nav: lateNav,
      });
      if (pendingActiveSection) delegate.setActiveSection(pendingActiveSection);
    };

    const observer = new MutationObserver(tryInitialize);
    observer.observe(documentRoot.documentElement, { childList: true, subtree: true });
    queueMicrotask(tryInitialize);

    return {
      get header() { return delegate?.header ?? standaloneHeader; },
      get nav() { return delegate?.nav ?? null; },
      refresh() {
        if (delegate) return delegate.refresh();
        prepareStandaloneHeader(
          documentRoot.querySelector(options.headerSelector ?? DEFAULT_HEADER_SELECTOR),
        );
      },
      setActiveSection(id) {
        pendingActiveSection = id;
        delegate?.setActiveSection(id);
      },
      disconnect() {
        disconnected = true;
        observer.disconnect();
        delegate?.disconnect();
        if (!delegate && standaloneHeader) {
          standaloneHeader.classList.remove('dns-foundation-header');
          delete standaloneHeader.dataset.dnsScrollState;
        }
        delegate = null;
        standaloneHeader = null;
      },
    };
  }

  header.dataset.dnsToolHeader = '';
  nav.dataset.dnsToolNav = '';
  nav.classList.add('dns-tab-nav');

  const progress =
    options.autoCreateProgress === false
      ? {
          track:
            nav.querySelector(`[${PROGRESS_TRACK_ATTR}]`) ??
            nav.querySelector('.dns-scroll-progress-track'),
          bar:
            nav.querySelector(`[${PROGRESS_BAR_ATTR}]`) ??
            nav.querySelector('.dns-scroll-progress-bar'),
          created: false,
        }
      : ensureProgressElements(
          documentRoot,
          nav,
          options.progressLabel ?? 'Page scroll progress',
        );

  const tabs = Array.from(
    nav.querySelectorAll(options.tabSelector ?? DEFAULT_TAB_SELECTOR),
  );
  const sections = findSectionElements(documentRoot, tabs);

  const runtime = initDNSNavigationRuntime({
    root: documentRoot,
    header,
    nav,
    progressTrack: progress.track,
    progressBar: progress.bar,
    sectionTabs: tabs,
    sectionElements: sections,
    navigation: options.navigation ?? DNS_DESIGN_SYSTEM.navigation,
    responsive: options.responsive ?? DNS_DESIGN_SYSTEM.responsive,
    headerTokens: options.headerTokens ?? DNS_DESIGN_SYSTEM.header,
    motion: options.motion ?? DNS_DESIGN_SYSTEM.motion,
    activeClassName: options.activeClassName,
    activationOffsetPx: options.activationOffsetPx,
    onActiveSectionChange: options.onActiveSectionChange,
  });

  runtimeByNav.set(nav, runtime);
  documentRoot.documentElement.dataset.dnsToolChrome = 'shared';

  const initialActiveSection = nav.dataset.dnsActiveSection?.trim();
  if (initialActiveSection) {
    runtime.setActiveSection(initialActiveSection);
  }

  return {
    header,
    nav,
    refresh: () => runtime.refresh(),
    setActiveSection: (id) => runtime.setActiveSection(id),
    disconnect() {
      runtimeByNav.delete(nav);
      runtime.disconnect();

      if (progress.created) {
        progress.track?.remove();
      }

      delete documentRoot.documentElement.dataset.dnsToolChrome;
    },
  };
}

export function setDNSToolChromeActiveSection(id, root) {
  const documentRoot =
    root ?? (typeof document !== 'undefined' ? document : undefined);
  if (!documentRoot || !id) return;

  const nav = documentRoot.querySelector(DEFAULT_NAV_SELECTOR);
  if (!(nav instanceof HTMLElement)) return;

  nav.dataset.dnsActiveSection = id;
  runtimeByNav.get(nav)?.setActiveSection(id);
  runtimeByNav.get(nav)?.refresh();
}
