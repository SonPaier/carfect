import { describe, it, expect } from 'vitest';
import { mergeWithDefaults, DEFAULT_PROTOCOL_CONFIG, DEFAULT_SECTION_ORDER } from './defaults';

describe('mergeWithDefaults', () => {
  it('returns DEFAULT_PROTOCOL_CONFIG for empty partial', () => {
    const result = mergeWithDefaults({});
    expect(result).toEqual(DEFAULT_PROTOCOL_CONFIG);
  });

  it('preserves overridden built-in field values', () => {
    const result = mergeWithDefaults({
      builtInFields: { nip: { enabled: true, visibleToCustomer: false } } as never,
    });
    expect(result.builtInFields.nip.enabled).toBe(true);
    expect(result.builtInFields.nip.visibleToCustomer).toBe(false);
    // Other fields should still have defaults
    expect(result.builtInFields.vin.enabled).toBe(false);
  });

  it('handles null/undefined sub-fields safely without crashing', () => {
    const result = mergeWithDefaults({
      builtInFields: { nip: null, vin: undefined } as never,
    });
    // Should fall back to defaults, not crash
    expect(result.builtInFields.nip).toEqual(DEFAULT_PROTOCOL_CONFIG.builtInFields.nip);
    expect(result.builtInFields.vin).toEqual(DEFAULT_PROTOCOL_CONFIG.builtInFields.vin);
  });

  it('handles primitive sub-field values safely', () => {
    const result = mergeWithDefaults({
      builtInFields: { nip: true } as never,
    });
    expect(result.builtInFields.nip).toEqual(DEFAULT_PROTOCOL_CONFIG.builtInFields.nip);
  });

  it('appends new section IDs missing from saved sectionOrder', () => {
    const savedOrder = ['header', 'customerInfo', 'customerSignature'] as never[];
    const result = mergeWithDefaults({ sectionOrder: savedOrder });
    // Should contain all default sections
    expect(result.sectionOrder.length).toBe(DEFAULT_SECTION_ORDER.length);
    // First 3 should be the saved order
    expect(result.sectionOrder[0]).toBe('header');
    expect(result.sectionOrder[1]).toBe('customerInfo');
    expect(result.sectionOrder[2]).toBe('customerSignature');
    // Missing sections appended
    expect(result.sectionOrder).toContain('vehicleDiagram');
    expect(result.sectionOrder).toContain('releaseSection');
  });

  it('does not duplicate existing sections in sectionOrder', () => {
    const result = mergeWithDefaults({ sectionOrder: DEFAULT_SECTION_ORDER });
    const unique = new Set(result.sectionOrder);
    expect(unique.size).toBe(result.sectionOrder.length);
  });
});
