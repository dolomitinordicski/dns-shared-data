/**
 * DNS Seasonal Operational Data v0.1
 *
 * Application-agnostic types for season-specific pricing, ticket sales and
 * cross-country track/KP reporting. These interfaces intentionally model
 * raw operational facts separately from derived Analytics/FAIR outputs.
 */

import type {
  OrganizationId,
  ReportingAreaId,
  SeasonId,
  DestinationId,
} from './canonical-data.js';

export const SEASONAL_OPERATIONAL_SCHEMA_VERSION = 1 as const;

export type CurrencyCode = 'EUR';

export type TicketProductCode =
  | 'day'
  | 'wk-area'
  | 'wk-dns'
  | 'sk-area'
  | 'sk-dns'
  | 'sk-instructor';

export type TicketSalesChannel =
  | 'official'
  | 'online'
  | 'track'
  | 'press'
  | 'complimentary';

export type TicketSalesPeriod = 'presale' | 'regular';

export type PricingScopeType = 'network' | 'reportingArea' | 'organization';

export interface TicketPricingConfig {
  id: string;
  seasonId: SeasonId;
  productCode: TicketProductCode;
  scopeType: PricingScopeType;
  /**
   * network      -> "dolomiti-nordicski"
   * reportingArea -> canonical ReportingAreaId
   * organization -> canonical OrganizationId
   */
  scopeId: string;
  salesChannel: TicketSalesChannel;
  salesPeriod?: TicketSalesPeriod;
  currency: CurrencyCode;
  /**
   * Price presented/charged to the customer.
   * Zero is valid for press or complimentary tickets.
   */
  unitPrice: number;
  /**
   * Optional accounting/settlement value used for revenue reporting when it
   * differs from the customer price (e.g. region-funded complimentary passes).
   * If omitted, unitPrice is used.
   */
  settlementUnitPrice?: number;
  /**
   * Optional validity window. Required whenever a price changes during the
   * same season, e.g. presale vs regular sale periods.
   */
  validFrom?: string;
  validTo?: string;
  active: boolean;
  notes?: string;
}

export interface TicketPricingSnapshot {
  pricingConfigId: string;
  unitPrice: number;
  settlementUnitPrice: number;
  currency: CurrencyCode;
}

export interface TicketSalesEntry {
  id: string;
  seasonId: SeasonId;
  organizationId: OrganizationId;
  reportingAreaId: ReportingAreaId;
  destinationId?: DestinationId;
  productCode: TicketProductCode;
  salesChannel: TicketSalesChannel;
  salesPeriod?: TicketSalesPeriod;
  quantity: number;
  pricing: TicketPricingSnapshot;
  /**
   * Computed as quantity * pricing.settlementUnitPrice.
   * Persisting the snapshot makes historical results stable even if a future
   * season's pricing changes.
   */
  calculatedAmount: number;
  /**
   * Exceptional manual accounting correction. This must never silently replace
   * the calculated amount: an explicit reason is mandatory.
   */
  amountOverride?: number;
  amountOverrideReason?: string;
  notes?: string;
}

export type SubmissionDomain = 'ticketSales' | 'kp';

export type SubmissionStatus = 'draft' | 'submitted' | 'verified';

export interface SeasonalSubmission {
  id: string;
  seasonId: SeasonId;
  organizationId: OrganizationId;
  domain: SubmissionDomain;
  status: SubmissionStatus;
  submittedAt?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface KpMilestone {
  id: string;
  seasonId: SeasonId;
  date: string;
  label?: string;
  order: number;
}

export type KpEntityType = 'organization' | 'destination';

export interface KpReferenceKm {
  /**
   * Physical/unique network kilometres reported by the source.
   */
  uniqueNetworkKm?: number;
  /**
   * Operational/potential kilometre base used for KPI denominators when it
   * differs from the unique network kilometres.
   */
  potentialOperationalKm?: number;
}

export interface KpMilestoneValue {
  milestoneId: string;
  naturalSnowKm: number;
  artificialSnowKm: number;
}

export interface KpSeasonEntry {
  id: string;
  seasonId: SeasonId;
  entityType: KpEntityType;
  entityId: OrganizationId | DestinationId;
  reportingAreaId: ReportingAreaId;
  referenceKm: KpReferenceKm;
  milestones: readonly KpMilestoneValue[];
  /**
   * Some entities can be intentionally excluded from a KPI while their raw
   * values remain stored (e.g. event-reserved tracks).
   */
  includeInKp: boolean;
  exclusionReason?: string;
  notes?: string;
}

/**
 * Price resolution must be deterministic:
 * organization override > reporting-area override > network default.
 * Within the selected scope, channel/period and validity window must match.
 */
export const PRICING_SCOPE_PRECEDENCE = [
  'organization',
  'reportingArea',
  'network',
] as const satisfies readonly PricingScopeType[];

export const FIRESTORE_OPERATIONAL_COLLECTIONS = {
  pricingConfigs: 'pricingConfigs',
  ticketSales: 'ticketSales',
  kpMilestones: 'kpMilestones',
  kpEntries: 'kpEntries',
  seasonalSubmissions: 'seasonalSubmissions',
} as const;
