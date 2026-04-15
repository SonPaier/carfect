import type { ProtocolConfig, SectionId, BuiltInFieldsConfig } from './types';

export const DEFAULT_BUILT_IN_FIELDS: BuiltInFieldsConfig = {
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
  releaseSection: {
    enabled: false,
    declarationText: 'Oświadczam, że odbieram pojazd bez zastrzeżeń',
    visibleToCustomer: true,
  },
  valuableItemsClause: { enabled: false, visibleToCustomer: true },
};

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'header',
  'customerInfo',
  'vehicleInfo',
  'vehicleDiagram',
  'fuelOdometer',
  'valuableItems',
  'customFields',
  'serviceItems',
  'consentClauses',
  'customerSignature',
  'releaseSection',
];

export const DEFAULT_PROTOCOL_CONFIG: ProtocolConfig = {
  builtInFields: DEFAULT_BUILT_IN_FIELDS,
  consentClauses: [
    {
      id: 'default-sms-consent',
      text: 'Wyrażam zgodę na otrzymywanie powiadomień SMS dotyczących statusu realizacji usługi oraz przypomnień o zaplanowanych wizytach.',
      required: false,
      requiresSignature: false,
      visibleToCustomer: true,
      order: 0,
    },
  ],
  serviceColumns: [
    { id: 'default-desc', label: 'OPIS', order: 0 },
    { id: 'default-price', label: 'CENA NETTO', order: 1 },
  ],
  sectionOrder: DEFAULT_SECTION_ORDER,
};

export const DEFAULT_EMAIL_TEMPLATE =
  'Dzień dobry {imie},\n\nW załączniku przesyłamy protokół {typ_protokolu} pojazdu {pojazd}.\n\nPozdrawiamy';

/**
 * Deep-merges a partial config from DB with defaults so callers always get a full shape.
 * New keys added to defaults are filled in; existing saved keys are preserved.
 */
function safeSpread<T extends Record<string, unknown>>(defaults: T, override: unknown): T {
  if (override && typeof override === 'object' && !Array.isArray(override)) {
    return { ...defaults, ...override as Partial<T> };
  }
  return defaults;
}

/**
 * Ensures sectionOrder contains all known section IDs.
 * Appends any new IDs from defaults that are missing in saved order.
 */
function mergeSectionOrder(saved: SectionId[] | undefined): SectionId[] {
  if (!saved) return DEFAULT_SECTION_ORDER;
  const validSet = new Set<string>(DEFAULT_SECTION_ORDER);
  const filtered = saved.filter((id) => validSet.has(id));
  const filteredSet = new Set(filtered);
  const missing = DEFAULT_SECTION_ORDER.filter((id) => !filteredSet.has(id));
  return [...filtered, ...missing];
}

export function mergeWithDefaults(partial: Partial<ProtocolConfig>): ProtocolConfig {
  const builtIn = (partial.builtInFields && typeof partial.builtInFields === 'object')
    ? partial.builtInFields as Record<string, unknown>
    : {};

  return {
    builtInFields: {
      nip: safeSpread(DEFAULT_BUILT_IN_FIELDS.nip, builtIn.nip),
      vin: safeSpread(DEFAULT_BUILT_IN_FIELDS.vin, builtIn.vin),
      fuelLevel: safeSpread(DEFAULT_BUILT_IN_FIELDS.fuelLevel, builtIn.fuelLevel),
      odometer: safeSpread(DEFAULT_BUILT_IN_FIELDS.odometer, builtIn.odometer),
      serviceItems: safeSpread(DEFAULT_BUILT_IN_FIELDS.serviceItems, builtIn.serviceItems),
      releaseSection: safeSpread(DEFAULT_BUILT_IN_FIELDS.releaseSection, builtIn.releaseSection),
      valuableItemsClause: safeSpread(DEFAULT_BUILT_IN_FIELDS.valuableItemsClause, builtIn.valuableItemsClause),
    },
    consentClauses: partial.consentClauses ?? DEFAULT_PROTOCOL_CONFIG.consentClauses,
    serviceColumns: partial.serviceColumns ?? DEFAULT_PROTOCOL_CONFIG.serviceColumns,
    sectionOrder: mergeSectionOrder(partial.sectionOrder),
  };
}
