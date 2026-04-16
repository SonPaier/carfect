import { z } from 'zod';
import { DEFAULT_SECTION_ORDER, DEFAULT_PROTOCOL_CONFIG } from './defaults';

const builtInFieldToggleSchema = z.object({
  enabled: z.boolean().optional(),
  label: z.string().optional(),
  width: z.enum(['full', 'half']).optional(),
  visibleToCustomer: z.boolean().optional(),
});

const serviceItemsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  visibleToCustomer: z.boolean().optional(),
  allowManualEntry: z.boolean().optional(),
  loadFromOffer: z.boolean().optional(),
  loadFromReservation: z.boolean().optional(),
});

const releaseSectionSchema = z.object({
  enabled: z.boolean().optional(),
  declarationText: z.string().optional(),
  visibleToCustomer: z.boolean().optional(),
});

const toggleWithVisibilitySchema = z.object({
  enabled: z.boolean().optional(),
  visibleToCustomer: z.boolean().optional(),
});

const builtInFieldsConfigSchema = z.object({
  nip: builtInFieldToggleSchema.default({}),
  vin: builtInFieldToggleSchema.default({}),
  fuelLevel: builtInFieldToggleSchema.default({}),
  odometer: builtInFieldToggleSchema.default({}),
  serviceItems: serviceItemsConfigSchema.default({}),
  releaseSection: releaseSectionSchema.default({}),
  valuableItemsClause: toggleWithVisibilitySchema.default({}),
});

const consentClauseDefSchema = z.object({
  id: z.string(),
  text: z.string(),
  required: z.boolean().default(false),
  requiresSignature: z.boolean().default(false),
  visibleToCustomer: z.boolean().default(true),
  order: z.number().int().default(0),
});

const serviceColumnDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  order: z.number().int().default(0),
  width: z.number().optional(),
});

const sectionIdSchema = z.enum([
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
]);

export const protocolConfigSchema = z.object({
  builtInFields: builtInFieldsConfigSchema.default({}),
  consentClauses: z.array(consentClauseDefSchema).default([]),
  serviceColumns: z.array(serviceColumnDefSchema).default(DEFAULT_PROTOCOL_CONFIG.serviceColumns),
  sectionOrder: z.array(sectionIdSchema).default(DEFAULT_SECTION_ORDER),
});
