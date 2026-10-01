import { DNS_DESIGN_SYSTEM } from '../design-system.js';

export type DNSCoreHeaderStatus =
  | { state: 'loading' }
  | { state: 'ready'; reportingAreas: number; organizations: number }
  | { state: 'error' };

export type DNSHeaderLanguage = 'de' | 'it';

export function formatDNSCoreHeaderStatus(
  status: DNSCoreHeaderStatus,
  language: DNSHeaderLanguage,
) {
  const config = DNS_DESIGN_SYSTEM.header.standardShell.firebaseStatus;

  if (status.state === 'ready') {
    return {
      state: 'ready' as const,
      text: `${config.readyText[language]} · ${status.reportingAreas}/${status.organizations}`,
    };
  }

  if (status.state === 'error') {
    return {
      state: 'error' as const,
      text: config.errorText[language],
    };
  }

  return {
    state: 'loading' as const,
    text: config.loadingText[language],
  };
}
