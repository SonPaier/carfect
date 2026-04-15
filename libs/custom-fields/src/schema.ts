import { z } from 'zod';

export const fieldWidthSchema = z.enum(['full', 'half']).default('full');

export const customFieldConfigSchema = z.object({
  placeholder: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  width: fieldWidthSchema.optional(),
  visibleToCustomer: z.boolean().optional().default(true),
});

export const customFieldTypeSchema = z.enum(['checkbox', 'text', 'number', 'textarea']);

export const customFieldDefinitionSchema = z.object({
  id: z.string().uuid(),
  instance_id: z.string().uuid(),
  context: z.string().min(1),
  field_type: customFieldTypeSchema,
  label: z.string().min(1),
  required: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  config: customFieldConfigSchema.default({}),
});
