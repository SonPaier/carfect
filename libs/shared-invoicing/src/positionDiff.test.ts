import { describe, it, expect } from 'vitest';
import { positionDiff } from './positionDiff';
import type { InvoicePosition } from './invoicing.types';

const makePos = (overrides: Partial<InvoicePosition> = {}): InvoicePosition => ({
  name: 'Folia',
  quantity: 1,
  unit_price_gross: 100,
  vat_rate: 23,
  unit: 'szt.',
  discount: 0,
  ...overrides,
});

describe('positionDiff', () => {
  it('returns empty merged when both inputs empty', () => {
    expect(positionDiff([], [])).toEqual({ merged: [], statuses: [] });
  });

  it('marks all invoicePositions as unchanged when incoming matches all', () => {
    const inv = [makePos({ external_id: '1', name: 'A' })];
    const incoming = [makePos({ external_id: '1', name: 'A' })];
    const result = positionDiff(inv, incoming);
    expect(result.statuses).toEqual(['unchanged']);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].external_id).toBe('1');
  });

  it('marks invoice-only as removed', () => {
    const inv = [makePos({ external_id: '1', name: 'A' })];
    const result = positionDiff(inv, []);
    expect(result.statuses).toEqual(['removed']);
  });

  it('marks incoming-only as added (appended at end)', () => {
    const inv: InvoicePosition[] = [];
    const incoming = [makePos({ name: 'New' })];
    const result = positionDiff(inv, incoming);
    expect(result.statuses).toEqual(['added']);
    expect(result.merged[0].name).toBe('New');
  });

  it('mix: keep + add + remove in correct order', () => {
    const inv = [
      makePos({ external_id: '1', name: 'Keep' }),
      makePos({ external_id: '2', name: 'Remove' }),
    ];
    const incoming = [
      makePos({ external_id: '1', name: 'Keep' }),
      makePos({ name: 'New', unit_price_gross: 50 }),
    ];
    const result = positionDiff(inv, incoming);
    expect(result.statuses).toEqual(['unchanged', 'removed', 'added']);
    expect(result.merged.map((p) => p.name)).toEqual(['Keep', 'Remove', 'New']);
  });

  it('matches by external_id even when name changed', () => {
    const inv = [makePos({ external_id: '1', name: 'Old name' })];
    const incoming = [makePos({ external_id: '1', name: 'New name' })];
    const result = positionDiff(inv, incoming);
    expect(result.statuses).toEqual(['unchanged']);
    expect(result.merged[0].name).toBe('New name');
    expect(result.merged[0].external_id).toBe('1');
  });

  it('falls back to name+price match when no external_id', () => {
    const inv = [makePos({ name: 'A', unit_price_gross: 100 })];
    const incoming = [makePos({ name: 'A', unit_price_gross: 100 })];
    const result = positionDiff(inv, incoming);
    expect(result.statuses).toEqual(['unchanged']);
  });

  it('treats different unit_price_gross as not matching (no external_id)', () => {
    const inv = [makePos({ name: 'A', unit_price_gross: 100 })];
    const incoming = [makePos({ name: 'A', unit_price_gross: 200 })];
    const result = positionDiff(inv, incoming);
    expect(result.statuses).toEqual(['removed', 'added']);
  });

  it('handles duplicates with the same name+price (matches one-to-one)', () => {
    const inv = [
      makePos({ name: 'Same', unit_price_gross: 100 }),
      makePos({ name: 'Same', unit_price_gross: 100 }),
    ];
    const incoming = [makePos({ name: 'Same', unit_price_gross: 100 })];
    const result = positionDiff(inv, incoming);
    expect(result.statuses).toEqual(['unchanged', 'removed']);
  });

  it('preserves invoice external_id in merged when matched (so update can target the right row)', () => {
    const inv = [makePos({ external_id: '1', name: 'A' })];
    const incoming = [makePos({ external_id: '1', name: 'A', quantity: 5 })];
    const result = positionDiff(inv, incoming);
    expect(result.merged[0].external_id).toBe('1');
    expect(result.merged[0].quantity).toBe(5);
  });

  // Cross-source matching: realistic order-edit flow.
  // Fakturownia positions always carry external_id (loaded from API).
  // Order positions never carry external_id (built fresh from local state).
  // Without the fallback, no positions would ever match → false 'added'+'removed'.
  describe('cross-source matching (id on invoice side, none on incoming side)', () => {
    it('matches by name+price when invoice has external_id and incoming does not', () => {
      const inv = [makePos({ external_id: '42', name: 'Folia XP', unit_price_gross: 309 })];
      const incoming = [makePos({ name: 'Folia XP', unit_price_gross: 309 })];
      const result = positionDiff(inv, incoming);
      expect(result.statuses).toEqual(['unchanged']);
      expect(result.merged[0].external_id).toBe('42');
    });

    it('keeps invoice external_id even when match was found via name fallback', () => {
      const inv = [makePos({ external_id: '99', name: 'Folia XP', unit_price_gross: 309 })];
      const incoming = [
        makePos({ name: 'Folia XP', unit_price_gross: 309, quantity: 7.62, discount: 10 }),
      ];
      const result = positionDiff(inv, incoming);
      expect(result.merged[0].external_id).toBe('99');
      expect(result.merged[0].quantity).toBe(7.62);
      expect(result.merged[0].discount).toBe(10);
    });

    it('mixed cross-source: 1 unchanged + 1 added + 1 removed', () => {
      const inv = [
        makePos({ external_id: '1', name: 'Match me', unit_price_gross: 100 }),
        makePos({ external_id: '2', name: 'Drop me', unit_price_gross: 200 }),
      ];
      const incoming = [
        makePos({ name: 'Match me', unit_price_gross: 100 }),
        makePos({ name: 'Brand new', unit_price_gross: 50 }),
      ];
      const result = positionDiff(inv, incoming);
      expect(result.statuses).toEqual(['unchanged', 'removed', 'added']);
      expect(result.merged.map((p) => p.name)).toEqual(['Match me', 'Drop me', 'Brand new']);
    });

    it('rounds price to 2 decimals when matching (handles float drift)', () => {
      const inv = [makePos({ external_id: '1', name: 'A', unit_price_gross: 309.0000001 })];
      const incoming = [makePos({ name: 'A', unit_price_gross: 308.9999999 })];
      const result = positionDiff(inv, incoming);
      expect(result.statuses).toEqual(['unchanged']);
    });

    it('does not match cross-source when name differs', () => {
      const inv = [makePos({ external_id: '1', name: 'Foo', unit_price_gross: 100 })];
      const incoming = [makePos({ name: 'Bar', unit_price_gross: 100 })];
      const result = positionDiff(inv, incoming);
      expect(result.statuses).toEqual(['removed', 'added']);
    });
  });
});
