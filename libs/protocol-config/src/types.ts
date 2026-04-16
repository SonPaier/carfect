import type { FieldWidth } from '@shared/custom-fields';

export type SectionId =
  | 'header'
  | 'customerInfo'
  | 'vehicleInfo'
  | 'vehicleDiagram'
  | 'fuelOdometer'
  | 'valuableItems'
  | 'customFields'
  | 'serviceItems'
  | 'consentClauses'
  | 'customerSignature'
  | 'releaseSection';

export interface BuiltInFieldToggle {
  enabled: boolean;
  label?: string;
  width?: FieldWidth;
  visibleToCustomer: boolean;
}

export interface ServiceItemsConfig {
  enabled: boolean;
  visibleToCustomer: boolean;
  allowManualEntry: boolean;
  loadFromOffer: boolean;
  loadFromReservation: boolean;
}

export interface BuiltInFieldsConfig {
  nip: BuiltInFieldToggle;
  vin: BuiltInFieldToggle;
  fuelLevel: BuiltInFieldToggle;
  odometer: BuiltInFieldToggle;
  serviceItems: ServiceItemsConfig;
  releaseSection: {
    enabled: boolean;
    declarationText?: string;
    visibleToCustomer: boolean;
  };
  valuableItemsClause: {
    enabled: boolean;
    visibleToCustomer: boolean;
  };
}

export interface ConsentClauseDef {
  id: string;
  text: string;
  required: boolean;
  requiresSignature: boolean;
  visibleToCustomer: boolean;
  order: number;
}

export interface ServiceColumnDef {
  id: string;
  label: string;
  order: number;
  width?: number;
}

export interface ProtocolConfig {
  builtInFields: BuiltInFieldsConfig;
  consentClauses: ConsentClauseDef[];
  serviceColumns: ServiceColumnDef[];
  sectionOrder: SectionId[];
}

export type ProtocolType = 'reception' | 'pickup';
