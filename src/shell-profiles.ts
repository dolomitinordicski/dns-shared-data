export const DNS_SHELL_PROFILES_VERSION = '1.0.0' as const;

export const DNS_SHELL_PROFILE_IDS = ['operational', 'portal', 'workspace'] as const;
export type DNSShellProfileId = (typeof DNS_SHELL_PROFILE_IDS)[number];

export interface DNSShellRegionContract {
  id: string;
  required: boolean;
  description: string;
  selector?: string;
}

export interface DNSShellProfile {
  id: DNSShellProfileId;
  label: string;
  purpose: string;
  maxContentWidthPx: number | null;
  contentPadding: {
    desktopPx: number;
    tabletPx: number;
    mobilePx: number;
  };
  header: {
    mode: 'tool' | 'account-aware' | 'workspace';
    sticky: boolean;
    hideOnScrollDown: boolean;
    showAccountContext: boolean;
    showOrganizationContext: boolean;
    showLanguage: boolean;
    showAccessibility: boolean;
    showSessionAction: boolean;
    showSystemStatus: boolean;
  };
  navigation: {
    mode: 'tabs' | 'app' | 'workspace';
    desktop: 'horizontal' | 'sidebar' | 'workspace';
    mobile: 'horizontal-scroll' | 'drawer' | 'bottom-sheet';
    sticky: boolean;
  };
  footer: {
    mode: 'standard' | 'compact' | 'optional';
    required: boolean;
  };
  regions: readonly DNSShellRegionContract[];
  rules: readonly string[];
}

export const DNS_SHELL_PROFILES: Readonly<Record<DNSShellProfileId, DNSShellProfile>> = {
  operational: {
    id: 'operational',
    label: 'Operational',
    purpose: 'Dense operational tools such as FAIR, Analytics, Data Entry, Polls and Faktura.',
    maxContentWidthPx: 1440,
    contentPadding: {
      desktopPx: 32,
      tabletPx: 20,
      mobilePx: 16,
    },
    header: {
      mode: 'tool',
      sticky: true,
      hideOnScrollDown: true,
      showAccountContext: false,
      showOrganizationContext: false,
      showLanguage: true,
      showAccessibility: true,
      showSessionAction: false,
      showSystemStatus: true,
    },
    navigation: {
      mode: 'tabs',
      desktop: 'horizontal',
      mobile: 'horizontal-scroll',
      sticky: true,
    },
    footer: {
      mode: 'standard',
      required: true,
    },
    regions: [
      {
        id: 'header',
        required: true,
        selector: '[data-dns-tool-header]',
        description: 'Canonical DNS tool header.',
      },
      {
        id: 'navigation',
        required: false,
        selector: '[data-dns-tool-nav]',
        description: 'Optional tab/section navigation for operational modules.',
      },
      {
        id: 'main',
        required: true,
        selector: '[data-dns-shell-main], main',
        description: 'Operational application content.',
      },
      {
        id: 'footer',
        required: true,
        selector: '[data-dns-tool-footer]',
        description: 'Canonical shared footer.',
      },
    ],
    rules: [
      'Operational tools keep their domain-specific workflows and engines.',
      'Horizontal tab navigation is preferred over application sidebars.',
      'Dense data UI is allowed; Foundation geometry and primitives remain shared.',
      'Header may hide on scroll down while navigation remains available.',
    ],
  },

  portal: {
    id: 'portal',
    label: 'Portal',
    purpose: 'Authenticated Partner Portal and other account/organization-aware access layers.',
    maxContentWidthPx: 1440,
    contentPadding: {
      desktopPx: 32,
      tabletPx: 20,
      mobilePx: 16,
    },
    header: {
      mode: 'account-aware',
      sticky: true,
      hideOnScrollDown: false,
      showAccountContext: true,
      showOrganizationContext: true,
      showLanguage: true,
      showAccessibility: true,
      showSessionAction: true,
      showSystemStatus: false,
    },
    navigation: {
      mode: 'app',
      desktop: 'sidebar',
      mobile: 'drawer',
      sticky: true,
    },
    footer: {
      mode: 'standard',
      required: true,
    },
    regions: [
      {
        id: 'header',
        required: true,
        selector: '[data-dns-tool-header]',
        description: 'Account-aware DNS header with language/accessibility/session controls.',
      },
      {
        id: 'app-navigation',
        required: true,
        selector: '[data-dns-app-nav]',
        description: 'Portal service/application navigation.',
      },
      {
        id: 'context',
        required: false,
        selector: '[data-dns-organization-context]',
        description: 'Active organization/membership context when the user represents an organization.',
      },
      {
        id: 'main',
        required: true,
        selector: '[data-dns-shell-main], main',
        description: 'Authorized portal content.',
      },
      {
        id: 'footer',
        required: true,
        selector: '[data-dns-tool-footer]',
        description: 'Canonical shared footer.',
      },
    ],
    rules: [
      'Portal is an access layer and does not own canonical organization or user identity data.',
      'Account context and organization context are visually and semantically distinct.',
      'Organization switching must not change UI language automatically.',
      'Desktop may use application navigation; mobile collapses it into a drawer.',
      'Portal shell must not be forked into a separate visual identity.',
    ],
  },

  workspace: {
    id: 'workspace',
    label: 'Workspace',
    purpose: 'Creation/editing environments such as Flyer Studio.',
    maxContentWidthPx: null,
    contentPadding: {
      desktopPx: 0,
      tabletPx: 0,
      mobilePx: 0,
    },
    header: {
      mode: 'workspace',
      sticky: true,
      hideOnScrollDown: false,
      showAccountContext: true,
      showOrganizationContext: true,
      showLanguage: true,
      showAccessibility: true,
      showSessionAction: true,
      showSystemStatus: false,
    },
    navigation: {
      mode: 'workspace',
      desktop: 'workspace',
      mobile: 'bottom-sheet',
      sticky: true,
    },
    footer: {
      mode: 'optional',
      required: false,
    },
    regions: [
      {
        id: 'header',
        required: true,
        selector: '[data-dns-tool-header]',
        description: 'Canonical DNS workspace header.',
      },
      {
        id: 'toolbar',
        required: true,
        selector: '[data-dns-workspace-toolbar]',
        description: 'Foundation-owned authoring toolbar.',
      },
      {
        id: 'canvas',
        required: true,
        selector: '[data-dns-workspace-canvas]',
        description: 'Tool-owned creative/authoring canvas.',
      },
      {
        id: 'inspector',
        required: false,
        selector: '[data-dns-workspace-inspector]',
        description: 'Foundation-framed property/context inspector.',
      },
      {
        id: 'mobile-panel',
        required: false,
        selector: '[data-dns-workspace-mobile-panel]',
        description: 'Collapsed inspector/actions on small screens.',
      },
    ],
    rules: [
      'Foundation governs the authoring environment, not the authored artifact.',
      'Canvas content may use independent creative typography, color and layout rules.',
      'Toolbar, inspector, dialogs, forms, account, accessibility and language remain Foundation-owned.',
      'Desktop supports toolbar/canvas/inspector composition; mobile may collapse inspector/actions into a bottom sheet.',
      'Workspace shell must not introduce a separate DNS Design System.',
    ],
  },
} as const;

export function getDNSShellProfile(profile: DNSShellProfileId = 'operational'): DNSShellProfile {
  return DNS_SHELL_PROFILES[profile] ?? DNS_SHELL_PROFILES.operational;
}

export function isDNSShellProfileId(value: unknown): value is DNSShellProfileId {
  return typeof value === 'string' && (DNS_SHELL_PROFILE_IDS as readonly string[]).includes(value);
}
