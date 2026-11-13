/** Server-owned product catalog. These stable passDesign values identify
 * approved presentation models; they are not graphic assets or browser input.
 * Add a product only after its Data Entry code and design are confirmed. */
const freezeDefinition = definition => Object.freeze({
  ...definition,
  enabledSeasons: Object.freeze([...definition.enabledSeasons]),
  pilotEligibility: Object.freeze({ ...definition.pilotEligibility }),
  wallet: Object.freeze({ ...definition.wallet }),
});

export const DIGITAL_PASS_PRODUCT_REGISTRY = Object.freeze({
  'sk-dns': freezeDefinition({
    productCode: 'sk-dns',
    enabledSeasons: ['2026-27'],
    passDesign: 'dns-seasonal',
    pilotEligibility: { dnsSeason: true },
    wallet: {
      classSuffix: 'dns-season-2026-27',
      cardTitle: 'Dolomiti NordicSki',
      header: 'DNS Saisonkarte 2026/27',
      description: 'DNS Saisonkarte 2026/27',
      logoText: 'Dolomiti NordicSki',
      primaryLabel: 'SAISONKARTE DNS',
      passTypeLabel: 'Season Pass',
      hexBackgroundColor: '#0D4D5E',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(13, 77, 94)',
    },
  }),
  'sk-instructor': freezeDefinition({
    productCode: 'sk-instructor',
    enabledSeasons: ['2026-27'],
    passDesign: 'dns-ski-instructor',
    pilotEligibility: {},
    wallet: {
      classSuffix: 'dns-ski-instructor-2026-27',
      cardTitle: 'Dolomiti NordicSki',
      header: 'DNS Ski Instructor Pass 2026/27',
      description: 'DNS Ski Instructor Pass 2026/27',
      logoText: 'DNS LANGLAUFLEHRER',
      primaryLabel: 'LANGLAUFLEHRER · MAESTRO DI SCI · SKI INSTRUCTOR',
      passTypeLabel: 'Ski Instructor',
    },
  }),
});

export function getDigitalPassProduct(productCode, seasonId) {
  if (typeof productCode !== 'string' || typeof seasonId !== 'string') return null;
  if (!Object.hasOwn(DIGITAL_PASS_PRODUCT_REGISTRY, productCode)) return null;
  const definition = DIGITAL_PASS_PRODUCT_REGISTRY[productCode];
  return definition.enabledSeasons.includes(seasonId) ? definition : null;
}
