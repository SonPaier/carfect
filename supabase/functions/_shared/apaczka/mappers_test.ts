import { assertEquals } from 'jsr:@std/assert';
import {
  mapOrderToApaczkaRequest,
  mapPackagesToShipmentItems,
  validateShippingData,
  stripBankAccount,
} from './mappers.ts';
import type { OrderPackage, SenderAddress } from './types.ts';

const mockSender: SenderAddress = {
  name: 'Firma Test Sp. z o.o.',
  contact_person: 'Jan Kowalski',
  street: 'ul. Testowa 10',
  postal_code: '00-001',
  city: 'Warszawa',
  country_code: 'PL',
  phone: '+48500100200',
  email: 'test@firma.pl',
};

const mockCustomer = {
  name: 'Anna Nowak',
  company: null,
  contact_person: 'Anna Nowak',
  contact_email: 'anna@example.com',
  contact_phone: '+48500700800',
  email: 'anna@example.com',
  phone: '+48500700800',
  shipping_street: 'ul. Kwiatowa 5',
  shipping_street_line2: 'm. 10',
  shipping_postal_code: '30-001',
  shipping_city: 'Kraków',
  shipping_country_code: 'PL',
};

const mockOrder = {
  total_gross: 150.5,
  payment_method: 'transfer',
  bank_account_number: '12345678901234567890123456',
  comment: 'Test order',
};

const kartonPackage: OrderPackage = {
  id: 'pkg-1',
  shippingMethod: 'shipping',
  packagingType: 'karton',
  dimensions: { length: 40, width: 30, height: 20 },
  declaredValue: 150.5,
  shippingCost: 0,
  productKeys: ['prod-1'],
};

const tubaPackage: OrderPackage = {
  id: 'pkg-2',
  shippingMethod: 'shipping',
  packagingType: 'tuba',
  dimensions: { length: 100, diameter: 15 },
  productKeys: ['prod-2'],
};

const pickupPackage: OrderPackage = {
  id: 'pkg-3',
  shippingMethod: 'pickup',
  productKeys: ['prod-3'],
};

// --- mapPackagesToShipmentItems ---

Deno.test('APM-001: karton maps to PACZKA with correct dimensions', () => {
  const items = mapPackagesToShipmentItems([kartonPackage]);
  assertEquals(items.length, 1);
  assertEquals(items[0].shipment_type_code, 'PACZKA');
  assertEquals(items[0].dimension1, 40);
  assertEquals(items[0].dimension2, 30);
  assertEquals(items[0].dimension3, 20);
  assertEquals(items[0].weight, 1);
});

Deno.test(
  'APM-002: tuba maps to PACZKA (nstd) with diameter as dimension2 and dimension3, height=0',
  () => {
    const items = mapPackagesToShipmentItems([tubaPackage]);
    assertEquals(items.length, 1);
    assertEquals(items[0].shipment_type_code, 'PACZKA');
    assertEquals(items[0].is_nstd, 1);
    assertEquals(items[0].dimension1, 100);
    assertEquals(items[0].dimension2, 15);
    assertEquals(items[0].dimension3, 15);
  },
);

Deno.test('APM-003: filters out non-shipping packages', () => {
  const items = mapPackagesToShipmentItems([kartonPackage, pickupPackage, tubaPackage]);
  assertEquals(items.length, 2);
  // Both karton and tuba map to PACZKA (tuba uses nstd flag)
  assertEquals(items[0].shipment_type_code, 'PACZKA');
  assertEquals(items[1].shipment_type_code, 'PACZKA');
});

// --- mapOrderToApaczkaRequest ---

Deno.test('APM-004: maps single package without COD for transfer payment', () => {
  const result = mapOrderToApaczkaRequest({
    order: mockOrder,
    customer: mockCustomer,
    senderAddress: mockSender,
    pkg: kartonPackage,
    serviceId: 123,
  });

  assertEquals(result.service_id, 123);
  assertEquals(result.shipment_value, 15050); // pkg.declaredValue 150.5 * 100
  assertEquals(result.shipment_currency, 'PLN');
  assertEquals(result.cod, undefined);
  assertEquals(result.address.sender.name, 'Firma Test Sp. z o.o.');
  assertEquals(result.address.sender.city, 'Warszawa');
  assertEquals(result.address.receiver.city, 'Kraków');
  assertEquals(result.address.receiver.line2, 'm. 10');
  assertEquals(result.shipment.length, 1);
});

Deno.test('APM-005: includes COD with amount = declaredValue + shippingCost', () => {
  const codPackage: OrderPackage = {
    ...kartonPackage,
    declaredValue: 150,
    shippingCost: 50,
  };
  const result = mapOrderToApaczkaRequest({
    order: { ...mockOrder, payment_method: 'cod' },
    customer: mockCustomer,
    senderAddress: mockSender,
    pkg: codPackage,
    serviceId: 1,
  });

  assertEquals(result.cod !== undefined, true);
  assertEquals(result.cod!.amount, 20000); // (150 + 50) * 100
  assertEquals(result.shipment_value, 15000); // declaredValue 150 * 100
  assertEquals(result.cod!.currency, 'PLN');
  assertEquals(result.cod!.bankaccount, '12345678901234567890123456');
});

Deno.test('APM-005b: free payment sends zero shipment_value and no COD', () => {
  const freePackage: OrderPackage = {
    ...kartonPackage,
    declaredValue: 150,
    shippingCost: 50,
  };
  const result = mapOrderToApaczkaRequest({
    order: { ...mockOrder, payment_method: 'free' },
    customer: mockCustomer,
    senderAddress: mockSender,
    pkg: freePackage,
    serviceId: 1,
  });

  assertEquals(result.shipment_value, 15000); // declaredValue 150 * 100 — still passed for insurance
  assertEquals(result.cod, undefined); // no COD
});

Deno.test('APM-006: receiver uses company name when available', () => {
  const customerWithCompany = { ...mockCustomer, company: 'Firma ABC' };
  const result = mapOrderToApaczkaRequest({
    order: mockOrder,
    customer: customerWithCompany,
    senderAddress: mockSender,
    pkg: kartonPackage,
    serviceId: 1,
  });

  assertEquals(result.address.receiver.name, 'Firma ABC');
  assertEquals(result.address.receiver.is_residential, 0);
});

Deno.test('APM-007: receiver is residential when no company', () => {
  const result = mapOrderToApaczkaRequest({
    order: mockOrder,
    customer: mockCustomer,
    senderAddress: mockSender,
    pkg: kartonPackage,
    serviceId: 1,
  });

  assertEquals(result.address.receiver.is_residential, 1);
});

// --- validateShippingData ---

Deno.test('APV-001: validates successfully with complete data', () => {
  const result = validateShippingData({
    customer: mockCustomer,
    packages: [kartonPackage],
    order: mockOrder,
    senderAddress: mockSender,
  });

  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test('APV-002: fails when sender address is missing', () => {
  const result = validateShippingData({
    customer: mockCustomer,
    packages: [kartonPackage],
    order: mockOrder,
    senderAddress: null,
  });

  assertEquals(result.valid, false);
  assertEquals(
    result.errors.some((e) => e.includes('nadawcy')),
    true,
  );
});

Deno.test('APV-003: fails when customer shipping address is incomplete', () => {
  const result = validateShippingData({
    customer: { ...mockCustomer, shipping_street: null, shipping_city: null },
    packages: [kartonPackage],
    order: mockOrder,
    senderAddress: mockSender,
  });

  assertEquals(result.valid, false);
  assertEquals(
    result.errors.some((e) => e.includes('odbiorcy')),
    true,
  );
});

Deno.test('APV-004: fails when no shipping packages', () => {
  const result = validateShippingData({
    customer: mockCustomer,
    packages: [pickupPackage],
    order: mockOrder,
    senderAddress: mockSender,
  });

  assertEquals(result.valid, false);
  assertEquals(
    result.errors.some((e) => e.includes('shipping')),
    true,
  );
});

Deno.test('APV-005: fails for COD without valid bank account', () => {
  const result = validateShippingData({
    customer: mockCustomer,
    packages: [kartonPackage],
    order: { ...mockOrder, payment_method: 'cod', bank_account_number: '123' },
    senderAddress: mockSender,
  });

  assertEquals(result.valid, false);
  assertEquals(
    result.errors.some((e) => e.includes('konta')),
    true,
  );
});

Deno.test('APV-006: passes for COD with valid 26-digit bank account', () => {
  const result = validateShippingData({
    customer: mockCustomer,
    packages: [kartonPackage],
    order: {
      ...mockOrder,
      payment_method: 'cod',
      bank_account_number: '12345678901234567890123456',
    },
    senderAddress: mockSender,
  });

  assertEquals(result.valid, true);
});

Deno.test('APV-007: fails when package has no dimensions', () => {
  const noDimsPkg: OrderPackage = {
    id: 'pkg-x',
    shippingMethod: 'shipping',
    packagingType: 'karton',
    productKeys: ['p1'],
  };
  const result = validateShippingData({
    customer: mockCustomer,
    packages: [noDimsPkg],
    order: mockOrder,
    senderAddress: mockSender,
  });

  assertEquals(result.valid, false);
  assertEquals(
    result.errors.some((e) => e.includes('wymiar')),
    true,
  );
});

// --- stripBankAccount ---

Deno.test('APS-001: strips spaces and dashes from bank account', () => {
  assertEquals(stripBankAccount('12 3456 7890 1234 5678 9012 3456'), '12345678901234567890123456');
});

Deno.test('APS-002: strips PL prefix', () => {
  assertEquals(stripBankAccount('PL12345678901234567890123456'), '12345678901234567890123456');
});

Deno.test('APS-003: handles null/undefined', () => {
  assertEquals(stripBankAccount(null), '');
  assertEquals(stripBankAccount(undefined), '');
});
