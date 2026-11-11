import type { DNSPublicWidgetSnapshot } from './public-widget.js';
import type { TicketPricingConfig, TicketProductCode } from './seasonal-operational-data.js';

/** Public website prices only. No organizational overrides, settlement amounts or instructor prices. */
const PUBLIC_PRODUCTS: readonly TicketProductCode[] = ['day', 'wk-area', 'wk-dns', 'sk-area', 'sk-dns'];
type PriceRecord = Pick<TicketPricingConfig, 'id' | 'seasonId' | 'productCode' | 'scopeType' | 'scopeId' | 'salesChannel' | 'salesPeriod' | 'currency' | 'unitPrice' | 'validFrom' | 'validTo' | 'active'>;

export function selectPublishedWidgetPrices(
  records: readonly PriceRecord[], seasonId: string, areaId: string | null, date: string,
): DNSPublicWidgetSnapshot['pricing'] {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) throw new Error('Widget prices require an ISO calendar date');
  const products = PUBLIC_PRODUCTS.filter(code => areaId !== null || code.endsWith('-dns'));
  const items: DNSPublicWidgetSnapshot['pricing']['items'][number][] = [];
  for (const productCode of products) {
    const eligible = records.filter(r => r.seasonId === seasonId
      && r.active === true && r.productCode === productCode
      && r.salesChannel === 'official' && r.currency === 'EUR'
      && Number.isFinite(r.unitPrice) && r.unitPrice >= 0
      && r.scopeType !== 'organization'
      && (r.scopeType === 'network' && r.scopeId === 'dolomiti-nordicski'
          || areaId !== null && r.scopeType === 'reportingArea' && r.scopeId === areaId)
      && (!r.validFrom || r.validFrom.slice(0, 10) <= date)
      && (!r.validTo || r.validTo.slice(0, 10) >= date));
    // DNS-wide weekly and season passes never accept regional overrides.
    const dnsNetworkProduct = productCode === 'wk-dns' || productCode === 'sk-dns';
    const scoped = !dnsNetworkProduct && areaId && eligible.some(r => r.scopeType === 'reportingArea')
      ? eligible.filter(r => r.scopeType === 'reportingArea') : eligible.filter(r => r.scopeType === 'network');
    // Price period must be explicit and unambiguous; never silently choose presale vs regular.
    if (scoped.length > 1) throw new Error('Ambiguous public price: ' + (areaId ?? 'all') + '/' + productCode + '/' + date);
    if (scoped.length === 1) {
      const r = scoped[0];
      items.push({ productCode, currency: 'EUR', amount: r.unitPrice,
        ...(r.validFrom ? { validFrom: r.validFrom } : {}),
        ...(r.validTo ? { validTo: r.validTo } : {}) });
    }
  }
  return { status: items.length ? 'available' : 'unavailable', updatedAt: new Date(date + 'T12:00:00Z').toISOString(), items };
}
