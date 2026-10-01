import { DNS_DESIGN_SYSTEM } from './design-system.js';
import { initDNSNavigationRuntime } from './navigation.js';

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

  const header =
    options.header ??
    documentRoot.querySelector(options.headerSelector ?? DEFAULT_HEADER_SELECTOR);

  const nav =
    options.nav ??
    documentRoot.querySelector(options.navSelector ?? DEFAULT_NAV_SELECTOR);

  if (!(header instanceof HTMLElement) || !(nav instanceof HTMLElement)) {
    return noOpHandle();
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
