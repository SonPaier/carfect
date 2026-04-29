import { describe, it, expect } from 'vitest';
import { FakturowniaInvoiceResponse, mapFakturowniaToInternal } from './fakturowniaMappers';

const baseFakturowniaInvoice: FakturowniaInvoiceResponse = {
  id: 12345,
  number: 'FV/2026/04/01',
  kind: 'vat',
  issue_date: '2026-04-28',
  sell_date: '2026-04-28',
  payment_to: '2026-05-12',
  payment_type: 'transfer',
  currency: 'PLN',
  buyer_name: 'Acme Sp. z o.o.',
  buyer_tax_no: '5252445767',
  buyer_email: 'kontakt@acme.pl',
  buyer_post_code: '00-001',
  buyer_city: 'Warszawa',
  buyer_street: 'ul. Nowa 1',
  buyer_country: 'PL',
  positions: [
    {
      id: 999,
      name: 'Folia PPF',
      quantity: 7.62,
      quantity_unit: 'm²',
      tax: '23',
      price_gross: 281.67,
      discount_percent: 5,
    },
  ],
};

describe('mapFakturowniaToInternal', () => {
  it('preserves invoice id and number for the round-trip back to update_invoice', () => {
    const result = mapFakturowniaToInternal(baseFakturowniaInvoice);
    expect(result.externalInvoiceId).toBe('12345');
    expect(result.invoiceNumber).toBe('FV/2026/04/01');
  });

  it('maps header fields verbatim', () => {
    const result = mapFakturowniaToInternal(baseFakturowniaInvoice);
    expect(result.kind).toBe('vat');
    expect(result.issueDate).toBe('2026-04-28');
    expect(result.sellDate).toBe('2026-04-28');
    expect(result.paymentTo).toBe('2026-05-12');
    expect(result.paymentType).toBe('transfer');
    expect(result.currency).toBe('PLN');
  });

  it('maps buyer block', () => {
    const result = mapFakturowniaToInternal(baseFakturowniaInvoice);
    expect(result.buyerName).toBe('Acme Sp. z o.o.');
    expect(result.buyerTaxNo).toBe('5252445767');
    expect(result.buyerEmail).toBe('kontakt@acme.pl');
    expect(result.buyerPostCode).toBe('00-001');
    expect(result.buyerCity).toBe('Warszawa');
    expect(result.buyerStreet).toBe('ul. Nowa 1');
    expect(result.buyerCountry).toBe('PL');
  });

  it('maps a position with external_id, unit, discount, and vat_rate', () => {
    const result = mapFakturowniaToInternal(baseFakturowniaInvoice);
    expect(result.positions).toHaveLength(1);
    const p = result.positions[0];
    expect(p.external_id).toBe('999');
    expect(p.name).toBe('Folia PPF');
    expect(p.quantity).toBe(7.62);
    expect(p.unit).toBe('m²');
    // Mapper converts Fakturownia's price_gross back to NET (form's default mode
    // is netto, so unit_price_gross stores the net value). 281.67 / 1.23 ≈ 229.00
    expect(p.unit_price_gross).toBeCloseTo(229, 2);
    expect(p.vat_rate).toBe(23);
    expect(p.discount).toBe(5);
  });

  it('falls back to "szt." when quantity_unit is missing', () => {
    const fv = {
      ...baseFakturowniaInvoice,
      positions: [{ id: 1, name: 'X', quantity: 1, tax: '23', price_gross: 100 }],
    };
    const result = mapFakturowniaToInternal(fv);
    expect(result.positions[0].unit).toBe('szt.');
  });

  it('maps tax "zw" to vat_rate -1', () => {
    const fv = {
      ...baseFakturowniaInvoice,
      positions: [{ id: 1, name: 'X', quantity: 1, tax: 'zw', price_gross: 100 }],
    };
    const result = mapFakturowniaToInternal(fv);
    expect(result.positions[0].vat_rate).toBe(-1);
  });

  it('maps tax "disabled" to vat_rate -1', () => {
    const fv = {
      ...baseFakturowniaInvoice,
      positions: [{ id: 1, name: 'X', quantity: 1, tax: 'disabled', price_gross: 100 }],
    };
    const result = mapFakturowniaToInternal(fv);
    expect(result.positions[0].vat_rate).toBe(-1);
  });

  it('falls back to vat_rate 23 when tax is missing or unparseable', () => {
    const fv = {
      ...baseFakturowniaInvoice,
      positions: [
        { id: 1, name: 'A', quantity: 1, price_gross: 100 },
        { id: 2, name: 'B', quantity: 1, tax: 'garbage', price_gross: 100 },
      ],
    };
    const result = mapFakturowniaToInternal(fv);
    expect(result.positions[0].vat_rate).toBe(23);
    expect(result.positions[1].vat_rate).toBe(23);
  });

  it('returns empty positions array when none provided', () => {
    const fv = { ...baseFakturowniaInvoice, positions: undefined };
    const result = mapFakturowniaToInternal(fv);
    expect(result.positions).toEqual([]);
  });

  it('parses paid amount as a number', () => {
    expect(mapFakturowniaToInternal({ ...baseFakturowniaInvoice, paid: '125.50' }).paidAmount).toBe(
      125.5,
    );
    expect(mapFakturowniaToInternal({ ...baseFakturowniaInvoice, paid: 0 }).paidAmount).toBe(0);
    expect(mapFakturowniaToInternal({ ...baseFakturowniaInvoice }).paidAmount).toBe(0);
  });

  describe('KSeF (gov_*) fields', () => {
    it('extracts all KSeF fields when present', () => {
      const fv: FakturowniaInvoiceResponse = {
        ...baseFakturowniaInvoice,
        gov_status: 'ok',
        gov_id: '5252445767-20260428-CA1B2',
        gov_send_date: '2026-04-28T14:00:00Z',
        gov_error_messages: ['warn 1'],
        gov_verification_link: 'https://ksef.mf.gov.pl/verify/abc',
      };
      const result = mapFakturowniaToInternal(fv);
      expect(result.ksef.status).toBe('ok');
      expect(result.ksef.govId).toBe('5252445767-20260428-CA1B2');
      expect(result.ksef.sendDate).toBe('2026-04-28T14:00:00Z');
      expect(result.ksef.errorMessages).toEqual(['warn 1']);
      expect(result.ksef.verificationLink).toBe('https://ksef.mf.gov.pl/verify/abc');
    });

    it('returns nulls and empty array when KSeF fields are missing', () => {
      const result = mapFakturowniaToInternal(baseFakturowniaInvoice);
      expect(result.ksef.status).toBeNull();
      expect(result.ksef.govId).toBeNull();
      expect(result.ksef.sendDate).toBeNull();
      expect(result.ksef.errorMessages).toEqual([]);
      expect(result.ksef.verificationLink).toBeNull();
    });
  });

  describe('defaults for missing optional fields', () => {
    it('defaults country to PL', () => {
      const fv = { ...baseFakturowniaInvoice, buyer_country: undefined };
      expect(mapFakturowniaToInternal(fv).buyerCountry).toBe('PL');
    });

    it('defaults currency to PLN', () => {
      const fv = { ...baseFakturowniaInvoice, currency: undefined };
      expect(mapFakturowniaToInternal(fv).currency).toBe('PLN');
    });

    it('defaults kind to vat when unknown', () => {
      const fv = { ...baseFakturowniaInvoice, kind: 'estimate' };
      expect(mapFakturowniaToInternal(fv).kind).toBe('vat');
    });

    it('defaults paymentType to transfer when unknown', () => {
      const fv = { ...baseFakturowniaInvoice, payment_type: 'crypto' };
      expect(mapFakturowniaToInternal(fv).paymentType).toBe('transfer');
    });
  });
});
