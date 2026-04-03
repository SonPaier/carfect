import { describe, it, expect } from 'vitest';

/**
 * Unit tests for the filteredServices sorting logic used in PriceListSettings.
 *
 * Spec: inactive services (active: false) are sorted to the end of the list.
 * Among active services, sort_order is preserved (ascending).
 * Among inactive services, sort_order is also preserved (ascending).
 */

interface ServiceLike {
  id: string;
  name: string;
  active: boolean | null;
  sort_order: number | null;
}

/**
 * This is the exact sort comparator extracted from PriceListSettings filteredServices useMemo:
 *
 *   return [...result].sort((a, b) => {
 *     if (a.active !== b.active) return a.active ? -1 : 1;
 *     return (a.sort_order ?? 0) - (b.sort_order ?? 0);
 *   });
 */
const sortServices = (services: ServiceLike[]): ServiceLike[] =>
  [...services].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

describe('PriceListSettings — filteredServices inactive sort order', () => {
  it('places all active services before inactive services', () => {
    const input: ServiceLike[] = [
      { id: '1', name: 'Inactive A', active: false, sort_order: 0 },
      { id: '2', name: 'Active B', active: true, sort_order: 1 },
      { id: '3', name: 'Active A', active: true, sort_order: 0 },
    ];

    const result = sortServices(input);
    const activeIds = result.filter(s => s.active).map(s => s.id);
    const inactiveIds = result.filter(s => !s.active).map(s => s.id);

    // All active services come first — check the boundary
    const lastActiveIndex = result.findLastIndex(s => s.active === true);
    const firstInactiveIndex = result.findIndex(s => s.active === false);

    expect(lastActiveIndex).toBeLessThan(firstInactiveIndex);
    expect(activeIds).toEqual(['3', '2']);
    expect(inactiveIds).toEqual(['1']);
  });

  it('preserves sort_order among active services', () => {
    const input: ServiceLike[] = [
      { id: 'c', name: 'Service C', active: true, sort_order: 2 },
      { id: 'a', name: 'Service A', active: true, sort_order: 0 },
      { id: 'b', name: 'Service B', active: true, sort_order: 1 },
    ];

    const result = sortServices(input);
    expect(result.map(s => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('preserves sort_order among inactive services (they appear after active)', () => {
    const input: ServiceLike[] = [
      { id: 'i2', name: 'Inactive 2', active: false, sort_order: 2 },
      { id: 'i0', name: 'Inactive 0', active: false, sort_order: 0 },
      { id: 'i1', name: 'Inactive 1', active: false, sort_order: 1 },
      { id: 'a1', name: 'Active 1', active: true, sort_order: 0 },
    ];

    const result = sortServices(input);
    expect(result.map(s => s.id)).toEqual(['a1', 'i0', 'i1', 'i2']);
  });

  it('handles a mix of active and inactive services interleaved by sort_order', () => {
    const input: ServiceLike[] = [
      { id: 'inactive-3', name: 'Old inactive', active: false, sort_order: 3 },
      { id: 'active-2', name: 'Second active', active: true, sort_order: 2 },
      { id: 'inactive-1', name: 'First inactive', active: false, sort_order: 1 },
      { id: 'active-0', name: 'First active', active: true, sort_order: 0 },
    ];

    const result = sortServices(input);
    // Active first (by sort_order), then inactive (by sort_order)
    expect(result.map(s => s.id)).toEqual([
      'active-0',
      'active-2',
      'inactive-1',
      'inactive-3',
    ]);
  });

  it('treats null sort_order as 0', () => {
    const input: ServiceLike[] = [
      { id: 'a', name: 'Service A', active: true, sort_order: null },
      { id: 'b', name: 'Service B', active: true, sort_order: 1 },
      { id: 'c', name: 'Service C', active: true, sort_order: 0 },
    ];

    const result = sortServices(input);
    // null treated as 0, so 'a' and 'c' both have effective sort_order 0 (stable in order they appear after sort)
    // 'b' has sort_order 1 so it comes after both
    const bIndex = result.findIndex(s => s.id === 'b');
    expect(bIndex).toBe(2);
  });

  it('handles a list with only inactive services', () => {
    const input: ServiceLike[] = [
      { id: 'i2', name: 'Inactive 2', active: false, sort_order: 2 },
      { id: 'i0', name: 'Inactive 0', active: false, sort_order: 0 },
    ];

    const result = sortServices(input);
    expect(result.map(s => s.id)).toEqual(['i0', 'i2']);
  });

  it('handles a list with only active services', () => {
    const input: ServiceLike[] = [
      { id: 'a2', name: 'Active 2', active: true, sort_order: 2 },
      { id: 'a0', name: 'Active 0', active: true, sort_order: 0 },
      { id: 'a1', name: 'Active 1', active: true, sort_order: 1 },
    ];

    const result = sortServices(input);
    expect(result.map(s => s.id)).toEqual(['a0', 'a1', 'a2']);
  });

  it('handles an empty list', () => {
    expect(sortServices([])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const input: ServiceLike[] = [
      { id: 'i', name: 'Inactive', active: false, sort_order: 0 },
      { id: 'a', name: 'Active', active: true, sort_order: 1 },
    ];
    const originalOrder = input.map(s => s.id);
    sortServices(input);
    expect(input.map(s => s.id)).toEqual(originalOrder);
  });
});
