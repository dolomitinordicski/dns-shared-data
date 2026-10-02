export const DNS_ASSET_CONTRACT_VERSION = '1.0.0' as const;

export const DNS_ASSET_TYPE_IDS = [
  'brand',
  'region-logo',
  'organization-logo',
  'graphic',
  'icon',
  'photo',
  'template',
  'document',
] as const;
export type DNSAssetType = (typeof DNS_ASSET_TYPE_IDS)[number];

export const DNS_ASSET_STATUS_IDS = [
  'draft',
  'active',
  'deprecated',
  'archived',
] as const;
export type DNSAssetStatus = (typeof DNS_ASSET_STATUS_IDS)[number];

export const DNS_ASSET_USAGE_IDS = [
  'web',
  'print',
  'portal',
  'workspace',
  'export',
  'download',
] as const;
export type DNSAssetUsage = (typeof DNS_ASSET_USAGE_IDS)[number];

export type DNSAssetLanguage = 'de' | 'it' | 'bilingual' | 'neutral';

export type DNSAssetOwnerType =
  | 'network'
  | 'reportingArea'
  | 'destination'
  | 'organization'
  | 'system';

export interface DNSAssetRecord {
  assetId: string;
  type: DNSAssetType;
  label: string;
  path: string;
  mimeType: string;
  status: DNSAssetStatus;
  ownerType: DNSAssetOwnerType;
  ownerId?: string;
  language: DNSAssetLanguage;
  usages: readonly DNSAssetUsage[];
  variant?: string;
  aspectRatio?: string;
  widthPx?: number;
  heightPx?: number;
  seasonIds?: readonly string[];
  sourceFile?: string;
  checksum?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DNS_ASSET_RULES = [
  'Asset IDs are stable identifiers and must not be derived from localized labels.',
  'Canonical assets must have a declared owner context and explicit usage.',
  'Do not add guessed, scraped or unofficial logos as canonical assets.',
  'Brand and logo assets may have web/print variants without changing entity identity.',
  'Asset metadata may be canonical even when binary storage is repository- or platform-hosted.',
  'Portal and Workspace consume asset metadata; they do not become asset source-of-truth owners.',
  'Creative templates are assets, but creative output remains tool-owned.',
] as const;

export function assetSupportsUsage(asset: Pick<DNSAssetRecord, 'usages'>, usage: DNSAssetUsage) {
  return asset.usages.includes(usage);
}
