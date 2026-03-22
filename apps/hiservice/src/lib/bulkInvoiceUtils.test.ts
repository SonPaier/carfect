import { describe, it, expect } from 'vitest';
import {
  validateSameCustomer,
  buildPositionName,
  buildInvoicePositions,
  type CalendarItemForInvoice,
} from './bulkInvoiceUtils';

describe('Bulk Invoice — validation', () => {
  it('passes when all items have same customer_id', () => {
    const items: CalendarItemForInvoice[] = [
      { id: '1', title: 'A', item_date: '2026-03-19', price: 100, customer_id: 'c1', customer_name: 'Jan', customer_email: null },
      { id: '2', title: 'B', item_date: '2026-03-20', price: 200, customer_id: 'c1', customer_name: 'Jan', customer_email: null },
    ];
    expect(validateSameCustomer(items)).toBeNull();
  });

  it('fails when items have different customer_ids', () => {
    const items: CalendarItemForInvoice[] = [
      { id: '1', title: 'A', item_date: '2026-03-19', price: 100, customer_id: 'c1', customer_name: 'Jan', customer_email: null },
      { id: '2', title: 'B', item_date: '2026-03-20', price: 200, customer_id: 'c2', customer_name: 'Anna', customer_email: null },
    ];
    expect(validateSameCustomer(items)).toBe('Zaznaczone zlecenia muszą mieć tego samego klienta');
  });

  it('fails when no items have customer_id', () => {
    const items: CalendarItemForInvoice[] = [
      { id: '1', title: 'A', item_date: '2026-03-19', price: null, customer_id: null, customer_name: null, customer_email: null },
    ];
    expect(validateSameCustomer(items)).toBe('Zaznaczone zlecenia nie mają przypisanego klienta');
  });

  it('passes when some items have null customer_id but others share same id', () => {
    const items: CalendarItemForInvoice[] = [
      { id: '1', title: 'A', item_date: '2026-03-19', price: 100, customer_id: 'c1', customer_name: 'Jan', customer_email: null },
      { id: '2', title: 'B', item_date: '2026-03-20', price: 200, customer_id: null, customer_name: null, customer_email: null },
    ];
    expect(validateSameCustomer(items)).toBeNull();
  });
});

describe('Bulk Invoice — position name format', () => {
  it('formats single-day: "Title, DD.MM.YYYY"', () => {
    expect(buildPositionName('Naprawa pieca', '2026-03-19')).toBe('Naprawa pieca, 19.03.2026');
  });

  it('formats multi-day: "Title, DD.MM.YYYY – DD.MM.YYYY"', () => {
    expect(buildPositionName('Serwis klimatyzacji', '2026-03-19', '2026-03-21'))
      .toBe('Serwis klimatyzacji, 19.03.2026 – 21.03.2026');
  });

  it('treats same start and end date as single-day', () => {
    expect(buildPositionName('Przegląd', '2026-03-19', '2026-03-19'))
      .toBe('Przegląd, 19.03.2026');
  });

  it('handles null end_date as single-day', () => {
    expect(buildPositionName('Test', '2026-03-19', null))
      .toBe('Test, 19.03.2026');
  });

  it('returns title only when item_date is empty string', () => {
    expect(buildPositionName('Montaż rury', '')).toBe('Montaż rury');
  });

  it('returns title only when item_date is empty string with end_date', () => {
    expect(buildPositionName('Montaż rury', '', '2026-03-21')).toBe('Montaż rury');
  });
});

describe('Bulk Invoice — positions building', () => {
  it('creates one position per item with correct price', () => {
    const items: CalendarItemForInvoice[] = [
      { id: '1', title: 'Naprawa pieca', item_date: '2026-03-19', price: 500, customer_id: 'c1', customer_name: 'Jan', customer_email: null },
      { id: '2', title: 'Serwis klimy', item_date: '2026-03-20', end_date: '2026-03-22', price: 1200, customer_id: 'c1', customer_name: 'Jan', customer_email: null },
    ];
    const positions = buildInvoicePositions(items);
    expect(positions).toHaveLength(2);
    expect(positions[0].name).toBe('Naprawa pieca, 19.03.2026');
    expect(positions[0].unit_price_gross).toBe(500);
    expect(positions[1].name).toBe('Serwis klimy, 20.03.2026 – 22.03.2026');
    expect(positions[1].unit_price_gross).toBe(1200);
  });

  it('uses 0 for items with null price', () => {
    const items: CalendarItemForInvoice[] = [
      { id: '1', title: 'Test', item_date: '2026-03-19', price: null, customer_id: 'c1', customer_name: 'Jan', customer_email: null },
    ];
    expect(buildInvoicePositions(items)[0].unit_price_gross).toBe(0);
  });
});
