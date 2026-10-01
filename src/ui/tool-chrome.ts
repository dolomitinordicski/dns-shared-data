import { DNS_DESIGN_SYSTEM } from '../design-system.js';
import {
  initDNSNavigationRuntime,
  type DNSHeaderTokens,
  type DNSNavigationMotionTokens,
  type DNSNavigationRuntimeHandle,
  type DNSNavigationTokens,
  type DNSResponsiveTokens,
} from './navigation.js';

export interface DNSToolChromeRuntimeOptions {
  root?: Document;
  header?: HTMLElement | null;
  nav?: HTMLElement | null;
  headerSelector?: string;
  navSelector?: string;
  tabSelector?: string;
  progressLabel?: string;
  autoCreateProgress?: boolean;
  navigation?: DNSNavigationTokens;
  responsive?: DNSResponsiveTokens;
  headerTokens?: DNSHeaderTokens;
  motion?: DNSNavigationMotionTokens;
  activeClassName?: string;
  activationOffsetPx?: number;
  onActiveSectionChange?: (id: string) => void;
}

export interface DNSToolChromeRuntimeHandle
  extends DNSNavigationRuntimeHandle {
  readonly header: HTMLElement | null;
  readonly nav: HTMLElement | null;
}

const DEFAULT_HEADER_SELECTOR = '[data-dns-tool-header]';
const DEFAULT_NAV_SELECTOR = '[data-dns-tool-nav]';
const DEFAULT_TAB_SELECTOR = '[data-section]';
const PROGRESS_TRACK_ATTR = 'data-dns-scroll-progress';
const PROGRESS_BAR_ATTR = 'data-dns-scroll-progress-bar';
const runtimeByNav = new WeakMap<HTMLElement, DNSNavigationRuntimeHandle>();

function noOpHandle(): DNSToolChromeRuntimeHandle {
  return {
    header: null,
    nav: null,
    refresh() {},
    setActiveSection() {},
    disconnect() {},
  };
}

function ensureProgressElements(
  documentRoot: Document,
  nav: HTMLElement,
  label: string,
): {
  track: HTMLElement;
  bar: HTMLElement;
  created: boolean;
} {
  const existingTrack = nav.querySelector<HTMLElement>(
    `[${PROGRESS_TRACK_ATTR}]`,
  );
  const existingBar = existingTrack?.querySelector<HTMLElement>(
    `[${PROGRESS_BAR_ATTR}]`,
  );

  if (existingTrack && existingBar) {
    return {
      track: existingTrack,
      bar: existingBar,
      created: false,
    };
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

function findSectionElements(
  documentRoot: Document,
  tabs: readonly HTMLElement[],
): HTMLElement[] {
  const seen = new Set<string>();
  const sections: HTMLElement[] = [];

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

/**
 * Canonical DNS tool-chrome runtime.
 *
 * Consumers only declare:
 * - data-dns-tool-header on the corporate header
 * - data-dns-tool-nav on the tool navigation / command bar
 * - data-section on optional navigation tabs
 *
 * This runtime owns:
 * - hide-on-scroll / reveal-on-scroll-up header behavior
 * - sticky nav offsets
 * - sticky-stack measurement
 * - scroll progress
 * - section tracking when matching section IDs exist
 *
 * Applications must not reimplement these behaviors locally.
 */
export function initDNSToolChromeRuntime(
  options: DNSToolChromeRuntimeOptions = {},
): DNSToolChromeRuntimeHandle {
  const documentRoot =
    options.root ?? (typeof document !== 'undefined' ? document : undefined);

  if (!documentRoot || typeof window === 'undefined') {
    return noOpHandle();
  }

  const header =
    options.header ??
    documentRoot.querySelector<HTMLElement>(
      options.headerSelector ?? DEFAULT_HEADER_SELECTOR,
    );

  const nav =
    options.nav ??
    documentRoot.querySelector<HTMLElement>(
      options.navSelector ?? DEFAULT_NAV_SELECTOR,
    );

  if (!(header instanceof HTMLElement) || !(nav instanceof HTMLElement)) {
    let delegate: DNSToolChromeRuntimeHandle | null = null;
    let disconnected = false;
    let pendingActiveSection = '';

    const tryInitialize = () => {
      if (disconnected || delegate) return;

      const lateHeader = documentRoot.querySelector<HTMLElement>(
        options.headerSelector ?? DEFAULT_HEADER_SELECTOR,
      );
      const lateNav = documentRoot.querySelector<HTMLElement>(
        options.navSelector ?? DEFAULT_NAV_SELECTOR,
      );

      if (!(lateHeader instanceof HTMLElement) || !(lateNav instanceof HTMLElement)) {
        return;
      }

      observer.disconnect();
      delegate = initDNSToolChromeRuntime({
        ...options,
        root: documentRoot,
        header: lateHeader,
        nav: lateNav,
      });

      if (pendingActiveSection) {
        delegate.setActiveSection(pendingActiveSection);
      }
    };

    const observer = new MutationObserver(tryInitialize);
    observer.observe(documentRoot.documentElement, {
      childList: true,
      subtree: true,
    });

    queueMicrotask(tryInitialize);

    return {
      get header() {
        return delegate?.header ?? null;
      },
      get nav() {
        return delegate?.nav ?? null;
      },
      refresh() {
        delegate?.refresh();
      },
      setActiveSection(id: string) {
        pendingActiveSection = id;
        delegate?.setActiveSection(id);
      },
      disconnect() {
        disconnected = true;
        observer.disconnect();
        delegate?.disconnect();
        delegate = null;
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
            nav.querySelector<HTMLElement>(`[${PROGRESS_TRACK_ATTR}]`) ??
            nav.querySelector<HTMLElement>('.dns-scroll-progress-track'),
          bar:
            nav.querySelector<HTMLElement>(`[${PROGRESS_BAR_ATTR}]`) ??
            nav.querySelector<HTMLElement>('.dns-scroll-progress-bar'),
          created: false,
        }
      : ensureProgressElements(
          documentRoot,
          nav,
          options.progressLabel ?? 'Page scroll progress',
        );

  const tabs = Array.from(
    nav.querySelectorAll<HTMLElement>(
      options.tabSelector ?? DEFAULT_TAB_SELECTOR,
    ),
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
    setActiveSection: (id: string) => runtime.setActiveSection(id),
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


export function setDNSToolChromeActiveSection(
  id: string,
  root?: Document,
): void {
  const documentRoot =
    root ?? (typeof document !== 'undefined' ? document : undefined);
  if (!documentRoot || !id) return;

  const nav = documentRoot.querySelector<HTMLElement>(
    DEFAULT_NAV_SELECTOR,
  );
  if (!(nav instanceof HTMLElement)) return;

  nav.dataset.dnsActiveSection = id;
  runtimeByNav.get(nav)?.setActiveSection(id);
  runtimeByNav.get(nav)?.refresh();
}
