export type DNSBrandEntityType =
  | 'reportingArea'
  | 'destination'
  | 'organization';

export interface DNSRegionLogoBinding {
  entityType: DNSBrandEntityType;
  entityId: string;
}

export interface DNSRegionLogoAsset {
  id: string;
  label: string;
  filename: string;
  composite?: boolean;
  priority?: 'primary' | 'secondary';
  entityBindings: readonly DNSRegionLogoBinding[];
  seasonIds?: readonly string[];
  sourceFile?: string;
  notes?: string;
}

export const DNS_REGION_LOGO_BASE_PATH = 'brand/regions' as const;

export function regionLogoPath(asset: Pick<DNSRegionLogoAsset, 'filename'>) {
  return `${DNS_REGION_LOGO_BASE_PATH}/${asset.filename}`;
}

export function findRegionLogosForEntity(
  assets: readonly DNSRegionLogoAsset[],
  entityType: DNSBrandEntityType,
  entityId: string,
) {
  return assets
    .filter((asset) =>
      asset.entityBindings.some(
        (binding) =>
          binding.entityType === entityType &&
          binding.entityId === entityId,
      ),
    )
    .sort((a, b) => {
      const rank = (value?: DNSRegionLogoAsset['priority']) =>
        value === 'primary' ? 0 : value === 'secondary' ? 2 : 1;
      return rank(a.priority) - rank(b.priority);
    });
}
