/**
 * DNS Seasonal Operational Data v0.2
 *
 * Application-agnostic types for season-specific pricing, ticket orders,
 * ticket sales and cross-country track/KP reporting.
 *
 * Raw operational facts remain separate from derived Analytics/FAIR outputs.
 * Historical records are never destructively overwritten: provenance and
 * append-only revisions make source/method changes explicit.
 */

import type {
  OrganizationId,
  ReportingAreaId,
  SeasonId,
  DestinationId,
  LocalizedName,
} from './canonical-data.js';

export const SEASONAL_OPERATIONAL_SCHEMA_VERSION = 4 as const;

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

/**
 * Source/method metadata travels with operational records so historical
 * imports, manual Data Entry and future digital ticketing can coexist without
 * rewriting the past.
 */
export type DataSourceSystem =
  | 'legacy-sheet'
  | 'manual-data-entry'
  | 'digital-ticketing'
  | 'import'
  | 'other';

export type DataStatus =
  | 'draft'
  | 'submitted'
  | 'verified'
  | 'verified-with-notes'
  | 'corrected'
  | 'superseded';

export interface DataProvenance {
  sourceSystem: DataSourceSystem;
  /** Source-system identifier, spreadsheet row/cell reference, import key, etc. */
  sourceRecordId?: string;
  /** ISO timestamp when an external source was imported into DNS_Core. */
  importedAt?: string;
  /**
   * Version of the collection/calculation method, independent of schema
   * version. Example: legacy workbook = 1, digital ticketing = 2.
   */
  methodVersion: number;
  dataStatus: DataStatus;
}

export interface TicketPricingConfig {
  id: string;
  seasonId: SeasonId;
  productCode: TicketProductCode;
  scopeType: PricingScopeType;
  /**
   * network       -> "dolomiti-nordicski"
   * reportingArea -> canonical ReportingAreaId
   * organization  -> canonical OrganizationId
   */
  scopeId: string;
  salesChannel: TicketSalesChannel;
  salesPeriod?: TicketSalesPeriod;
  currency: CurrencyCode;
  /** Price presented/charged to the customer. Zero is valid. */
  unitPrice: number;
  /**
   * Accounting/settlement value used when it differs from customer price.
   * If omitted, unitPrice is used.
   */
  settlementUnitPrice?: number;
  validFrom?: string;
  validTo?: string;
  active: boolean;
  provenance?: DataProvenance;
  notes?: string;
}

export interface TicketPricingSnapshot {
  pricingConfigId: string;
  unitPrice: number;
  settlementUnitPrice: number;
  currency: CurrencyCode;
}

/**
 * Orders are operational distribution/billing-preparation facts.
 * They must never be interpreted as actual sales.
 */
export type OrderCatalogCategory = 'ticket' | 'wristband';

export interface OrderCatalogItem {
  id: string;
  seasonId: SeasonId;
  category: OrderCatalogCategory;
  /**
   * Stable technical code used by the UI/import layer. For ticket items this
   * can mirror a TicketProductCode; wristband codes remain season-specific.
   */
  code: string;
  label: LocalizedName;
  displayOrder: number;
  active: boolean;
  /**
   * Ticket items may map to the sales/pricing product model. Wristbands do not.
   */
  productCode?: TicketProductCode;
  /** Optional physical colour/reference code from supplier/order sheets. */
  physicalVariantCode?: string;
  /**
   * Season-specific visual legend used in the order UI. This is deliberately
   * part of the seasonal catalogue because wristband colours rotate between
   * seasons. displayColorHex is an approximate screen swatch, not a print spec.
   */
  displayColorHex?: string;
  displayTextColorHex?: string;
  supplierColorReference?: string;
  provenance?: DataProvenance;
  notes?: string;
}

export interface OrderFormConfig {
  id: string;
  seasonId: SeasonId;
  category: OrderCatalogCategory;
  catalogItemIds: readonly string[];
  organizationIds: readonly OrganizationId[];
  active: boolean;
  provenance?: DataProvenance;
  notes?: string;
}

export type TicketOrderStatus =
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'fulfilled'
  | 'cancelled';

export interface TicketOrder {
  id: string;
  seasonId: SeasonId;
  organizationId: OrganizationId;
  reportingAreaId?: ReportingAreaId;
  category: OrderCatalogCategory;
  /** Human/business order number when one exists. */
  orderNumber?: string;
  orderDate?: string;
  status: TicketOrderStatus;
  submittedAt?: string;
  confirmedAt?: string;
  fulfilledAt?: string;
  cancelledAt?: string;
  provenance: DataProvenance;
  notes?: string;
}

export interface PublicOrderShareSnapshot {
  seasonId: SeasonId;
  category: OrderCatalogCategory;
  generatedAt: string;
  title: LocalizedName;
  items: ReadonlyArray<{
    id: string;
    code: string;
    label: LocalizedName;
    displayOrder: number;
    displayColorHex?: string;
    displayTextColorHex?: string;
    supplierColorReference?: string;
  }>;
  organizations: ReadonlyArray<{
    organizationId: OrganizationId;
    sourceLabel: string;
  }>;
  cells: ReadonlyArray<{
    organizationId: OrganizationId;
    catalogItemId: string;
    quantity: number | null;
  }>;
  totalQuantity: number;
}

export interface PublicOrderShare {
  id: string;
  seasonId: SeasonId;
  category: OrderCatalogCategory;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  snapshot: PublicOrderShareSnapshot;
}

export interface TicketOrderLine {
  id: string;
  ticketOrderId: string;
  seasonId: SeasonId;
  organizationId: OrganizationId;
  reportingAreaId?: ReportingAreaId;
  /**
   * First-class reference to the season's order catalogue. This supports both
   * sellable ticket products and physical order material such as wristbands.
   */
  catalogItemId: string;
  /**
   * Optional shortcut for ticket catalogue items. Wristband lines deliberately
   * have no TicketProductCode.
   */
  productCode?: TicketProductCode;
  quantity: number;
  /**
   * Optional intended sales channel/period. Orders may be channel-agnostic;
   * these fields are only populated when the business process actually
   * distinguishes the ordered stock.
   */
  salesChannel?: TicketSalesChannel;
  salesPeriod?: TicketSalesPeriod;
  /**
   * Ticket lines can snapshot pricing for Billing Prep. Physical material
   * lines such as wristbands may have no ticket pricing at all.
   */
  pricing?: TicketPricingSnapshot;
  calculatedAmount?: number;
  provenance: DataProvenance;
  notes?: string;
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
  calculatedAmount: number;
  amountOverride?: number;
  amountOverrideReason?: string;
  /**
   * Optional traceability back to distributed stock. Historical/manual sales
   * may have no reliable order link and must remain valid without it.
   */
  ticketOrderId?: string;
  ticketOrderLineId?: string;
  fulfillmentBatchId?: string;
  provenance: DataProvenance;
  notes?: string;
}

export type SubmissionDomain = 'ticketOrders' | 'ticketSales' | 'kp';

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
  /** Physical/unique network kilometres reported by the source. */
  uniqueNetworkKm?: number;
  /**
   * Operational/potential kilometre base used for KPI denominators when it
   * differs from unique network kilometres.
   */
  potentialOperationalKm?: number;
}

/**
 * KP = Kunstschneeproduktion.
 * The canonical inputs are natural- and artificial-snow kilometres.
 * UI/Analytics may express their composition as NS/KS shares; potential km
 * remains a separate network-opening denominator and is not the KP value.
 */
export interface KpMilestoneValue {
  milestoneId: string;
  /** Total opened kilometres at this milestone. */
  openedKm: number;
  /** Opened kilometres relying on natural snow. Derived as openedKm - artificialSnowKm. */
  naturalSnowKm: number;
  /** Opened kilometres relying on artificial snow. */
  artificialSnowKm: number;
}

export interface KpFairValidation {
  id: string;
  seasonId: SeasonId;
  reportingAreaId: ReportingAreaId;
  milestoneId: string;
  /** Snapshot of the area-level FAIR candidate at validation time. */
  potentialOperationalKm: number;
  openedKm: number;
  naturalSnowKm: number;
  artificialSnowKm: number;
  revision: number;
  validatedBy: string;
  validatedAt: string;
}

export interface KpSeasonEntry {
  id: string;
  seasonId: SeasonId;
  entityType: KpEntityType;
  entityId: OrganizationId | DestinationId;
  reportingAreaId: ReportingAreaId;
  referenceKm: KpReferenceKm;
  milestones: readonly KpMilestoneValue[];
  includeInKp: boolean;
  exclusionReason?: string;
  provenance: DataProvenance;
  notes?: string;
}

/**
 * Corrections are append-only records. Verified historical source records are
 * not silently updated in place.
 */
export type RevisableEntityType =
  | 'ticketPricingConfig'
  | 'ticketOrder'
  | 'ticketOrderLine'
  | 'ticketSale'
  | 'kpEntry';

export type RevisionValue =
  | string
  | number
  | boolean
  | null
  | readonly RevisionValue[]
  | { readonly [key: string]: RevisionValue };

export interface OperationalRevision {
  id: string;
  seasonId: SeasonId;
  entityType: RevisableEntityType;
  entityId: string;
  /**
   * Dot path when correcting one field. Omit when the correction replaces a
   * complete logical record/version.
   */
  fieldPath?: string;
  originalValue: RevisionValue;
  correctedValue: RevisionValue;
  correctionReason: string;
  correctedAt: string;
  /** Future Auth UID or another stable administrator/reviewer principal ID. */
  correctedBy: string;
  correctionSource: DataSourceSystem;
  supersedesRevisionId?: string;
  notes?: string;
}

/**
 * Price resolution remains deterministic:
 * organization override > reporting-area override > network default.
 */
export const PRICING_SCOPE_PRECEDENCE = [
  'organization',
  'reportingArea',
  'network',
] as const satisfies readonly PricingScopeType[];

export const FIRESTORE_OPERATIONAL_COLLECTIONS = {
  pricingConfigs: 'pricingConfigs',
  orderCatalogItems: 'orderCatalogItems',
  orderSetupImports: 'orderSetupImports',
  publicOrderShares: 'publicOrderShares',
  orderFormConfigs: 'orderFormConfigs',
  ticketOrders: 'ticketOrders',
  ticketOrderLines: 'ticketOrderLines',
  ticketSales: 'ticketSales',
  kpMilestones: 'kpMilestones',
  kpEntries: 'kpEntries',
  kpFairValidations: 'kpFairValidations',
  seasonalSubmissions: 'seasonalSubmissions',
  operationalRevisions: 'operationalRevisions',
} as const;
