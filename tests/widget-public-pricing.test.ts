import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { selectPublishedWidgetPrices } from '../src/widget-public-pricing.js';

const base = { seasonId: '2026-27', salesChannel: 'official', currency: 'EUR', active: true,
  validFrom: '2026-10-01', validTo: '2027-05-01', salesPeriod: 'regular' } as const;
const network = (productCode: 'wk-dns' | 'sk-dns' | 'day', unitPrice: number) =>
  ({ ...base, id: productCode, productCode, unitPrice, scopeType: 'network' as const, scopeId: 'dolomiti-nordicski' });
test('network pricing only exposes network DNS products', () => {
  const r = selectPublishedWidgetPrices([network('wk-dns', 65), network('sk-dns', 145), network('day', 13)], '2026-27', null, '2026-11-11');
  assert.deepEqual(r.items.map(x => x.productCode), ['wk-dns', 'sk-dns']);
});
test('area overrides network defaults and never exports settlement amounts', () => {
  const r = selectPublishedWidgetPrices([
    network('day', 12),
    { ...network('day', 17), id: 'area-day', scopeType: 'reportingArea', scopeId: 'osttirol' },
    { ...network('day', 50), id: 'org-day', scopeType: 'organization', scopeId: 'private-hotel' },
  ], '2026-27', 'osttirol', '2026-11-11');
  assert.equal(r.items.find(x => x.productCode === 'day')?.amount, 17);
  assert.equal(JSON.stringify(r).includes('settlement'), false);
});
test('DNS season pass always shows regular list price during and after presale', () => {
  const entries = [
    { ...network('sk-dns', 135), id: 'presale', salesPeriod: 'presale', validTo: '2026-12-05' },
    { ...network('sk-dns', 145), id: 'regular', validFrom: '2026-12-06' }
  ];
  assert.equal(selectPublishedWidgetPrices(entries, '2026-27', null, '2026-11-11').items[0].amount, 145);
  assert.equal(selectPublishedWidgetPrices(entries, '2026-27', null, '2026-12-06').items[0].amount, 145);
  assert.equal(selectPublishedWidgetPrices(entries, '2026-27', 'osttirol', '2026-11-11').items.find(x => x.productCode === 'sk-dns')?.amount, 145);
});
test('ambiguous overlapping prices fail closed', () => {
  assert.throws(() => selectPublishedWidgetPrices([network('wk-dns', 65), network('wk-dns', 60)], '2026-27', null, '2026-11-11'), /Ambiguous/);
});
test('inactive and non-official channels never publish', () => {
  const r = selectPublishedWidgetPrices([{ ...network('wk-dns', 65), active: false }, { ...network('sk-dns', 150), salesChannel: 'track' }], '2026-27', null, '2026-11-11');
  assert.equal(r.status, 'unavailable');
  assert.deepEqual(r.items, []);
});

test('DNS weekly and seasonal prices cannot be overridden by reporting areas', () => {
  const r = selectPublishedWidgetPrices([
    network('wk-dns', 65),
    network('sk-dns', 135),
    { ...network('wk-dns', 99), id: 'area-wk-dns', scopeType: 'reportingArea', scopeId: 'osttirol' },
    { ...network('sk-dns', 199), id: 'area-sk-dns', scopeType: 'reportingArea', scopeId: 'osttirol' },
  ], '2026-27', 'osttirol', '2026-11-11');
  assert.equal(r.items.find(x => x.productCode === 'wk-dns')?.amount, 65);
  assert.equal(r.items.find(x => x.productCode === 'sk-dns')?.amount, 135);
});
test('missing area-specific tariffs do not block other available public tariffs', () => {
  const r = selectPublishedWidgetPrices([network('wk-dns', 65)], '2026-27', 'osttirol', '2026-11-11');
  assert.deepEqual(r.items.map(x => x.productCode), ['wk-dns']);
});

test('conflict diagnostics identify valid periods and candidate records without settlement values', () => {
  const first = { ...network('sk-dns', 145), id: 'regular-2026-a', salesPeriod: 'regular', settlementUnitPrice: 100 };
  const second = { ...network('sk-dns', 150), id: 'regular-2026-b', salesPeriod: 'regular', settlementUnitPrice: 110 };
  assert.throws(
    () => selectPublishedWidgetPrices([first, second], '2026-27', null, '2026-11-11'),
    error => {
      const message = (error as Error).message;
      return message.includes('regular-2026-a') && message.includes('regular-2026-b')
        && message.includes('validFrom') && !message.includes('settlement');
    },
  );
});

test('missing regular DNS seasonal price cannot fall back to discounted presale', () => {
  const p = { ...network('sk-dns', 135), id: 'presale-only', salesPeriod: 'presale' };
  const r = selectPublishedWidgetPrices([p], '2026-27', null, '2026-11-11');
  assert.deepEqual(r.items, []);
});

test('area season pass displays its own regular list price even during presale', () => {
  const records = [
    { ...network('sk-dns', 145), id: 'dns-regular' },
    { ...network('sk-dns', 135), id: 'dns-presale', salesPeriod: 'presale' },
    { ...network('sk-dns', 110), id: 'area-regular', productCode: 'sk-area', scopeType: 'reportingArea', scopeId: 'osttirol', salesPeriod: 'regular', validFrom: '2026-12-06' },
    { ...network('sk-dns', 100), id: 'area-presale', productCode: 'sk-area', scopeType: 'reportingArea', scopeId: 'osttirol', salesPeriod: 'presale', validTo: '2026-12-05' },
  ];
  const prices = selectPublishedWidgetPrices(records, '2026-27', 'osttirol', '2026-11-11');
  assert.equal(prices.items.find(p => p.productCode === 'sk-area')?.amount, 110);
  assert.equal(prices.items.find(p => p.productCode === 'sk-dns')?.amount, 145);
});
test('area season pass never substitutes a presale tariff when regular is missing', () => {
  const p = { ...network('sk-dns', 100), productCode: 'sk-area', scopeType: 'reportingArea', scopeId: 'osttirol', salesPeriod: 'presale' };
  const r = selectPublishedWidgetPrices([p], '2026-27', 'osttirol', '2026-11-11');
  assert.equal(r.items.some(p => p.productCode === 'sk-area'), false);
});
