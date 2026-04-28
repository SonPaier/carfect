import { assertEquals } from 'jsr:@std/assert';
import {
  InternalInvoiceData,
  mapBuyerToClient,
  mapInternalInvoiceToFakturownia,
} from './mappers.ts';

const baseInvoice: InternalInvoiceData = {
  kind: 'vat',
  issue_date: '2026-04-28',
  sell_date: '2026-04-28',
  payment_to: '2026-05-12',
  payment_type: 'transfer',
  currency: 'PLN',
  buyer_name: 'Acme Sp. z o.o.',
  positions: [{ name: 'Usługa A', quantity: 2, unit_price_gross: 123, vat_rate: 23, unit: 'szt.' }],
};

Deno.test('mapInternalInvoiceToFakturownia - basic invoice has correct field names', () => {
  const result = mapInternalInvoiceToFakturownia(baseInvoice);

  assertEquals(result.kind, 'vat');
  assertEquals(result.buyer_name, 'Acme Sp. z o.o.');
  assertEquals(result.payment_type, 'transfer');
  assertEquals(result.currency, 'PLN');
  assertEquals(result.positions.length, 1);
});

Deno.test('mapInternalInvoiceToFakturownia - position uses quantity_unit not unit', () => {
  const result = mapInternalInvoiceToFakturownia(baseInvoice);
  assertEquals(result.positions[0].quantity_unit, 'szt.');
  assertEquals(
    (result.positions[0] as Record<string, unknown>).unit,
    undefined,
    'should not have raw "unit" key',
  );
});

Deno.test('mapInternalInvoiceToFakturownia - position default quantity_unit when missing', () => {
  const data: InternalInvoiceData = {
    ...baseInvoice,
    positions: [{ name: 'X', quantity: 1, unit_price_gross: 100, vat_rate: 23 }],
  };
  const result = mapInternalInvoiceToFakturownia(data);
  assertEquals(result.positions[0].quantity_unit, 'szt.');
});

Deno.test('mapInternalInvoiceToFakturownia - vat_rate -1 maps to tax: disabled', () => {
  const data: InternalInvoiceData = {
    ...baseInvoice,
    positions: [{ name: 'X', quantity: 1, unit_price_gross: 100, vat_rate: -1 }],
  };
  const result = mapInternalInvoiceToFakturownia(data);
  assertEquals(result.positions[0].tax, 'disabled');
});

Deno.test('mapInternalInvoiceToFakturownia - vat_rate 23 maps to tax: "23" (string)', () => {
  const result = mapInternalInvoiceToFakturownia(baseInvoice);
  assertEquals(result.positions[0].tax, '23');
});

Deno.test('mapInternalInvoiceToFakturownia - bank_account renamed to seller_bank_account', () => {
  const data: InternalInvoiceData = { ...baseInvoice, bank_account: 'PL12 3456 7890' };
  const result = mapInternalInvoiceToFakturownia(data);
  assertEquals(result.seller_bank_account, 'PL12 3456 7890');
  assertEquals(
    (result as Record<string, unknown>).bank_account,
    undefined,
    'should not contain raw "bank_account" key',
  );
});

Deno.test(
  'mapInternalInvoiceToFakturownia - empty buyer fields are skipped, not sent as ""',
  () => {
    const data: InternalInvoiceData = {
      ...baseInvoice,
      buyer_tax_no: '',
      buyer_email: '',
      buyer_city: '',
      buyer_street: '',
      buyer_post_code: '',
      buyer_country: '',
    };
    const result = mapInternalInvoiceToFakturownia(data);
    assertEquals(result.buyer_tax_no, undefined);
    assertEquals(result.buyer_email, undefined);
    assertEquals(result.buyer_city, undefined);
    assertEquals(result.buyer_street, undefined);
    assertEquals(result.buyer_post_code, undefined);
    assertEquals(result.buyer_country, undefined);
  },
);

Deno.test('mapInternalInvoiceToFakturownia - no oid means no oid/oid_unique fields', () => {
  const result = mapInternalInvoiceToFakturownia(baseInvoice);
  assertEquals(result.oid, undefined);
  assertEquals(result.oid_unique, undefined);
});

Deno.test('mapInternalInvoiceToFakturownia - oid present sets oid_unique=yes', () => {
  const data: InternalInvoiceData = { ...baseInvoice, oid: 'order-123' };
  const result = mapInternalInvoiceToFakturownia(data);
  assertEquals(result.oid, 'order-123');
  assertEquals(result.oid_unique, 'yes');
});

Deno.test(
  'mapInternalInvoiceToFakturownia - position with discount sets show_discount + discount_kind on invoice',
  () => {
    const data: InternalInvoiceData = {
      ...baseInvoice,
      positions: [{ name: 'X', quantity: 1, unit_price_gross: 100, vat_rate: 23, discount: 10 }],
    };
    const result = mapInternalInvoiceToFakturownia(data);
    assertEquals(result.positions[0].discount_percent, 10);
    assertEquals(result.show_discount, '1');
    assertEquals(result.discount_kind, 'percent_unit');
  },
);

Deno.test('mapInternalInvoiceToFakturownia - zero discount on position is ignored', () => {
  const data: InternalInvoiceData = {
    ...baseInvoice,
    positions: [{ name: 'X', quantity: 1, unit_price_gross: 100, vat_rate: 23, discount: 0 }],
  };
  const result = mapInternalInvoiceToFakturownia(data);
  assertEquals(result.positions[0].discount_percent, undefined);
  assertEquals(result.show_discount, undefined);
});

Deno.test('mapInternalInvoiceToFakturownia - total_price_gross rounds to 2 decimals', () => {
  const data: InternalInvoiceData = {
    ...baseInvoice,
    positions: [{ name: 'X', quantity: 3, unit_price_gross: 33.333, vat_rate: 23 }],
  };
  const result = mapInternalInvoiceToFakturownia(data);
  // 3 * 33.333 = 99.999 → 100.00
  assertEquals(result.positions[0].total_price_gross, 100);
});

Deno.test('mapInternalInvoiceToFakturownia - clientId option sets client_id on invoice', () => {
  const result = mapInternalInvoiceToFakturownia(baseInvoice, { clientId: 42 });
  assertEquals(result.client_id, 42);
});

Deno.test('mapInternalInvoiceToFakturownia - no clientId means client_id not sent', () => {
  const result = mapInternalInvoiceToFakturownia(baseInvoice);
  assertEquals(result.client_id, undefined);
});

Deno.test('mapBuyerToClient - returns null when no buyer_name', () => {
  const data: InternalInvoiceData = { ...baseInvoice, buyer_name: undefined };
  assertEquals(mapBuyerToClient(data), null);
});

Deno.test('mapBuyerToClient - sets company=1 when tax_no present', () => {
  const data: InternalInvoiceData = { ...baseInvoice, buyer_tax_no: '5252445767' };
  const result = mapBuyerToClient(data);
  assertEquals(result?.company, '1');
  assertEquals(result?.tax_no, '5252445767');
});

Deno.test('mapBuyerToClient - sets company=0 when no tax_no (private person)', () => {
  const result = mapBuyerToClient(baseInvoice);
  assertEquals(result?.company, '0');
  assertEquals(result?.tax_no, undefined);
});

Deno.test('mapBuyerToClient - copies address fields from buyer_*', () => {
  const data: InternalInvoiceData = {
    ...baseInvoice,
    buyer_email: 'kontakt@acme.pl',
    buyer_city: 'Warszawa',
    buyer_street: 'ul. Nowa 1',
    buyer_post_code: '00-001',
    buyer_country: 'PL',
  };
  const result = mapBuyerToClient(data);
  assertEquals(result?.email, 'kontakt@acme.pl');
  assertEquals(result?.city, 'Warszawa');
  assertEquals(result?.street, 'ul. Nowa 1');
  assertEquals(result?.post_code, '00-001');
  assertEquals(result?.country, 'PL');
});
