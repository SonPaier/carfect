import { describe, it, expect } from 'vitest';
import { protocolConfigSchema } from './schema';

describe('protocolConfigSchema', () => {
  it('parses a full valid config', () => {
    const input = {
      builtInFields: {
        nip: { enabled: true, visibleToCustomer: true },
        vin: { enabled: false, visibleToCustomer: true },
        fuelLevel: { enabled: true, visibleToCustomer: true },
        odometer: { enabled: true, visibleToCustomer: true },
        serviceItems: {
          enabled: false,
          visibleToCustomer: true,
          allowManualEntry: true,
          loadFromOffer: false,
          loadFromReservation: false,
        },
        releaseSection: { enabled: false, visibleToCustomer: true },
        valuableItemsClause: { enabled: false, visibleToCustomer: true },
      },
      consentClauses: [
        { id: 'c1', text: 'I agree', required: true, requiresSignature: false, visibleToCustomer: true, order: 0 },
      ],
      serviceColumns: [
        { id: 'col1', label: 'OPIS', order: 0 },
      ],
      sectionOrder: ['header', 'customerInfo', 'customerSignature'],
    };

    const result = protocolConfigSchema.parse(input);
    expect(result.builtInFields.nip.enabled).toBe(true);
    expect(result.consentClauses).toHaveLength(1);
    expect(result.serviceColumns).toHaveLength(1);
    expect(result.sectionOrder).toHaveLength(3);
  });

  it('fills missing optional fields with empty objects (defaults applied by mergeWithDefaults)', () => {
    const result = protocolConfigSchema.parse({});

    // Zod no longer fills boolean defaults — mergeWithDefaults handles that
    expect(result.builtInFields.nip.enabled).toBeUndefined();
    expect(result.builtInFields.nip.visibleToCustomer).toBeUndefined();
    expect(result.builtInFields.serviceItems.allowManualEntry).toBeUndefined();
    expect(result.consentClauses).toEqual([]);
    expect(result.serviceColumns).toHaveLength(2);
    expect(result.sectionOrder).toHaveLength(11);
  });

  it('rejects unknown sectionId values', () => {
    const input = {
      sectionOrder: ['header', 'unknownSection'],
    };

    expect(() => protocolConfigSchema.parse(input)).toThrow();
  });
});
