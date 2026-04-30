// libs/ai/src/server/tools/dataOverview.ts
import { tool } from 'langchain';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface DataOverview {
  total_rows: number;
  date_range?: { min: string; max: string };
}

export async function computeDataOverview(
  supabase: SupabaseClient,
  table: string,
  date_column: string | undefined,
  allowedTables: Set<string>,
): Promise<DataOverview> {
  if (!allowedTables.has(table)) throw new Error(`Table not allowed: ${table}`);
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`count failed: ${error.message}`);
  const overview: DataOverview = { total_rows: count ?? 0 };

  if (date_column && (count ?? 0) > 0) {
    const { data, error: rangeErr } = await supabase
      .from(table)
      .select(`min:${date_column}.min(),max:${date_column}.max()`);
    if (rangeErr) throw new Error(`range query failed: ${rangeErr.message}`);
    const row = data?.[0];
    if (row && row.min && row.max) {
      overview.date_range = {
        min: String(row.min).slice(0, 10),
        max: String(row.max).slice(0, 10),
      };
    }
  }
  return overview;
}

export function createDataOverviewTool(supabase: SupabaseClient, allowedTables: Set<string>) {
  return tool(
    async ({ table, date_column }) =>
      JSON.stringify(await computeDataOverview(supabase, table, date_column, allowedTables)),
    {
      name: 'data_overview',
      description:
        'Get total row count and (optional) min/max of a date column for a tenant-scoped table. Use to diagnose 0-result queries.',
      schema: z.object({
        table: z.string().describe('Table name to inspect'),
        date_column: z.string().optional().describe('Optional date column for range'),
      }),
    },
  );
}
