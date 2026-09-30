/**
 * DNS Canonical Dataset v1.5
 *
 * Shared, application-agnostic master data for the Dolomiti NordicSki
 * digital ecosystem.
 *
 * IMPORTANT
 * - Canonical IDs are technical identifiers: lowercase, ASCII, kebab-case.
 * - Human-facing names remain properly capitalised and may be localised.
 * - Existing production data must be mapped through aliases, not renamed
 *   destructively.
 * - This file contains no Firebase-specific code by design.
 */

export const CANONICAL_DATASET_VERSION = '1.5' as const;
export const CANONICAL_SCHEMA_VERSION = 1 as const;

export type Language = 'de' | 'it' | 'en';

export type CanonicalScopeType =
  | 'network'
  | 'reportingArea'
  | 'destination'
  | 'organization';

export type IdentityStatus = 'verified' | 'provisional';

export type OrganizationType =
  | 'network-operator'
  | 'tourism-organisation'
  | 'accommodation'
  | 'ski-school'
  | 'sports-organisation'
  | 'service-provider'
  | 'technology-provider'
  | 'mobility-provider'
  | 'institution'
  | 'sponsor'
  | 'other';

export type RelationshipType =
  | 'dns-member'
  | 'fair-contributor'
  | 'regional-manager'
  | 'b2b-partner'
  | 'accommodation-partner'
  | 'ticket-reseller'
  | 'supplier'
  | 'technology-partner'
  | 'marketing-partner'
  | 'sponsor';

export interface LocalizedName {
  de: string;
  it: string;
  en: string;
}

export interface ReportingArea {
  id: string;
  canonicalName: string;
  localizedName: LocalizedName;
  aliases: string[];
  legacyRefs: {
    fair?: string[];
    analytics?: string[];
    partnerPortal?: string[];
  };
  active: boolean;
}

export interface Destination {
  id: string;
  canonicalName: string;
  localizedName: LocalizedName;
  reportingAreaId: string;
  parentDestinationId?: string;
  aliases?: string[];
  active: boolean;
}

export interface Organization {
  id: string;
  canonicalName: string;
  localizedName?: Partial<LocalizedName>;
  organizationType: OrganizationType;
  reportingAreaIds: string[];
  destinationIds: string[];
  relationshipTypes: RelationshipType[];
  identityStatus: IdentityStatus;
  /**
   * Primary organization logo filename stored in assets/organization-logos/.
   * Keep null until a verified logo asset has been added to the repository.
   */
  logoFile: string | null;
  aliases?: string[];
  active: boolean;
}

export const ORGANIZATION_LOGO_DIRECTORY = 'assets/organization-logos' as const;

export interface Season {
  id: string;
  label: LocalizedName;
  status: 'historical' | 'active' | 'future';
}

export const REPORTING_AREAS = [
  {
    id: 'osttirol',
    canonicalName: 'Osttirol',
    localizedName: {
      de: 'Osttirol',
      it: 'Tirolo Orientale',
      en: 'East Tyrol',
    },
    aliases: ['Osttirol'],
    legacyRefs: {
      fair: ['Osttirol'],
      analytics: ['Osttirol'],
      partnerPortal: ['osttirol'],
    },
    active: true,
  },
  {
    id: 'drei-zinnen',
    canonicalName: '3 Zinnen Dolomites',
    localizedName: {
      de: '3 Zinnen Dolomites',
      it: '3 Cime Dolomiti',
      en: '3 Zinnen Dolomites',
    },
    aliases: ['3 Zinnen', '3 Zinnen Dolomites', '3 Cime Dolomiti'],
    legacyRefs: {
      fair: ['3 Zinnen Dolomites'],
      analytics: ['3 Zinnen', '3 Zinnen Dolomites'],
      partnerPortal: ['3zinnen'],
    },
    active: true,
  },
  {
    id: 'cortina-d-ampezzo',
    canonicalName: "Cortina d'Ampezzo",
    localizedName: {
      de: "Cortina d'Ampezzo",
      it: "Cortina d'Ampezzo",
      en: "Cortina d'Ampezzo",
    },
    aliases: ['Cortina', "Cortina d'Ampezzo"],
    legacyRefs: {
      fair: ["Cortina d'Ampezzo"],
      analytics: ['Cortina', "Cortina d'Ampezzo"],
      partnerPortal: ['cortina'],
    },
    active: true,
  },
  {
    id: 'val-comelico',
    canonicalName: 'Val Comelico',
    localizedName: {
      de: 'Val Comelico',
      it: 'Val Comelico',
      en: 'Val Comelico',
    },
    aliases: ['Comelico', 'Val Comelico'],
    legacyRefs: {
      fair: ['Comelico'],
      analytics: ['Comelico'],
      partnerPortal: ['comelico'],
    },
    active: true,
  },
  {
    id: 'gsiesertal-welsberg-taisten',
    canonicalName: 'Gsiesertal / Welsberg / Taisten',
    localizedName: {
      de: 'Gsiesertal / Welsberg / Taisten',
      it: 'Val Casies / Monguelfo / Tesido',
      en: 'Gsiesertal / Welsberg / Taisten',
    },
    aliases: [
      'Gsiesertal',
      'Gsiesertal / Welsberg / Taisten',
      'Val Casies / Monguelfo / Tesido',
    ],
    legacyRefs: {
      fair: ['Gsiesertal / Welsberg / Taisten'],
      analytics: ['Gsiesertal', 'Gsiesertal / Welsberg / Taisten'],
      partnerPortal: ['gsieser'],
    },
    active: true,
  },
  {
    id: 'antholzertal',
    canonicalName: 'Antholzertal',
    localizedName: {
      de: 'Antholzertal',
      it: 'Valle Anterselva',
      en: 'Antholz Valley',
    },
    aliases: ['Antholzertal', 'Valle Anterselva', 'Antholzertal/OK Biathlon'],
    legacyRefs: {
      fair: ['Antholzertal'],
      analytics: ['Antholzertal', 'Antholzertal/OK Biathlon'],
      partnerPortal: ['antholz'],
    },
    active: true,
  },
  {
    id: 'ahrntal',
    canonicalName: 'Ahrntal',
    localizedName: {
      de: 'Ahrntal',
      it: 'Valle Aurina',
      en: 'Ahrntal',
    },
    aliases: ['Ahrntal', 'Ahrntal+Sand', 'Ahrntal / Sand in Taufers'],
    legacyRefs: {
      fair: ['Ahrntal / Sand in Taufers'],
      analytics: ['Ahrntal', 'Ahrntal+Sand', 'Ahrntal / Sand in Taufers'],
      partnerPortal: ['ahrntal'],
    },
    active: true,
  },
  {
    id: 'seiser-alm-dolomites-val-gardena',
    canonicalName: 'Seiser Alm Dolomites Val Gardena',
    localizedName: {
      de: 'Seiser Alm Dolomites Val Gardena',
      it: 'Seiser Alm Dolomites Val Gardena',
      en: 'Seiser Alm Dolomites Val Gardena',
    },
    aliases: [
      'Seiser Alm / Val Gardena',
      'Seiser Alm/Gard',
      'Seiser Alm Dolomites Val Gardena',
    ],
    legacyRefs: {
      fair: ['Seiser Alm / Val Gardena'],
      analytics: ['Seiser Alm / Val Gardena', 'Seiser Alm/Gard'],
      partnerPortal: ['seiseralm'],
    },
    active: true,
  },
] as const satisfies readonly ReportingArea[];

export type ReportingAreaId = (typeof REPORTING_AREAS)[number]['id'];

export const DESTINATIONS = [
  {
    id: 'osttirol',
    canonicalName: 'Osttirol',
    localizedName: {
      de: 'Osttirol',
      it: 'Tirolo Orientale',
      en: 'East Tyrol',
    },
    reportingAreaId: 'osttirol',
    aliases: ['Osttirol'],
    active: true,
  },
  {
    id: 'obertilliach',
    canonicalName: 'Obertilliach',
    localizedName: {
      de: 'Obertilliach',
      it: 'Obertilliach',
      en: 'Obertilliach',
    },
    reportingAreaId: 'osttirol',
    parentDestinationId: 'osttirol',
    aliases: ['Osttirol-Obert.', 'Obertilliach'],
    active: true,
  },
  {
    id: 'toblach',
    canonicalName: 'Toblach',
    localizedName: {
      de: 'Toblach',
      it: 'Dobbiaco',
      en: 'Toblach',
    },
    reportingAreaId: 'drei-zinnen',
    aliases: ['3ZD - Toblach', 'Dobbiaco'],
    active: true,
  },
  {
    id: 'innichen',
    canonicalName: 'Innichen',
    localizedName: {
      de: 'Innichen',
      it: 'San Candido',
      en: 'Innichen',
    },
    reportingAreaId: 'drei-zinnen',
    aliases: ['3ZD - Innichen', 'San Candido'],
    active: true,
  },
  {
    id: 'sexten',
    canonicalName: 'Sexten',
    localizedName: {
      de: 'Sexten',
      it: 'Sesto',
      en: 'Sexten',
    },
    reportingAreaId: 'drei-zinnen',
    aliases: ['3ZD - Sexten', 'Sesto'],
    active: true,
  },
  {
    id: 'niederdorf',
    canonicalName: 'Niederdorf',
    localizedName: {
      de: 'Niederdorf',
      it: 'Villabassa',
      en: 'Niederdorf',
    },
    reportingAreaId: 'drei-zinnen',
    aliases: ['3ZD - Niederdorf', 'Villabassa'],
    active: true,
  },
  {
    id: 'prags',
    canonicalName: 'Prags',
    localizedName: {
      de: 'Prags',
      it: 'Braies',
      en: 'Prags',
    },
    reportingAreaId: 'drei-zinnen',
    aliases: ['3ZD - Braies', 'Braies'],
    active: true,
  },
  {
    id: 'cortina-d-ampezzo',
    canonicalName: "Cortina d'Ampezzo",
    localizedName: {
      de: "Cortina d'Ampezzo",
      it: "Cortina d'Ampezzo",
      en: "Cortina d'Ampezzo",
    },
    reportingAreaId: 'cortina-d-ampezzo',
    aliases: ['Cortina'],
    active: true,
  },
  {
    id: 'val-comelico',
    canonicalName: 'Val Comelico',
    localizedName: {
      de: 'Val Comelico',
      it: 'Val Comelico',
      en: 'Val Comelico',
    },
    reportingAreaId: 'val-comelico',
    aliases: ['Comelico', 'Val Comelico'],
    active: true,
  },
  {
    id: 'gsiesertal',
    canonicalName: 'Gsiesertal',
    localizedName: {
      de: 'Gsiesertal',
      it: 'Val Casies',
      en: 'Gsiesertal',
    },
    reportingAreaId: 'gsiesertal-welsberg-taisten',
    aliases: ['Val Casies'],
    active: true,
  },
  {
    id: 'welsberg-taisten',
    canonicalName: 'Welsberg-Taisten',
    localizedName: {
      de: 'Welsberg-Taisten',
      it: 'Monguelfo-Tesido',
      en: 'Welsberg-Taisten',
    },
    reportingAreaId: 'gsiesertal-welsberg-taisten',
    aliases: ['Monguelfo-Tesido'],
    active: true,
  },
  {
    id: 'antholzertal',
    canonicalName: 'Antholzertal',
    localizedName: {
      de: 'Antholzertal',
      it: 'Valle Anterselva',
      en: 'Antholz Valley',
    },
    reportingAreaId: 'antholzertal',
    aliases: ['Valle Anterselva'],
    active: true,
  },
  {
    id: 'ahrntal',
    canonicalName: 'Ahrntal',
    localizedName: {
      de: 'Ahrntal',
      it: 'Valle Aurina',
      en: 'Ahrntal',
    },
    reportingAreaId: 'ahrntal',
    aliases: ['Valle Aurina'],
    active: true,
  },
  {
    id: 'sand-in-taufers',
    canonicalName: 'Sand in Taufers',
    localizedName: {
      de: 'Sand in Taufers',
      it: 'Campo Tures',
      en: 'Sand in Taufers',
    },
    reportingAreaId: 'ahrntal',
    aliases: ['Campo Tures'],
    active: true,
  },
  {
    id: 'seiser-alm',
    canonicalName: 'Seiser Alm',
    localizedName: {
      de: 'Seiser Alm',
      it: 'Alpe di Siusi',
      en: 'Seiser Alm',
    },
    reportingAreaId: 'seiser-alm-dolomites-val-gardena',
    aliases: ['Alpe di Siusi'],
    active: true,
  },
  {
    id: 'val-gardena',
    canonicalName: 'Val Gardena',
    localizedName: {
      de: 'Gröden',
      it: 'Val Gardena',
      en: 'Val Gardena',
    },
    reportingAreaId: 'seiser-alm-dolomites-val-gardena',
    aliases: ['Gröden'],
    active: true,
  },
] as const satisfies readonly Destination[];

export type DestinationId = (typeof DESTINATIONS)[number]['id'];

export const ORGANIZATIONS = [
  {
    id: 'dolomiti-nordicski',
    canonicalName: 'Dolomiti NordicSki',
    organizationType: 'network-operator',
    reportingAreaIds: [],
    destinationIds: [],
    relationshipTypes: [],
    identityStatus: 'verified',
    logoFile: null,
    active: true,
  },
  {
    id: 'tvb-osttirol',
    canonicalName: 'Tourismusverband Osttirol',
    localizedName: {
      de: 'Tourismusverband Osttirol',
      it: 'Tourismusverband Osttirol',
      en: 'Tourismusverband Osttirol',
    },
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['osttirol'],
    destinationIds: ['osttirol'],
    relationshipTypes: ['dns-member', 'fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['TVB Osttirol', 'Osttirol'],
    active: true,
  },
  {
    id: 'tv-sexten',
    canonicalName: 'Tourismusverein Sexten',
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['drei-zinnen'],
    destinationIds: ['sexten'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['TV Sexten'],
    active: true,
  },
  {
    id: 'tv-innichen',
    canonicalName: 'Tourismusverein Innichen',
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['drei-zinnen'],
    destinationIds: ['innichen'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['TV Innichen'],
    active: true,
  },
  {
    id: 'tv-toblach',
    canonicalName: 'Tourismusverein Toblach',
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['drei-zinnen'],
    destinationIds: ['toblach'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['TV Toblach'],
    active: true,
  },
  {
    id: 'tv-niederdorf',
    canonicalName: 'Tourismusverein Niederdorf',
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['drei-zinnen'],
    destinationIds: ['niederdorf'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['TV Niederdorf'],
    active: true,
  },
  {
    id: 'tv-prags',
    canonicalName: 'Tourismusverein Prags',
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['drei-zinnen'],
    destinationIds: ['prags'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['TV Prags'],
    active: true,
  },
  {
    id: 'biathlon-antholz',
    canonicalName: 'Biathlon Weltcup Komitee / Comitato Coppa del Mondo di Biathlon',
    organizationType: 'sports-organisation',
    reportingAreaIds: ['antholzertal'],
    destinationIds: ['antholzertal'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['Biathlon Antholz', 'Biathlon Committee Antholz', 'OK Biathlon Antholz'],
    active: true,
  },
  {
    id: 'antholzertal',
    canonicalName: 'Tourismusgenossenschaft Antholzertal',
    localizedName: {
      de: 'Tourismusgenossenschaft Antholzertal',
      it: 'Associazione Turistica Valle Anterselva',
      en: 'Antholzertal Tourism Cooperative',
    },
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['antholzertal'],
    destinationIds: ['antholzertal'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['Antholzertal', 'Tourismusverein Antholzertal'],
    active: true,
  },
  {
    id: 'ahrntal',
    canonicalName: 'Tourismusverein Ahrntal',
    localizedName: {
      de: 'Tourismusverein Ahrntal',
      it: 'Associazione Turistica Valle Aurina',
      en: 'Ahrntal Tourist Association',
    },
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['ahrntal'],
    destinationIds: ['ahrntal'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['Ahrntal'],
    active: true,
  },
  {
    id: 'sand-in-taufers',
    canonicalName: 'Tourismusverein Sand in Taufers',
    localizedName: {
      de: 'Tourismusverein Sand in Taufers',
      it: 'Associazione Turistica Campo Tures',
      en: 'Sand in Taufers Tourist Association',
    },
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['ahrntal'],
    destinationIds: ['sand-in-taufers'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['Sand in Taufers', 'Campo Tures'],
    active: true,
  },
  {
    id: 'seiser-alm-marketing',
    canonicalName: 'Seiser Alm Marketing',
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['seiser-alm-dolomites-val-gardena'],
    destinationIds: ['seiser-alm'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['Seiser Alm', 'Alpe di Siusi', 'Seiser Alm Marketing Gen.'],
    active: true,
  },
  {
    id: 'val-gardena',
    canonicalName: 'DOLOMITES Val Gardena',
    localizedName: {
      de: 'DOLOMITES Val Gardena',
      it: 'DOLOMITES Val Gardena',
      en: 'DOLOMITES Val Gardena',
    },
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['seiser-alm-dolomites-val-gardena'],
    destinationIds: ['val-gardena'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['Val Gardena', 'Dolomites Val Gardena S.c.a.r.l.'],
    active: true,
  },
  {
    id: 'servizi-ampezzo',
    canonicalName: 'Servizi Ampezzo',
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['cortina-d-ampezzo'],
    destinationIds: ['cortina-d-ampezzo'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['Cortina', 'Cortina Marketing', "Cortina d'Ampezzo"],
    active: true,
  },
  {
    id: 'val-comelico',
    canonicalName: 'Consorzio Turistico Val Comelico Dolomiti',
    localizedName: {
      de: 'Consorzio Turistico Val Comelico Dolomiti',
      it: 'Consorzio Turistico Val Comelico Dolomiti',
      en: 'Val Comelico Dolomiti Tourist Consortium',
    },
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['val-comelico'],
    destinationIds: ['val-comelico'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['Comelico', 'Val Comelico'],
    active: true,
  },
  {
    id: 'gsiesertal-welsberg-taisten',
    canonicalName: 'Tourismusgenossenschaft Gsiesertal-Welsberg-Taisten',
    localizedName: {
      de: 'Tourismusgenossenschaft Gsiesertal-Welsberg-Taisten',
      it: 'Associazione Turistica Val Casies-Monguelfo-Tesido',
      en: 'Gsiesertal-Welsberg-Taisten Tourism Cooperative',
    },
    organizationType: 'tourism-organisation',
    reportingAreaIds: ['gsiesertal-welsberg-taisten'],
    destinationIds: ['gsiesertal', 'welsberg-taisten'],
    relationshipTypes: ['fair-contributor'],
    identityStatus: 'verified',
    logoFile: null,
    aliases: ['Gsiesertal / Welsberg / Taisten', 'Gsiesertal'],
    active: true,
  },
] as const satisfies readonly Organization[];

export type OrganizationId = (typeof ORGANIZATIONS)[number]['id'];

export function getOrganizationLogoPath(
  organization: Pick<Organization, 'logoFile'>,
): string | undefined {
  return organization.logoFile
    ? `${ORGANIZATION_LOGO_DIRECTORY}/${organization.logoFile}`
    : undefined;
}

export const SEASONS = [
  {
    id: '2022-23',
    label: {
      de: 'Winter 2022/23',
      it: 'Inverno 2022/23',
      en: 'Winter 2022/23',
    },
    status: 'historical',
  },
  {
    id: '2023-24',
    label: {
      de: 'Winter 2023/24',
      it: 'Inverno 2023/24',
      en: 'Winter 2023/24',
    },
    status: 'historical',
  },
  {
    id: '2024-25',
    label: {
      de: 'Winter 2024/25',
      it: 'Inverno 2024/25',
      en: 'Winter 2024/25',
    },
    status: 'historical',
  },
  {
    id: '2025-26',
    label: {
      de: 'Winter 2025/26',
      it: 'Inverno 2025/26',
      en: 'Winter 2025/26',
    },
    status: 'historical',
  },
  {
    id: '2026-27',
    label: {
      de: 'Winter 2026/27',
      it: 'Inverno 2026/27',
      en: 'Winter 2026/27',
    },
    status: 'active',
  },
] as const satisfies readonly Season[];

export type SeasonId = (typeof SEASONS)[number]['id'];

const normalizeLegacyKey = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/\s+/g, ' ');

const REPORTING_AREA_ALIAS_ENTRIES: ReadonlyArray<
  readonly [string, ReportingAreaId]
> = REPORTING_AREAS.flatMap((area) => {
  const values = new Set<string>([
    area.id,
    area.canonicalName,
    area.localizedName.de,
    area.localizedName.it,
    area.localizedName.en,
    ...area.aliases,
    ...(area.legacyRefs.fair ?? []),
    ...(area.legacyRefs.analytics ?? []),
    ...(area.legacyRefs.partnerPortal ?? []),
  ]);

  return [...values].map(
    (value) => [normalizeLegacyKey(value), area.id] as const,
  );
});

export const REPORTING_AREA_ALIAS_MAP = Object.freeze(
  Object.fromEntries(REPORTING_AREA_ALIAS_ENTRIES),
) as Readonly<Record<string, ReportingAreaId>>;

export function resolveReportingAreaId(
  value: string,
): ReportingAreaId | undefined {
  return REPORTING_AREA_ALIAS_MAP[normalizeLegacyKey(value)];
}

export const REPORTING_AREA_BY_ID = Object.freeze(
  Object.fromEntries(REPORTING_AREAS.map((area) => [area.id, area])),
) as Readonly<Record<ReportingAreaId, (typeof REPORTING_AREAS)[number]>>;

export const DESTINATION_BY_ID = Object.freeze(
  Object.fromEntries(
    DESTINATIONS.map((destination) => [destination.id, destination]),
  ),
) as Readonly<Record<DestinationId, (typeof DESTINATIONS)[number]>>;

export const ORGANIZATION_BY_ID = Object.freeze(
  Object.fromEntries(
    ORGANIZATIONS.map((organization) => [organization.id, organization]),
  ),
) as Readonly<Record<OrganizationId, (typeof ORGANIZATIONS)[number]>>;

export const SEASON_BY_ID = Object.freeze(
  Object.fromEntries(SEASONS.map((season) => [season.id, season])),
) as Readonly<Record<SeasonId, (typeof SEASONS)[number]>>;

/**
 * Temporary migration note:
 *
 * Current Analytics contains a legacy operational row named
 * "Osttirol-Obert." alongside "Osttirol". The exact non-overlapping scope
 * of the former/current Osttirol row must be established during the
 * Analytics merge before either row is promoted into a more specific
 * canonical analytical scope.
 */
export const ANALYTICS_MIGRATION_NOTES = {
  osttirolOperationalSplit: {
    status: 'needs-review',
    legacyScopes: ['Osttirol', 'Osttirol-Obert.'],
  },
} as const;
