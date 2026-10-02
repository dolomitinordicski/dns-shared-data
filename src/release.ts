import { DNS_DESIGN_SYSTEM_VERSION } from './design-system.js';
import { DNS_DATA_CONTRACTS_VERSION } from './data-contracts.js';
import { DNS_FOUNDATION_RUNTIME_VERSION } from './foundation.js';

export const DNS_FOUNDATION_RELEASE_VERSION = '1.1.1' as const;
export const DNS_FOUNDATION_RELEASE_CHANNEL = 'stable' as const;
export const DNS_FOUNDATION_RELEASE_STATUS = 'frozen' as const;
export const DNS_FOUNDATION_RELEASE_REF = 'release/v1.1.1' as const;

export const DNS_FOUNDATION_RELEASE = {
  version: DNS_FOUNDATION_RELEASE_VERSION,
  ref: DNS_FOUNDATION_RELEASE_REF,
  refType: 'immutable-release-branch',
  channel: DNS_FOUNDATION_RELEASE_CHANNEL,
  status: DNS_FOUNDATION_RELEASE_STATUS,
  releasedAt: '2026-10-02',
  components: {
    foundationRuntime: DNS_FOUNDATION_RUNTIME_VERSION,
    designSystem: DNS_DESIGN_SYSTEM_VERSION,
    dataContracts: DNS_DATA_CONTRACTS_VERSION,
    capabilities: '1.0.0',
  },
  compatibleShellProfiles: ['operational', 'portal', 'workspace'],
  supportedUILanguages: ['de', 'it'],
  pinning: {
    required: true,
    preferredRef: DNS_FOUNDATION_RELEASE_REF,
    prohibitedRefs: ['main', 'master', 'raw-commit-sha'],
  },
  freezeRules: [
    'Consumer migrations target the stable Foundation release rather than main or arbitrary commit SHAs.',
    'Breaking shared-runtime or contract changes require a new MAJOR Foundation release.',
    'Backward-compatible shared feature additions require a MINOR Foundation release.',
    'Bug fixes that preserve contracts require a PATCH Foundation release.',
    'Design System and Data Contracts keep their own component versions inside the Foundation release manifest.',
    'Consumer-local Foundation forks, token fallbacks and duplicated shared runtimes remain migration debt.',
  ],
} as const;

export type DNSFoundationRelease = typeof DNS_FOUNDATION_RELEASE;
