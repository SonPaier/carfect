// libs/ai/src/server/tools/lookupSchema.ts
import { tool } from 'langchain';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface LookupSchemaDeps {
  embed: (text: string) => Promise<number[]>;
  schemaContext: 'carfect' | 'hiservice';
}

export interface LookupSchemaResult {
  tables: Array<{ name: string; columns: unknown; description: string }>;
  glossary: Array<{ term_pl: string; meaning: string; related_tables: string[] }>;
}

export async function runLookupSchema(
  supabase: SupabaseClient,
  { embed, schemaContext }: LookupSchemaDeps,
  terms: string[],
): Promise<LookupSchemaResult> {
  const text = terms.join(' ').trim();
  if (!text) return { tables: [], glossary: [] };
  const embedding = await embed(text);
  const filter = { schema_context: schemaContext };

  const [{ data: schemaRows }, { data: glossRows }] = await Promise.all([
    supabase.rpc('match_schema_chunks', { query_embedding: embedding, match_count: 8, filter }),
    supabase.rpc('match_glossary', { query_embedding: embedding, match_count: 8, filter }),
  ]);

  return {
    tables: (schemaRows ?? []).map(
      (r: { content: string; metadata: { table_name: string; columns: unknown } }) => ({
        name: r.metadata.table_name,
        columns: r.metadata.columns,
        description: r.content,
      }),
    ),
    glossary: (glossRows ?? []).map(
      (r: { metadata: { term_pl: string; meaning: string; related_tables: string[] } }) => ({
        term_pl: r.metadata.term_pl,
        meaning: r.metadata.meaning,
        related_tables: r.metadata.related_tables,
      }),
    ),
  };
}

export function createLookupSchemaTool(supabase: SupabaseClient, deps: LookupSchemaDeps) {
  return tool(
    async ({ terms }: { terms: string[] }) =>
      JSON.stringify(await runLookupSchema(supabase, deps, terms)),
    {
      name: 'lookup_schema',
      description:
        'Find relevant tables and Polish business terms (glossary) for given keywords. Use BEFORE writing SQL to discover correct table names.',
      schema: z.object({
        terms: z
          .array(z.string())
          .min(1)
          .describe('Polish or English keywords to search by, e.g. ["zlecenia","marzec"]'),
      }),
    },
  );
}
