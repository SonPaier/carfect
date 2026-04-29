// scripts/sync-training-data.ts
// Usage: tsx scripts/sync-training-data.ts <schema_context>
// Reads YAML files from libs/ai/src/training/<schema_context>/, embeds them via OpenAI,
// upserts into Supabase pgvector tables. Idempotent via content-hash dedup.

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';
import yaml from 'yaml';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error(
    'Missing required env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY',
  );
  process.exit(1);
}

const schemaContext = process.argv[2] ?? 'carfect';
const baseDir = resolve(`libs/ai/src/training/${schemaContext}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

async function embedAll(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: texts });
  return res.data.map((d) => d.embedding);
}

async function syncTable<T>(args: {
  yamlPath: string;
  tableName: string;
  toContent: (item: T) => string;
  toMetadata: (item: T) => Record<string, unknown>;
}) {
  const items: T[] = yaml.parse(readFileSync(args.yamlPath, 'utf-8'));
  const contents = items.map(args.toContent);
  const embeddings = await embedAll(contents);

  // Wipe and re-insert per schema_context (simpler than diffing for v1)
  await supabase
    .from(args.tableName)
    .delete()
    .filter('metadata->>schema_context', 'eq', schemaContext);

  const rows = items.map((item, i) => ({
    content: contents[i],
    metadata: {
      ...args.toMetadata(item),
      schema_context: schemaContext,
      content_hash: hash(contents[i]),
    },
    embedding: embeddings[i],
  }));
  const { error } = await supabase.from(args.tableName).insert(rows);
  if (error) throw new Error(`${args.tableName} insert failed: ${error.message}`);
  console.log(`✓ Synced ${rows.length} rows to ${args.tableName}`);
}

async function main() {
  await syncTable<{ table_name: string; description: string; columns: unknown }>({
    yamlPath: `${baseDir}/schema.yaml`,
    tableName: 'ai_analyst_schema_chunks',
    toContent: (it) => `${it.table_name}: ${it.description}`,
    toMetadata: (it) => ({ table_name: it.table_name, columns: it.columns }),
  });

  await syncTable<{ term_pl: string; meaning: string; related_tables: string[] }>({
    yamlPath: `${baseDir}/glossary.yaml`,
    tableName: 'ai_analyst_glossary',
    toContent: (it) => `${it.term_pl}: ${it.meaning}`,
    toMetadata: (it) => ({
      term_pl: it.term_pl,
      meaning: it.meaning,
      related_tables: it.related_tables,
    }),
  });

  await syncTable<{ question: string; sql: string; notes?: string }>({
    yamlPath: `${baseDir}/examples.yaml`,
    tableName: 'ai_analyst_training_examples',
    toContent: (it) => it.question,
    toMetadata: (it) => ({ sql: it.sql, notes: it.notes ?? '' }),
  });

  console.log('Sync complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
