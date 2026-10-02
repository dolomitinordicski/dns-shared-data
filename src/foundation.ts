import { DNS_DESIGN_SYSTEM, type DNSDesignSystem } from './design-system.js';
import {
  DNS_DEFAULT_UI_LANGUAGE,
  DNS_UI_LANGUAGE_STORAGE_KEY,
  resolveDNSLanguagePreference,
  type DNSUILanguage,
} from './localization.js';
import { initDNSInteractionRuntime } from './ui/interaction.js';
import { initDNSRevealRuntime } from './ui/motion.js';
import { initDNSSemanticMotionRuntime, type DNSSemanticMotionOptions } from './ui/semantic-motion.js';
import type { DNSMotionSemanticId } from './motion-semantics.js';
import { initDNSToolChromeRuntime, type DNSToolChromeRuntimeOptions } from './ui/tool-chrome.js';
import { initDNSPrintRuntime } from './ui/print.js';
import { initDNSUIPrimitives } from './ui/primitives.js';
import { initDNSContentPatterns } from './ui/content-patterns.js';
import {
  initDNSAccessibilityRuntime,
  type DNSAccessibilityRuntimeOptions,
  type DNSAccessibilitySettings,
} from './ui/accessibility.js';
import { initDNSFooterRuntime } from './ui/footer.js';
import { initDNSDataUIRuntime } from './ui/data-ui.js';
import { initDNSIdentityUIRuntime } from './ui/identity.js';
import { initDNSAssetUIRuntime } from './ui/assets.js';
import { initDNSWorkspaceRuntime, type DNSWorkspaceRuntimeHandle } from './ui/workspace.js';
import { initDNSShellRuntime } from './ui/shell.js';
import type { DNSShellProfileId } from './shell-profiles.js';
import type { DNSPrintProfileId } from './print-profiles.js';
import { createDNSCapabilityRuntime, type DNSCapabilityAdapter, type DNSCapabilityRuntime } from './capability-runtime.js';
import type { DNSCapabilityId } from './capabilities.js';
import { initDNSCapabilityUIRuntime } from './ui/capabilities.js';

export const DNS_FOUNDATION_RUNTIME_VERSION = '1.1.0' as const;
export const DNS_FOUNDATION_LANGUAGE_EVENT = 'dns:languagechange' as const;

export interface DNSFoundationAccessibilityOptions {
  enabled?: boolean;
  mountTarget?: HTMLElement | null;
  mountSelector?: string;
  settings?: Partial<DNSAccessibilitySettings>;
  storageKey?: string;
}

export interface DNSFoundationRuntimeOptions {
  root?: Document;
  designSystem?: DNSDesignSystem;
  language?: DNSUILanguage;
  accountLanguage?: DNSUILanguage | null;
  languageStorageKey?: string;
  persistLanguage?: boolean;
  primitives?: boolean;
  contentPatterns?: boolean;
  dataUI?: boolean;
  identityUI?: boolean;
  assetUI?: boolean;
  workspace?: boolean;
  interaction?: boolean;
  motion?: boolean;
  semanticMotion?: boolean;
  chrome?: boolean | DNSToolChromeRuntimeOptions;
  print?: boolean;
  printProfile?: DNSPrintProfileId;
  footer?: boolean;
  accessibility?: boolean | DNSFoundationAccessibilityOptions;
  shellProfile?: DNSShellProfileId;
  capabilities?: readonly DNSCapabilityId[];
  capabilityAdapters?: readonly DNSCapabilityAdapter[];
  capabilityUI?: boolean;
}

export interface DNSFoundationRuntimeHandle {
  readonly version: typeof DNS_FOUNDATION_RUNTIME_VERSION;
  readonly designSystemVersion: string;
  readonly source: 'package' | 'provided';
  readonly workspaceRuntime?: DNSWorkspaceRuntimeHandle | null;
  readonly capabilityRuntime: DNSCapabilityRuntime;
  getLanguage(): DNSUILanguage;
  setLanguage(language: DNSUILanguage): void;
  subscribeLanguage(listener: (language: DNSUILanguage) => void): () => void;
  refresh(): void;
  playMotion(element: HTMLElement, semantic: DNSMotionSemanticId, options?: DNSSemanticMotionOptions): Animation | null;
  printNow(profile?: DNSPrintProfileId): void;
  disconnect(): void;
}

const runtimeByDocument = new WeakMap<Document, DNSFoundationRuntimeHandle>();

function setVar(root: HTMLElement, name: string, value: string | number | undefined | null) {
  if (value === undefined || value === null) return;
  root.style.setProperty(name, String(value));
}

export function applyDNSDesignVariables(
  designSystem: DNSDesignSystem = DNS_DESIGN_SYSTEM,
  documentRoot: Document = document,
) {
  const root = documentRoot.documentElement;
  const {
    colors,
    typography,
    shape,
    spacing,
    shadow,
    motion,
    contextSelector,
    navigation,
    header,
    footer,
    controls,
    cards,
    metrics,
    tables,
    responsive,
    readingText,
  } = designSystem;

  setVar(root, '--color-dns-deep', colors.deep);
  setVar(root, '--color-dns-mid', colors.mid);
  setVar(root, '--color-dns-light', colors.light);
  setVar(root, '--color-dns-bg', colors.background);
  setVar(root, '--color-dns-surface', colors.surface);
  setVar(root, '--color-dns-dark-text', colors.darkText);
  setVar(root, '--color-dns-muted', colors.mutedText);
  setVar(root, '--color-dns-border', colors.border);
  setVar(root, '--color-dns-subtle-border', colors.subtleBorder);
  setVar(root, '--color-dns-primary-dark', colors.primaryDark);
  setVar(root, '--color-dns-secondary-dark', colors.secondaryDark);

  setVar(root, '--font-display', `"${typography.primaryFamily}", sans-serif`);
  setVar(root, '--font-heading', `"${typography.primaryFamily}", sans-serif`);
  setVar(root, '--font-body', `"${typography.primaryFamily}", sans-serif`);
  setVar(root, '--font-alt', `"${typography.secondaryFamily}", sans-serif`);
  setVar(root, '--dns-base-font-size', `${typography.baseFontSizePx}px`);
  setVar(root, '--dns-heading-size', `${typography.headingPx}px`);
  setVar(root, '--dns-section-title-size', `${typography.sectionTitlePx}px`);
  setVar(root, '--dns-label-size', `${typography.labelPx}px`);
  setVar(root, '--dns-micro-size', `${typography.microPx}px`);
  setVar(root, '--dns-value-size', `${typography.valuePx}px`);
  setVar(root, '--dns-uppercase-tracking', `${typography.uppercaseTrackingEm}em`);

  setVar(root, '--dns-card-radius', `${shape.cardRadiusPx}px`);
  setVar(root, '--dns-control-radius', `${shape.controlRadiusPx}px`);
  setVar(root, '--dns-badge-radius', `${shape.badgeRadiusPx}px`);
  setVar(root, '--dns-page-x', `${spacing.pageXRem}rem`);
  setVar(root, '--dns-page-y', `${spacing.pageYRem}rem`);
  setVar(root, '--dns-card-padding', `${spacing.cardPaddingRem}rem`);
  setVar(root, '--dns-card-gap', `${spacing.cardGapPx}px`);
  setVar(root, '--dns-compact-gap', `${spacing.compactGapPx}px`);

  setVar(root, '--dns-card-shadow', shadow.card);
  setVar(root, '--dns-header-shadow', shadow.header);
  setVar(root, '--dns-floating-shadow', shadow.floatingControl);

  setVar(root, '--dns-motion-fast', `${motion.fastMs}ms`);
  setVar(root, '--dns-motion-standard', `${motion.standardMs}ms`);
  setVar(root, '--dns-motion-reveal', `${motion.reveal.durationMs}ms`);
  setVar(root, '--dns-motion-easing', motion.easing);

  setVar(root, '--dns-header-bg', header.background);
  setVar(root, '--dns-header-logo-height', `${header.logoHeightPx}px`);
  setVar(root, '--dns-header-title-color', header.titleColor);
  setVar(root, '--dns-header-subtitle-color', header.subtitleColor);
  setVar(root, '--dns-header-title-size', `${header.titleSizePx}px`);
  setVar(root, '--dns-header-subtitle-size', `${header.subtitleSizePx}px`);

  setVar(root, '--dns-footer-bg', footer.background);
  setVar(root, '--dns-footer-text', footer.textColor);
  setVar(root, '--dns-footer-size', `${footer.fontSizePx}px`);
  setVar(root, '--dns-footer-font-size', `${footer.fontSizePx}px`);

  setVar(root, '--dns-control-border', controls.border);
  setVar(root, '--dns-control-focus', controls.focusColor);
  setVar(root, '--dns-control-primary-bg', controls.primaryBackground);
  setVar(root, '--dns-control-primary-hover', controls.primaryHoverBackground);
  setVar(root, '--dns-control-secondary-bg', controls.secondaryBackground);
  setVar(root, '--dns-control-secondary-text', controls.secondaryText);

  setVar(root, '--dns-card-bg', cards.background);
  setVar(root, '--dns-card-accent', cards.defaultAccent);
  setVar(root, '--dns-card-accent-strong', cards.strongAccent);

  setVar(root, '--dns-metric-accent-width', `${metrics.accentWidthPx}px`);
  setVar(root, '--dns-metric-value-size', `${metrics.valueSizePx}px`);

  setVar(root, '--dns-table-header-size', `${tables.headerSizePx}px`);
  setVar(root, '--dns-table-body-size', `${tables.bodySizePx}px`);
  setVar(root, '--dns-table-row-border', tables.rowBorder);
  setVar(root, '--dns-table-header-border', tables.headerBorder);
  setVar(root, '--dns-table-row-alt', tables.alternateRowBackground);
  setVar(root, '--dns-table-grid-strong', tables.gridStrongBorder);

  setVar(root, '--dns-context-selected-bg', contextSelector.selected.background);
  setVar(root, '--dns-context-selected-text', contextSelector.selected.text);
  setVar(root, '--dns-context-selected-border', contextSelector.selected.border);
  setVar(root, '--dns-context-hover-bg', contextSelector.hover.background);
  setVar(root, '--dns-context-hover-border', contextSelector.hover.border);
  setVar(root, '--dns-context-focus-color', contextSelector.focus.color);
  setVar(root, '--dns-context-focus-width', `${contextSelector.focus.widthPx}px`);
  setVar(root, '--dns-context-focus-offset', `${contextSelector.focus.offsetPx}px`);

  setVar(root, '--dns-tab-bg', navigation.tabs.containerBackground);
  setVar(root, '--dns-tab-text', navigation.tabs.textColor);
  setVar(root, '--dns-tab-active', navigation.tabs.activeTextColor);
  setVar(root, '--dns-tab-hover', navigation.tabs.hoverTextColor);
  setVar(root, '--dns-tab-indicator', navigation.tabs.activeIndicatorColor);
  setVar(root, '--dns-tab-indicator-width', `${navigation.tabs.activeIndicatorWidthPx}px`);
  setVar(root, '--dns-tab-size', `${navigation.tabs.fontSizePx}px`);
  setVar(root, '--dns-tab-weight', navigation.tabs.fontWeight);
  setVar(root, '--dns-tab-tracking', `${navigation.tabs.letterSpacingEm}em`);
  setVar(root, '--dns-nav-surface-bg', navigation.tabs.surfaceBackground ?? navigation.tabs.containerBackground);
  setVar(root, '--dns-nav-backdrop-blur', `${navigation.tabs.backdropBlurPx ?? 0}px`);
  setVar(root, '--dns-scroll-progress-height', `${navigation.tabs.scrollProgress?.heightPx ?? 0}px`);
  setVar(root, '--dns-scroll-progress-color', navigation.tabs.scrollProgress?.color ?? colors.light);
  setVar(root, '--dns-scroll-progress-track', navigation.tabs.scrollProgress?.track ?? 'transparent');

  setVar(root, '--dns-page-x-desktop', `${responsive.page.desktop.paddingXRem}rem`);
  setVar(root, '--dns-page-x-tablet', `${responsive.page.tablet.paddingXRem}rem`);
  setVar(root, '--dns-page-x-mobile', `${responsive.page.mobile.paddingXRem}rem`);
  setVar(root, '--dns-mobile-header-logo-height', `${responsive.header.mobile.logoHeightPx}px`);
  setVar(root, '--dns-tablet-header-logo-height', `${responsive.header.tablet.logoHeightPx}px`);

  setVar(root, '--dns-reading-text-large-size', `${readingText.largeSizePx}px`);
  setVar(root, '--dns-reading-text-large-line-height', readingText.largeLineHeight);
}

function readStoredLanguage(storageKey: string): DNSUILanguage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === 'de' || value === 'it' ? value : undefined;
  } catch {
    return undefined;
  }
}

function writeStoredLanguage(storageKey: string, language: DNSUILanguage) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, language);
  } catch {
    // Runtime remains usable for the current session.
  }
}

function initDeferredAccessibility(
  documentRoot: Document,
  language: DNSUILanguage,
  options: DNSFoundationAccessibilityOptions,
) {
  if (options.enabled === false) {
    return {
      setLanguage() {},
      disconnect() {},
    };
  }

  const selector = options.mountSelector ?? '[data-dns-accessibility-mount]';
  let runtime: ReturnType<typeof initDNSAccessibilityRuntime> | null = null;
  let observer: MutationObserver | null = null;
  let currentLanguage = language;

  const start = (mountTarget: HTMLElement) => {
    if (runtime) return;
    runtime = initDNSAccessibilityRuntime({
      mountTarget,
      language: currentLanguage,
      storageKey: options.storageKey,
      settings: options.settings,
    });
    observer?.disconnect();
    observer = null;
  };

  const tryMount = () => {
    if (runtime) return;
    const explicit = options.mountTarget;
    if (explicit instanceof HTMLElement) {
      start(explicit);
      return;
    }
    const target = documentRoot.querySelector<HTMLElement>(selector);
    if (target) start(target);
  };

  tryMount();

  if (!runtime && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(tryMount);
    observer.observe(documentRoot.documentElement, { childList: true, subtree: true });
    queueMicrotask(tryMount);
  }

  return {
    setLanguage(next: DNSUILanguage) {
      currentLanguage = next;
      runtime?.setLanguage(next);
    },
    disconnect() {
      observer?.disconnect();
      runtime?.disconnect();
      observer = null;
      runtime = null;
    },
  };
}

export function initDNSFoundation(
  options: DNSFoundationRuntimeOptions = {},
): DNSFoundationRuntimeHandle {
  const documentRoot =
    options.root ?? (typeof document !== 'undefined' ? document : undefined);

  if (!documentRoot) {
    let language = resolveDNSLanguagePreference({
      explicit: options.language,
      account: options.accountLanguage,
    });
    const listeners = new Set<(language: DNSUILanguage) => void>();
    const capabilityRuntime = createDNSCapabilityRuntime({
      declared: options.capabilities,
      adapters: options.capabilityAdapters,
      language,
    });
    return {
      version: DNS_FOUNDATION_RUNTIME_VERSION,
      designSystemVersion: (options.designSystem ?? DNS_DESIGN_SYSTEM).version,
      source: options.designSystem ? 'provided' : 'package',
      workspaceRuntime: null,
      capabilityRuntime,
      getLanguage: () => language,
      setLanguage(next) {
        language = next === 'it' ? 'it' : DNS_DEFAULT_UI_LANGUAGE;
        listeners.forEach((listener) => listener(language));
      },
      subscribeLanguage(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      refresh() {},
      playMotion() { return null; },
      printNow() {},
      disconnect() {
        listeners.clear();
      },
    };
  }

  const existing = runtimeByDocument.get(documentRoot);
  if (existing) return existing;

  const designSystem = options.designSystem ?? DNS_DESIGN_SYSTEM;
  const source = options.designSystem ? 'provided' as const : 'package' as const;
  const shellProfile = options.shellProfile ?? 'operational';
  const storageKey = options.languageStorageKey ?? DNS_UI_LANGUAGE_STORAGE_KEY;
  const persistLanguage = options.persistLanguage ?? true;

  let language = resolveDNSLanguagePreference({
    explicit: options.language,
    account: options.accountLanguage,
    stored: readStoredLanguage(storageKey),
  });
  const listeners = new Set<(language: DNSUILanguage) => void>();

  applyDNSDesignVariables(designSystem, documentRoot);
  const shell = initDNSShellRuntime(shellProfile, documentRoot);
  const workspaceRuntime =
    shellProfile === 'workspace' && options.workspace !== false
      ? initDNSWorkspaceRuntime(documentRoot)
      : null;
  documentRoot.documentElement.lang = language;
  documentRoot.documentElement.dataset.dnsLanguage = language;
  documentRoot.documentElement.dataset.dnsFoundationRuntime = DNS_FOUNDATION_RUNTIME_VERSION;
  documentRoot.documentElement.dataset.dnsDesignVersion = designSystem.version;
  documentRoot.documentElement.dataset.dnsDesignSource = source;

  if (documentRoot.body) {
    documentRoot.body.dataset.dnsFoundationRuntime = DNS_FOUNDATION_RUNTIME_VERSION;
    documentRoot.body.dataset.dnsDesignVersion = designSystem.version;
    documentRoot.body.dataset.dnsDesignSource = source;
  }

  if (options.primitives !== false) initDNSUIPrimitives();
  if (options.contentPatterns !== false) initDNSContentPatterns();
  if (options.dataUI !== false) initDNSDataUIRuntime(documentRoot);
  if (options.identityUI !== false) initDNSIdentityUIRuntime(documentRoot);
  if (options.assetUI !== false) initDNSAssetUIRuntime(documentRoot);
  if (options.capabilityUI !== false) initDNSCapabilityUIRuntime(documentRoot);

  const interaction =
    options.interaction === false
      ? null
      : initDNSInteractionRuntime({
          root: documentRoot,
          interaction: designSystem.interaction,
          motion: designSystem.motion,
        });

  const reveal =
    options.motion === false
      ? null
      : initDNSRevealRuntime({
          root: documentRoot,
          motion: designSystem.motion,
        });

  const semanticMotion =
    options.semanticMotion === false
      ? null
      : initDNSSemanticMotionRuntime({
          root: documentRoot,
          motion: designSystem.motion,
        });

  const defaultChromeEnabled = shellProfile === 'operational';
  const chrome =
    options.chrome === false || (options.chrome === undefined && !defaultChromeEnabled)
      ? null
      : initDNSToolChromeRuntime({
          ...(typeof options.chrome === 'object' ? options.chrome : {}),
          root: documentRoot,
          navigation: designSystem.navigation,
          responsive: designSystem.responsive,
          headerTokens: designSystem.header,
          motion: designSystem.motion,
        });

  const print =
    options.print === false
      ? null
      : initDNSPrintRuntime({
          root: documentRoot,
          profile: options.printProfile ?? 'operational-table',
        });

  const capabilityRuntime = createDNSCapabilityRuntime({
    declared: options.capabilities,
    adapters: options.capabilityAdapters,
    printNow: (profile) => print?.printNow(profile),
    language,
  });

  const defaultFooterEnabled = shell.profile.footer.required;
  if (options.footer !== false && (options.footer === true || defaultFooterEnabled)) {
    initDNSFooterRuntime(documentRoot);
  }

  const accessibilityConfig: DNSFoundationAccessibilityOptions =
    typeof options.accessibility === 'object'
      ? options.accessibility
      : { enabled: options.accessibility !== false };

  const accessibility = initDeferredAccessibility(
    documentRoot,
    language,
    accessibilityConfig,
  );

  const applyLanguage = (next: DNSUILanguage, emit = true) => {
    language = next === 'it' ? 'it' : DNS_DEFAULT_UI_LANGUAGE;
    documentRoot.documentElement.lang = language;
    documentRoot.documentElement.dataset.dnsLanguage = language;
    accessibility.setLanguage(language);

    if (persistLanguage) writeStoredLanguage(storageKey, language);

    if (emit) {
      listeners.forEach((listener) => listener(language));
      if (typeof CustomEvent === 'function') {
        documentRoot.dispatchEvent(
          new CustomEvent(DNS_FOUNDATION_LANGUAGE_EVENT, {
            detail: { language },
          }),
        );
      }
    }
  };

  applyLanguage(language, false);

  const handle: DNSFoundationRuntimeHandle = {
    version: DNS_FOUNDATION_RUNTIME_VERSION,
    designSystemVersion: designSystem.version,
    source,
    workspaceRuntime,
    capabilityRuntime,
    getLanguage() {
      return language;
    },
    setLanguage(next) {
      applyLanguage(next, true);
    },
    subscribeLanguage(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh() {
      shell.refresh();
      chrome?.refresh();
      reveal?.refresh();
      if (options.footer !== false && (options.footer === true || defaultFooterEnabled)) {
        initDNSFooterRuntime(documentRoot);
      }
    },
    playMotion(element, semantic, motionOptions) {
      return semanticMotion?.play(element, semantic, motionOptions) ?? null;
    },
    printNow(profile) {
      print?.printNow(profile);
    },
    disconnect() {
      chrome?.disconnect();
      reveal?.disconnect();
      semanticMotion?.disconnect();
      interaction?.disconnect();
      print?.disconnect();
      accessibility.disconnect();
      workspaceRuntime?.disconnect();
      shell.disconnect();
      listeners.clear();
      runtimeByDocument.delete(documentRoot);
      delete documentRoot.documentElement.dataset.dnsFoundationRuntime;
      if (documentRoot.body) delete documentRoot.body.dataset.dnsFoundationRuntime;
    },
  };

  runtimeByDocument.set(documentRoot, handle);
  return handle;
}
