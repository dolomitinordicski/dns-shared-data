import {
  getDNSShellProfile,
  type DNSShellProfile,
  type DNSShellProfileId,
} from '../shell-profiles.js';

export const DNS_SHELL_RUNTIME_VERSION = '1.0.0' as const;

const STYLE_ID = 'dns-shell-runtime-style';

function ensureShellStyles(documentRoot: Document) {
  if (documentRoot.getElementById(STYLE_ID)) return;

  const style = documentRoot.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
:root {
  --dns-shell-max-width: 1440px;
  --dns-shell-padding-x: 32px;
  --dns-shell-padding-x-tablet: 20px;
  --dns-shell-padding-x-mobile: 16px;
}

[data-dns-shell-main] {
  box-sizing: border-box;
  width: 100%;
  margin-inline: auto;
  max-width: var(--dns-shell-max-width);
  padding-inline: var(--dns-shell-padding-x);
}

html[data-dns-shell-profile="workspace"] [data-dns-shell-main] {
  max-width: none;
  padding-inline: 0;
}

[data-dns-portal-layout] {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  min-height: 0;
}

[data-dns-app-nav] {
  min-width: 0;
}

[data-dns-workspace-layout] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

[data-dns-workspace-toolbar] {
  grid-column: 1 / -1;
  min-width: 0;
}

[data-dns-workspace-canvas] {
  min-width: 0;
  min-height: 0;
}

[data-dns-workspace-inspector] {
  min-width: 280px;
  max-width: min(380px, 36vw);
}

@media (max-width: 1023px) {
  [data-dns-shell-main] {
    padding-inline: var(--dns-shell-padding-x-tablet);
  }

  [data-dns-portal-layout] {
    grid-template-columns: 1fr;
  }

  [data-dns-app-nav] {
    display: none;
  }

  [data-dns-app-nav][data-dns-open="true"] {
    display: block;
  }

  [data-dns-workspace-layout] {
    grid-template-columns: minmax(0, 1fr);
  }

  [data-dns-workspace-inspector] {
    display: none;
  }

  [data-dns-workspace-mobile-panel][data-dns-open="true"] {
    display: block;
  }
}

@media (max-width: 767px) {
  [data-dns-shell-main] {
    padding-inline: var(--dns-shell-padding-x-mobile);
  }
}
`;
  documentRoot.head.appendChild(style);
}

export interface DNSShellRuntimeHandle {
  readonly profile: DNSShellProfile;
  refresh(): void;
  disconnect(): void;
}

export function initDNSShellRuntime(
  profileId: DNSShellProfileId = 'operational',
  documentRoot: Document = document,
): DNSShellRuntimeHandle {
  const profile = getDNSShellProfile(profileId);

  if (!documentRoot?.documentElement) {
    return {
      profile,
      refresh() {},
      disconnect() {},
    };
  }

  ensureShellStyles(documentRoot);

  const root = documentRoot.documentElement;
  root.dataset.dnsShellProfile = profile.id;
  root.dataset.dnsShellRuntime = DNS_SHELL_RUNTIME_VERSION;

  root.style.setProperty(
    '--dns-shell-max-width',
    profile.maxContentWidthPx === null ? 'none' : `${profile.maxContentWidthPx}px`,
  );
  root.style.setProperty('--dns-shell-padding-x', `${profile.contentPadding.desktopPx}px`);
  root.style.setProperty('--dns-shell-padding-x-tablet', `${profile.contentPadding.tabletPx}px`);
  root.style.setProperty('--dns-shell-padding-x-mobile', `${profile.contentPadding.mobilePx}px`);

  const refresh = () => {
    if (documentRoot.body) {
      documentRoot.body.dataset.dnsShellProfile = profile.id;
    }

    const main = documentRoot.querySelector<HTMLElement>('[data-dns-shell-main]');
    if (main) main.dataset.dnsShellProfile = profile.id;
  };

  refresh();

  return {
    profile,
    refresh,
    disconnect() {
      delete root.dataset.dnsShellProfile;
      delete root.dataset.dnsShellRuntime;
      if (documentRoot.body) delete documentRoot.body.dataset.dnsShellProfile;
    },
  };
}
