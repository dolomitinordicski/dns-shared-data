import type { OrganizationId, ReportingAreaId, SeasonId } from './canonical-data.js';

export const DNS_BILLING_PREPARATION_VERSION = '0.5.0' as const;

export type BillingSourceType =
  | 'fair-membership'
  | 'idm-premium-partner'
  | 'order'
  | 'seasonal-extra';

export type BillingPreparationStatus = 'draft' | 'ready';

export interface BillingCommercialRateSource {
  documentLabel: string;
  supplier?: string;
  documentDate?: string;
  totalQuantity?: number;
  totalAmount?: number;
  packSize?: number;
  packPriceNet?: number;
  calculatedPurchaseUnitPrice?: number;
}

export interface BillingCommercialRate {
  id: string;
  seasonId: SeasonId;
  sourceType: 'order';
  catalogItemId: string;
  billingUnitPrice: number;
  currency: 'EUR';
  source: BillingCommercialRateSource;
  active: boolean;
  revision: number;
  notes?: string;
}

export interface BillingSourceReference {
  type: BillingSourceType;
  sourceId?: string;
  sourceLabel?: string;
}

export interface BillingSeasonalExtraSource {
  documentLabel: string;
  supplier?: string;
  documentDate?: string;
}

export interface BillingSeasonalExtra {
  id: string;
  seasonId: SeasonId;
  sourceType: 'seasonal-extra';
  organizationId: OrganizationId;
  reportingAreaId: ReportingAreaId;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  currency: 'EUR';
  source: BillingSeasonalExtraSource;
  active: boolean;
  revision: number;
  notes?: string;
}

export interface BillingPreparationLine {
  id: string;
  runId: string;
  runRevision: number;
  seasonId: SeasonId;
  organizationId: OrganizationId;
  reportingAreaId?: ReportingAreaId;
  source: BillingSourceReference;
  catalogItemId?: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  included: boolean;
  rateId?: string;
  rateRevision?: number;
  sourceDocumentLabel?: string;
  notes?: string;
}

export interface BillingPreparationRun {
  id: string;
  seasonId: SeasonId;
  organizationId: OrganizationId;
  reportingAreaId?: ReportingAreaId;
  status: BillingPreparationStatus;
  revision: number;
  sourceTypes: readonly BillingSourceType[];
  sourceOrderStatuses?: readonly string[];
  lineCount: number;
  billedQuantity: number;
  unpricedQuantity: number;
  totalAmount: number;
  generatedBy: string;
  generatedAt?: string;
  updatedAt?: string;
}

export const DNS_BILLING_SOURCE_TYPES = [
  {
    id: 'fair-membership',
    label: 'Mitgliedsbeitrag / FAIR',
    sourceDomain: 'FAIR',
  },
  {
    id: 'idm-premium-partner',
    label: 'IDM Premiumpartner',
    sourceDomain: 'DNS Commercial',
  },
  {
    id: 'order',
    label: 'Orders',
    sourceDomain: 'DNS Orders',
  },
  {
    id: 'seasonal-extra',
    label: 'Seasonal extras',
    sourceDomain: 'DNS Commercial',
  },
] as const;

export const DNS_BILLING_BOUNDARY = {
  purpose: 'Internal calculation and preparation of billable amounts by organization and reporting area.',
  createsOfficialInvoice: false,
  tracksPayment: false,
  integratesAccountingSoftware: false,
  ownsAccountingRecords: false,
} as const;
