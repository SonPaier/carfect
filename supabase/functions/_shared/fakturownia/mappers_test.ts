import { assertEquals } from 'jsr:@std/assert';
import {
  InternalInvoiceData,
  InternalInvoicePosition,
  mapBuyerToClient,
  mapInternalInvoiceToFakturownia,
  mapInternalInvoiceToFakturowniaUpdate,
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

Deno.test(
  'mapInternalInvoiceToFakturownia - never sends seller_bank_account or seller_* (uses Fakturownia default Department)',
  () => {
    const data: InternalInvoiceData = {
      ...baseInvoice,
      bank_account: 'PL12 3456 7890',
      seller_name: 'Foo Sp. z o.o.',
      seller_tax_no: '1234567890',
      seller_email: 'seller@foo.pl',
      seller_address: 'ul. X 1, 00-000 Warszawa',
    };
    const result = mapInternalInvoiceToFakturownia(data) as Record<string, unknown>;
    assertEquals(result.seller_bank_account, undefined);
    assertEquals(result.bank_account, undefined);
    assertEquals(result.seller_name, undefined);
    assertEquals(result.seller_tax_no, undefined);
    assertEquals(result.seller_email, undefined);
    assertEquals(result.seller_street, undefined);
    assertEquals(result.seller_city, undefined);
  },
);

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

// ---- mapInternalInvoiceToFakturowniaUpdate ----

const baseInvoiceForUpdate: InternalInvoiceData = {
  kind: 'vat',
  payment_type: 'transfer',
  buyer_name: 'Acme Sp. z o.o.',
  positions: [],
};

const pos = (overrides: Partial<InternalInvoicePosition>): InternalInvoicePosition => ({
  name: 'Folia',
  quantity: 1,
  unit_price_gross: 100,
  vat_rate: 23,
  unit: 'szt.',
  ...overrides,
});

Deno.test(
  'mapInternalInvoiceToFakturowniaUpdate - existing position keeps id (edit in place)',
  () => {
    const data = { ...baseInvoiceForUpdate, positions: [pos({ external_id: '42', quantity: 5 })] };
    const result = mapInternalInvoiceToFakturowniaUpdate(data, [pos({ external_id: '42' })]);
    assertEquals(result.positions.length, 1);
    const p = result.positions[0] as Record<string, unknown>;
    assertEquals(p.id, '42');
    assertEquals(p.quantity, 5);
    assertEquals(p._destroy, undefined);
  },
);

Deno.test('mapInternalInvoiceToFakturowniaUpdate - new position has no id (added)', () => {
  const data = { ...baseInvoiceForUpdate, positions: [pos({ name: 'New item' })] };
  const result = mapInternalInvoiceToFakturowniaUpdate(data, []);
  assertEquals(result.positions.length, 1);
  const p = result.positions[0] as Record<string, unknown>;
  assertEquals(p.id, undefined);
  assertEquals(p.name, 'New item');
});

Deno.test(
  'mapInternalInvoiceToFakturowniaUpdate - position missing from current emits {id, _destroy:1}',
  () => {
    const data = { ...baseInvoiceForUpdate, positions: [pos({ external_id: '1' })] };
    const original: InternalInvoicePosition[] = [
      pos({ external_id: '1' }),
      pos({ external_id: '2', name: 'Removed item' }),
    ];
    const result = mapInternalInvoiceToFakturowniaUpdate(data, original);
    assertEquals(result.positions.length, 2);
    const removed = result.positions.find((p) => (p as Record<string, unknown>)._destroy) as Record<
      string,
      unknown
    >;
    assertEquals(removed?.id, '2');
    assertEquals(removed?._destroy, 1);
  },
);

Deno.test(
  'mapInternalInvoiceToFakturowniaUpdate - mixed: keep + add + destroy in one payload',
  () => {
    const data = {
      ...baseInvoiceForUpdate,
      positions: [pos({ external_id: '1', name: 'Keep me' }), pos({ name: 'Brand new' })],
    };
    const original: InternalInvoicePosition[] = [
      pos({ external_id: '1', name: 'Keep me' }),
      pos({ external_id: '2', name: 'Drop me' }),
    ];
    const result = mapInternalInvoiceToFakturowniaUpdate(data, original);
    assertEquals(result.positions.length, 3);
    const ids = result.positions.map((p) => (p as Record<string, unknown>).id ?? null);
    assertEquals(ids, ['1', null, '2']);
    const destroyed = result.positions.filter((p) => (p as Record<string, unknown>)._destroy);
    assertEquals(destroyed.length, 1);
  },
);

Deno.test(
  'mapInternalInvoiceToFakturowniaUpdate - originalPositions without external_id are ignored',
  () => {
    const data = { ...baseInvoiceForUpdate, positions: [pos({ name: 'Current' })] };
    const original = [pos({ name: 'No id, untracked' })];
    const result = mapInternalInvoiceToFakturowniaUpdate(data, original);
    assertEquals(result.positions.length, 1);
    assertEquals((result.positions[0] as Record<string, unknown>)._destroy, undefined);
  },
);

Deno.test(
  'mapInternalInvoiceToFakturowniaUpdate - sets show_discount when any position has discount',
  () => {
    const data = {
      ...baseInvoiceForUpdate,
      positions: [pos({ external_id: '1', discount: 10 })],
    };
    const result = mapInternalInvoiceToFakturowniaUpdate(data, [pos({ external_id: '1' })]);
    assertEquals(result.show_discount, '1');
    assertEquals(result.discount_kind, 'percent_unit');
  },
);

Deno.test(
  'mapInternalInvoiceToFakturowniaUpdate - omits show_discount when no positions have discount',
  () => {
    const data = { ...baseInvoiceForUpdate, positions: [pos({ external_id: '1' })] };
    const result = mapInternalInvoiceToFakturowniaUpdate(data, [pos({ external_id: '1' })]);
    assertEquals(result.show_discount, undefined);
  },
);

Deno.test(
  'mapInternalInvoiceToFakturowniaUpdate - only forwards buyer fields that are present',
  () => {
    const data = { ...baseInvoiceForUpdate, buyer_name: 'New name', positions: [] };
    const result = mapInternalInvoiceToFakturowniaUpdate(data, []);
    assertEquals(result.buyer_name, 'New name');
    assertEquals(result.buyer_tax_no, undefined);
    assertEquals(result.buyer_email, undefined);
  },
);
