// libs/ai/src/charts/chartSpec.ts
import { z } from 'zod';

export const ChartSpecSchema = z.object({
  type: z.enum(['bar', 'line', 'pie']),
  title: z.string().min(1),
  data: z
    .array(z.record(z.union([z.string(), z.number()])))
    .min(1, 'data must have at least one row'),
  x_key: z.string().min(1),
  y_keys: z.array(z.string().min(1)).min(1),
  unit: z.enum(['zł', 'szt.', '%']).optional(),
});

export type ChartSpec = z.infer<typeof ChartSpecSchema>;
