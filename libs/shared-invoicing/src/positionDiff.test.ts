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
});
