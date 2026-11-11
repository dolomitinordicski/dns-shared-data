import type { DNSPublicWidgetSnapshot } from './public-widget.js';
import type { TicketPricingConfig, TicketProductCode } from './seasonal-operational-data.js';

/** Public website prices only. No organizational overrides, settlement amounts or instructor prices. */
const PUBLIC_PRODUCTS: readonly TicketProductCode[] = ['day', 'wk-area', 'wk-dns', 'sk-area', 'sk-dns'];
type PriceRecord = Pick<TicketPricingConfig, 'id' | 'seasonId' | 'productCode' | 'scopeType' | 'scopeId' | 'salesChannel' | 'salesPeriod' | 'currency' | 'unitPrice' | 'validFrom' | 'validTo' | 'active'>;

export function selectPublishedWidgetPrices(
  records: readonly PriceRecord[], seasonId: string, areaId: string | null, date: string,
): DNSPublicWidgetSnapshot['pricing'] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Widget prices require an ISO calendar date');
  const products = PUBLIC_PRODUCTS.filter(code => areaId !== null || code.endsWith('-dns'));
  const items: DNSPublicWidgetSnapshot['pricing']['items'][number][] = [];
  for (const productCode of products) {
    // Public widgets always display official regular list prices for ALL
    // ticket types. Presale entries and their validity dates do not influence
    // advertised list prices; Data Entry remains the source of truth.
    const eligible = records.filter(r => r.seasonId === seasonId
      && r.active === true && r.productCode === productCode
      && r.salesChannel === 'official' && r.salesPeriod === 'regular'
      && r.currency === 'EUR'
      && Number.isFinite(r.unitPrice) && r.unitPrice >= 0
      && r.scopeType !== 'organization'
      && (r.scopeType === 'network' && r.scopeId === 'dolomiti-nordicski'
          || areaId !== null && r.scopeType === 'reportingArea' && r.scopeId === areaId));
    // DNS-wide weekly and season passes never accept regional overrides.
    const dnsNetworkProduct = productCode === 'wk-dns' || productCode === 'sk-dns';
    const scoped = !dnsNetworkProduct && areaId && eligible.some(r => r.scopeType === 'reportingArea')
      ? eligible.filter(r => r.scopeType === 'reportingArea') : eligible.filter(r => r.scopeType === 'network');
    // Never arbitrarily choose between overlapping prices of the same product and period.
    if (scoped.length > 1) {
      // Identifiers and customer-facing prices only; no private settlement or partner data.
      const candidates = scoped.map(r => ({
        id: r.id,
        amount: r.unitPrice,
        period: r.salesPeriod ?? null,
        validFrom: r.validFrom ?? null,
        validTo: r.validTo ?? null,
        scopeType: r.scopeType,
      }));
      throw new Error('Ambiguous public price: ' + (areaId ?? 'all') + '/' + productCode + '/' + date
        + ' candidates=' + JSON.stringify(candidates));
    }
    if (scoped.length === 1) {
      const r = scoped[0];
      items.push({ productCode, currency: 'EUR', amount: r.unitPrice });
    }
  }
  return { status: items.length ? 'available' : 'unavailable', updatedAt: new Date(date + 'T12:00:00Z').toISOString(), items };
}
