import type { OrganizationId, ReportingAreaId, SeasonId } from './canonical-data.js';

export const DNS_BILLING_PREPARATION_VERSION = '0.2.0' as const;

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

export interface BillingPreparationLine {
  id: string;
  seasonId: SeasonId;
  organizationId: OrganizationId;
  reportingAreaId?: ReportingAreaId;
  source: BillingSourceReference;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  included: boolean;
  notes?: string;
}

export interface BillingPreparationRun {
  id: string;
  seasonId: SeasonId;
  organizationId: OrganizationId;
  reportingAreaId?: ReportingAreaId;
  status: BillingPreparationStatus;
  lines: readonly BillingPreparationLine[];
  totalAmount: number;
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
