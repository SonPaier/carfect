// libs/ai/src/server/tools/runSql.ts
import { tool } from 'langchain';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateSql } from '../validateSql';
import { computeDataOverview } from './dataOverview';

const FROM_RE = /\bfrom\s+(?:public\.)?([a-z_][a-z0-9_]*)/i;

export function extractFromTable(sql: string): string | null {
  const match = FROM_RE.exec(sql);
  return match ? match[1] : null;
}

function injectLimitIfMissing(sql: string, defaultLimit = 50): string {
  if (/\blimit\s+\d+/i.test(sql)) return sql;
  return `${sql.trim()} LIMIT ${defaultLimit}`;
}

export interface RunSqlInput {
  sql: string;
  intent: string;
}
export interface RunSqlResult {
  rows?: unknown[];
  row_count?: number;
  truncated?: boolean;
  warning?: string;
  auto_overview?: unknown;
  execution_ms?: number;
  error?: string;
}

export async function executeRunSql(
  supabase: SupabaseClient,
  { sql, intent }: RunSqlInput,
  instanceId: string,
  allowedTables: Set<string>,
): Promise<string> {
  const validationError = validateSql(sql);
  if (validationError) return JSON.stringify({ error: validationError });
  const finalSql = injectLimitIfMissing(sql.trim().replace(/;+$/, ''));
  const start = Date.now();
  const { data, error } = await supabase.rpc('execute_readonly_query', {
    query_text: finalSql,
    target_instance_id: instanceId,
  });
  const execMs = Date.now() - start;
  if (error)
    return JSON.stringify({ error: `SQL error: ${error.message}. Fix the query and try again.` });
  const rows = Array.isArray(data) ? (data as unknown[]) : [];
  const result: RunSqlResult = { rows, row_count: rows.length, execution_ms: execMs };
  if (rows.length === 50) result.truncated = true;

  if (rows.length === 0) {
    const tableName = extractFromTable(finalSql);
    if (tableName && allowedTables.has(tableName)) {
      try {
        result.auto_overview = await computeDataOverview(
          supabase,
          tableName,
          undefined,
          allowedTables,
        );
        result.warning = `Query returned 0 rows. Table ${tableName} has ${(result.auto_overview as { total_rows: number }).total_rows} total rows.`;
      } catch {
        // best-effort; don't fail the whole tool call
      }
    }
  }
  void intent; // logged elsewhere; intent isn't used in execution
  return JSON.stringify(result);
}

export function createRunSqlTool(
  supabase: SupabaseClient,
  instanceId: string,
  allowedTables: Set<string>,
) {
  return tool(
    async (input: RunSqlInput) => executeRunSql(supabase, input, instanceId, allowedTables),
    {
      name: 'run_sql',
      description:
        'Execute a SELECT SQL query. Tenant filtering enforced server-side via RLS — do NOT add WHERE instance_id. Returns rows + diagnostic auto_overview when result is empty.',
      schema: z.object({
        sql: z.string().describe('A single SELECT statement.'),
        intent: z
          .string()
          .describe('One-line description of what this query is meant to answer (for audit logs).'),
      }),
    },
  );
}
