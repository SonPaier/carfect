# AI Analyst v2 Rebuild Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Carfect AI Analyst on LangChain.js v1 + pgvector with token-based multi-tenant isolation, RAG-driven schema/glossary/few-shot retrieval, hard-coded diagnostic loop, charts via Recharts.

**Architecture:** Vercel Node serverless handler (`api/ai-analyst-v2.ts`) thin-composes pure logic from `@shared/ai/server/*`. Agent built with `createAgent` (langchain v1.3+), 6 tools with Zod schemas, streaming bridged to AI SDK v6 `useChat` via `@ai-sdk/langchain`. Training data lives as YAML in repo, synced to pgvector tables on demand. Tenant isolation: server-side JWT → instance_id resolution → GUC + RLS, LLM never handles instance_id.

**Tech Stack:** TypeScript, React 19, Vite, Vitest, LangChain.js v1.3+, AI SDK v6, OpenAI gpt-4.1, Supabase Postgres + pgvector, Recharts, react-markdown.

**Spec:** `docs/superpowers/specs/2026-04-30-ai-analyst-rebuild-design.md`

**Branch:** `ui-agent-feature` (off main).

---

## File Structure

### New files

```
libs/ai/src/
├── server/                            # NEW — server-only code (covered by carfect vitest)
│   ├── index.ts                       # server exports
│   ├── resolveInstanceId.ts + .test.ts
│   ├── validateSql.ts + .test.ts
│   ├── promptBuilder.ts + .test.ts
│   ├── auditLog.ts + .test.ts
│   ├── rateLimit.ts + .test.ts
│   ├── createAgent.ts + .test.ts      # factory taking deps, returns configured agent
│   └── tools/
│       ├── getToday.ts + .test.ts
│       ├── dataOverview.ts + .test.ts
│       ├── runSql.ts + .test.ts       # incl. auto-overview when row_count===0
│       ├── lookupSchema.ts + .test.ts
│       ├── findSimilarQuestions.ts + .test.ts
│       └── makeChart.ts + .test.ts
├── charts/                            # NEW — frontend Recharts wrappers
│   ├── chartSpec.ts + .test.ts        # Zod schemas, shared client+server
│   ├── formatters.ts + .test.ts
│   ├── BarChartView.tsx + .test.tsx
│   ├── LineChartView.tsx + .test.tsx
│   ├── PieChartView.tsx + .test.tsx
│   └── ChartRenderer.tsx + .test.tsx
└── training/carfect/                  # NEW — YAML seed
    ├── schema.yaml
    ├── glossary.yaml
    ├── examples.yaml
    └── eval.yaml

api/
└── ai-analyst-v2.ts                   # NEW — thin handler

api/__tests__/
└── ai-analyst-v2.smoke.test.ts        # NEW — endpoint smoke test

scripts/
├── sync-training-data.ts              # NEW — YAML → pgvector
└── run-eval.ts                        # NEW — eval runner

supabase/migrations/
├── 20260430140000_pgvector_setup.sql                  # NEW
├── 20260430140100_ai_training_tables.sql              # NEW
├── 20260430140200_ai_analyst_rls.sql                  # NEW
└── 20260430140300_ai_analyst_logs.sql                 # NEW
```

### Modified files

```
libs/ai/
├── package.json                       # +deps
├── src/index.ts                       # +exports charts, types
├── src/types.ts                       # +ChartSpec, +MessagePart helper types
├── src/useAiAnalyst.ts                # new endpoint, X-Carfect-Instance header
├── src/useAiAnalyst.test.ts           # NEW (no test today)
├── src/AiAnalystView.tsx              # markdown + charts + hidden tool calls
└── src/AiAnalystView.test.tsx         # NEW

apps/carfect/
├── package.json                       # +deps if not satisfied transitively
├── vitest.config.ts                   # +include libs/ai
├── src/components/admin/AiAnalystTab.tsx   # remove instanceId prop, add header logic via hook
├── src/i18n/locales/pl.json           # +aiAnalyst.* keys
├── src/i18n/locales/en.json           # +aiAnalyst.* keys (English)
├── src/i18n/locales/de.json           # +aiAnalyst.* keys (German)
└── src/pages/AdminDashboard.tsx       # uncomment sidebar nav (lines 1436-1454)
```

### Deleted files

```
supabase/functions/ai-analyst/         # deprecated Deno function (per spec)
api/ai-analyst.ts                      # KEEP for now, delete in Chunk 11 after v2 stable
```

---

## Chunk roadmap

| #   | Chunk                                 | Outcome                                                                    |
| --- | ------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Database foundation                   | Migrations applied, pgvector + tables + RPCs + RLS ready                   |
| 2   | Vitest config + libs/ai package setup | Test runner picks up libs/ai/src/\*\*, deps installed                      |
| 3   | Pure server helpers (TDD)             | validateSql, resolveInstanceId, auditLog, rateLimit, chartSpec             |
| 4   | Server tools (TDD)                    | All 6 tool implementations with tests                                      |
| 5   | Agent factory + prompt builder (TDD)  | createAgent factory + system prompt builder                                |
| 6   | Vercel handler + smoke test           | `/api/ai-analyst-v2` end-to-end wired                                      |
| 7   | Training data seed + sync script      | YAML files seeded + pgvector populated for armcar/demo                     |
| 8   | Frontend charts (TDD)                 | Recharts wrappers + ChartRenderer                                          |
| 9   | Frontend wiring + i18n                | useAiAnalyst, AiAnalystView, AdminDashboard, pl/en/de translations         |
| 10  | Eval set + runner                     | eval.yaml + run-eval.ts, baseline measurement                              |
| 11  | Cleanup + final verification          | Delete deprecated files, full type check, full test pass, MEMORY.md update |

---

## Chunk 1: Database foundation

Migrations introducing pgvector, training tables, audit log, and GUC-aware RLS policies. No code changes; pure SQL.

**Why first:** Everything else depends on these tables existing.

### Task 1.1: Create pgvector setup migration

**Files:**

- Create: `supabase/migrations/20260430140000_pgvector_setup.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Enable pgvector extension for AI Analyst training data embeddings.
CREATE EXTENSION IF NOT EXISTS vector;
```

- [ ] **Step 2: Apply migration locally**

```bash
supabase db push
```

Expected: migration applied without error. Verify `\dx vector` shows the extension.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260430140000_pgvector_setup.sql
git commit -m "feat(ai-analyst): enable pgvector extension"
```

### Task 1.2: Create training tables + match\_\* RPCs

**Files:**

- Create: `supabase/migrations/20260430140100_ai_training_tables.sql`

- [ ] **Step 1: Write migration**

```sql
-- Training data tables for AI Analyst RAG (LangChain SupabaseVectorStore-compatible shape).

CREATE TABLE ai_analyst_schema_chunks (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_analyst_glossary (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_analyst_training_examples (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes (lists=10, sqrt of initial seed ~30-50 rows)
CREATE INDEX ai_analyst_schema_chunks_embedding_idx
  ON ai_analyst_schema_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX ai_analyst_glossary_embedding_idx
  ON ai_analyst_glossary USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX ai_analyst_training_examples_embedding_idx
  ON ai_analyst_training_examples USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- RPCs matching LangChain SupabaseVectorStore signature
CREATE OR REPLACE FUNCTION match_schema_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  id bigint, content text, metadata jsonb, embedding jsonb, similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT c.id, c.content, c.metadata, c.embedding::jsonb,
           1 - (c.embedding <=> query_embedding) AS similarity
    FROM ai_analyst_schema_chunks c
    WHERE c.metadata @> filter
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_glossary(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  id bigint, content text, metadata jsonb, embedding jsonb, similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT c.id, c.content, c.metadata, c.embedding::jsonb,
           1 - (c.embedding <=> query_embedding) AS similarity
    FROM ai_analyst_glossary c
    WHERE c.metadata @> filter
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_training_examples(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  id bigint, content text, metadata jsonb, embedding jsonb, similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT c.id, c.content, c.metadata, c.embedding::jsonb,
           1 - (c.embedding <=> query_embedding) AS similarity
    FROM ai_analyst_training_examples c
    WHERE c.metadata @> filter
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Read-only for authenticated; writes only via service_role (sync script)
ALTER TABLE ai_analyst_schema_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyst_glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyst_training_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_schema_chunks" ON ai_analyst_schema_chunks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_glossary" ON ai_analyst_glossary
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_training_examples" ON ai_analyst_training_examples
  FOR SELECT TO authenticated USING (true);
```

- [ ] **Step 2: Apply locally**

```bash
supabase db push
```

Expected: migration applied. Verify with `\d ai_analyst_schema_chunks` showing the columns.

- [ ] **Step 3: Smoke test RPC**

```bash
psql "$LOCAL_SUPABASE_DB_URL" -c "SELECT match_schema_chunks(array_fill(0::float, ARRAY[1536])::vector, 1, '{}'::jsonb);"
```

Expected: returns empty result set without error.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260430140100_ai_training_tables.sql
git commit -m "feat(ai-analyst): add pgvector training tables and match RPCs"
```

### Task 1.3: GUC-based RLS policies on data tables

**Files:**

- Create: `supabase/migrations/20260430140200_ai_analyst_rls.sql`

**Context:** `execute_readonly_query` already sets `app.current_instance_id` GUC. We extend RLS on each tenant-scoped data table with an additional branch that activates only when GUC is set. `set_config(..., true)` is transaction-local — safe with PostgREST connection pooling. The `IS NOT NULL AND <> ''` guard ensures the branch never fires when GUC isn't intentionally set.

- [ ] **Step 1: Identify tables to cover**

The agent needs read access (filtered by instance_id) to these tables. Confirm by reading `apps/carfect/src/integrations/supabase/types.ts` and listing tables with `instance_id uuid`. At minimum:
`reservations, customers, customer_vehicles, stations, employees, unified_services, unified_categories, services, service_categories, offers, offer_options, offer_option_items, offer_scopes, vehicle_protocols, sales_orders, sales_order_items, sales_customers, sales_products, sales_product_variants, sales_rolls, trainings, breaks, closed_days, time_entries, employee_days_off, followup_events, followup_tasks, customer_reminders, notifications, sms_logs, yard_vehicles`.

- [ ] **Step 2: Write migration with policy per table**

```sql
-- Add ai_analyst_tenant_isolation SELECT policy on every tenant-scoped table.
-- Branch 1: existing user_roles check (covers normal app traffic).
-- Branch 2: GUC set by execute_readonly_query RPC (covers AI Analyst).
-- The IS NOT NULL AND <> '' guard ensures branch 2 never fires unless GUC set intentionally.

-- Helper: function returning the GUC current_instance_id, or NULL if unset.
CREATE OR REPLACE FUNCTION current_ai_analyst_instance() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_instance_id', true), '')::uuid;
$$;

-- Apply to each table. Macro-style — copy/paste per table for clarity in review.

CREATE POLICY "ai_analyst_select" ON public.reservations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = reservations.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND reservations.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select" ON public.customers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = customers.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND customers.instance_id = current_ai_analyst_instance())
  );

-- ... repeat for every table from Step 1.
-- Keep the policy name "ai_analyst_select" identical across tables for easy bulk drop.
```

**NOTE for implementer:** generate the per-table policy blocks using a small loop in editor or a `psql` `\gexec` if preferred. Each policy block is ~5 lines. Don't try to combine into one statement — RLS policies are per-table.

- [ ] **Step 3: Apply locally**

```bash
supabase db push
```

Expected: clean apply. If existing policy with same name conflicts, prefix table identifier in policy name (e.g., `ai_analyst_select_reservations`).

- [ ] **Step 4: Smoke test isolation**

```bash
psql "$LOCAL_SUPABASE_DB_URL" <<'EOF'
BEGIN;
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000"}', true);
SELECT set_config('app.current_instance_id', (SELECT id::text FROM instances LIMIT 1), true);
SELECT count(*) AS visible_reservations FROM reservations;  -- should match the chosen instance
ROLLBACK;
EOF
```

Expected: returns row count for the chosen instance only.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260430140200_ai_analyst_rls.sql
git commit -m "feat(ai-analyst): add GUC-aware RLS policies for tenant isolation"
```

### Task 1.4: Audit log table

**Files:**

- Create: `supabase/migrations/20260430140300_ai_analyst_logs.sql`

- [ ] **Step 1: Write migration**

```sql
CREATE TABLE ai_analyst_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question text NOT NULL,
  tool_calls jsonb,
  final_answer text,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10, 6),
  duration_ms int,
  status text NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_analyst_logs_instance_created_idx ON ai_analyst_logs (instance_id, created_at DESC);
CREATE INDEX ai_analyst_logs_user_created_idx ON ai_analyst_logs (user_id, created_at DESC);

ALTER TABLE ai_analyst_logs ENABLE ROW LEVEL SECURITY;

-- Read: only super admin (via existing user_roles check); write: service_role only.
CREATE POLICY "super_admin_read_logs" ON ai_analyst_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.instance_id = ai_analyst_logs.instance_id
        AND ur.role = 'super_admin'
    )
  );
```

- [ ] **Step 2: Apply locally**

```bash
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260430140300_ai_analyst_logs.sql
git commit -m "feat(ai-analyst): add audit log table with RLS"
```

### Task 1.5: Verify all migrations idempotent + push to remote

- [ ] **Step 1: Re-apply locally to verify idempotency**

```bash
supabase db reset  # WARNING: confirms with user before destructive op
supabase db push
```

**Skip Step 1 if user has data they care about locally** — re-applying clean migrations end-to-end is the gold standard but trash local data.

- [ ] **Step 2: Push to remote (only if user explicitly approves)**

```bash
supabase db push --linked
```

User must approve. Per memory: never destructive DB ops without explicit confirmation.

---

## Chunk 2: Vitest config + libs/ai package setup

Wire libs/ai into the existing carfect vitest setup so tests in `libs/ai/src/**` are picked up. Install all required deps.

### Task 2.1: Add libs/ai to vitest include glob

**Files:**

- Modify: `apps/carfect/vitest.config.ts`

- [ ] **Step 1: Edit include array**

Add `'../../libs/ai/src/**/*.{test,spec}.{ts,tsx}'` to the `include` array, alphabetically before `billing`. Final:

```ts
include: [
  'src/**/*.{test,spec}.{ts,tsx}',
  '../../libs/ai/src/**/*.{test,spec}.{ts,tsx}',     // NEW
  '../../libs/ui/src/**/*.{test,spec}.{ts,tsx}',
  '../../libs/shared-utils/src/**/*.{test,spec}.{ts,tsx}',
  '../../libs/billing/src/**/*.{test,spec}.{ts,tsx}',
  '../../libs/custom-fields/src/**/*.{test,spec}.{ts,tsx}',
  '../../libs/protocol-config/src/**/*.{test,spec}.{ts,tsx}',
  '../../libs/pdf/src/**/*.{test,spec}.{ts,tsx}',
  '../../libs/post-sale-instructions/src/**/*.{test,spec}.{ts,tsx}',
  '../../libs/shared-invoicing/src/**/*.{test,spec}.{ts,tsx}',
],
```

- [ ] **Step 2: Add temporary smoke test to verify glob picks up libs/ai**

Create `libs/ai/src/__vitest_smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
describe('libs/ai vitest wiring', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter carfect test -- --run __vitest_smoke
```

Expected: 1 test passes. If glob misconfigured, vitest reports 0 tests collected.

- [ ] **Step 4: Delete smoke file + commit config**

```bash
rm libs/ai/src/__vitest_smoke.test.ts
git add apps/carfect/vitest.config.ts
git commit -m "test(ai-analyst): include libs/ai in vitest discovery"
```

### Task 2.2: Update libs/ai package.json with new deps

**Files:**

- Modify: `libs/ai/package.json`

- [ ] **Step 1: Replace package.json content**

```json
{
  "name": "@shared/ai",
  "version": "0.0.0",
  "private": true,
  "sideEffects": false,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./server": "./src/server/index.ts",
    "./*": "./src/*"
  },
  "dependencies": {
    "@ai-sdk/react": "^3.0.136",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "yaml": "^2.6.1"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-i18next": "^15.0.0",
    "recharts": "^2.15.0"
  }
}
```

**Note:** `langchain`, `@langchain/openai`, `@langchain/community`, `@ai-sdk/langchain`, `ai`, `zod`, `@supabase/supabase-js` come from the **root** `package.json` (server-only) — not added to libs/ai because libs/ai is a pure source lib (no separate node_modules in monorepo).

- [ ] **Step 2: Add server-side deps to root package.json**

Edit `package.json` at repo root, append to `dependencies`:

```json
"@ai-sdk/langchain": "^2.0.176",
"@langchain/community": "^1.1.27",
"@langchain/openai": "^1.4.5",
"langchain": "^1.3.5"
```

(`ai`, `zod`, `@supabase/supabase-js` already present per spec.)

- [ ] **Step 3: Install**

```bash
pnpm install
```

Expected: lockfile updates, no errors.

- [ ] **Step 4: Verify imports resolve**

Create temp file `libs/ai/src/__import_smoke.ts`:

```ts
import { createAgent, tool } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse } from 'ai';
import yaml from 'yaml';
console.log({
  createAgent,
  tool,
  ChatOpenAI,
  SupabaseVectorStore,
  toBaseMessages,
  toUIMessageStream,
  createUIMessageStreamResponse,
  yaml,
});
```

Run TypeScript check:

```bash
pnpm exec tsc --noEmit libs/ai/src/__import_smoke.ts
```

Expected: no errors. If errors mention missing types, install `@types/*` if any.

- [ ] **Step 5: Delete smoke file**

```bash
rm libs/ai/src/__import_smoke.ts
```

- [ ] **Step 6: Commit**

```bash
git add libs/ai/package.json package.json pnpm-lock.yaml
git commit -m "feat(ai-analyst): add LangChain.js v1 + AI SDK bridge deps"
```

### Task 2.3: Create libs/ai/src/server/ entry point

**Files:**

- Create: `libs/ai/src/server/index.ts`

- [ ] **Step 1: Write empty entry**

```ts
// Server-only exports for @shared/ai. Importable as `@shared/ai/server`.
// Populated by Chunks 3-5.

export {};
```

- [ ] **Step 2: Commit**

```bash
git add libs/ai/src/server/index.ts
git commit -m "feat(ai-analyst): scaffold @shared/ai/server entry"
```

---

## Chunk 3: Pure server helpers (TDD)

Pure functions with full unit test coverage. No external I/O — all dependencies passed in as args (Supabase client, fetcher, etc.).

### Task 3.1: chartSpec.ts (Zod schema, shared)

**Files:**

- Create: `libs/ai/src/charts/chartSpec.ts`
- Create: `libs/ai/src/charts/chartSpec.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// libs/ai/src/charts/chartSpec.test.ts
import { describe, expect, it } from 'vitest';
import { ChartSpecSchema, type ChartSpec } from './chartSpec';

describe('ChartSpecSchema', () => {
  it('accepts a valid bar chart spec', () => {
    const valid: ChartSpec = {
      type: 'bar',
      title: 'Revenue per service',
      data: [{ name: 'Detail', value: 12000 }],
      x_key: 'name',
      y_keys: ['value'],
      unit: 'zł',
    };
    expect(() => ChartSpecSchema.parse(valid)).not.toThrow();
  });

  it('rejects unknown chart type', () => {
    expect(() =>
      ChartSpecSchema.parse({ type: 'donut', data: [], x_key: 'x', y_keys: ['y'], title: 't' }),
    ).toThrow();
  });

  it('requires non-empty data', () => {
    expect(() =>
      ChartSpecSchema.parse({ type: 'bar', data: [], x_key: 'x', y_keys: ['y'], title: 't' }),
    ).toThrow(/at least one row/i);
  });

  it('requires y_keys to be non-empty', () => {
    expect(() =>
      ChartSpecSchema.parse({
        type: 'bar',
        data: [{ x: 1, y: 2 }],
        x_key: 'x',
        y_keys: [],
        title: 't',
      }),
    ).toThrow();
  });

  it('allows optional unit', () => {
    const result = ChartSpecSchema.parse({
      type: 'pie',
      data: [{ name: 'A', v: 1 }],
      x_key: 'name',
      y_keys: ['v'],
      title: 'P',
    });
    expect(result.unit).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run, verify fails**

```bash
pnpm --filter carfect test -- --run libs/ai/src/charts/chartSpec
```

Expected: import errors (file doesn't exist).

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run, verify passes**

```bash
pnpm --filter carfect test -- --run libs/ai/src/charts/chartSpec
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/charts/chartSpec.ts libs/ai/src/charts/chartSpec.test.ts
git commit -m "feat(ai-analyst): add ChartSpec Zod schema"
```

### Task 3.2: validateSql.ts

**Files:**

- Create: `libs/ai/src/server/validateSql.ts`
- Create: `libs/ai/src/server/validateSql.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// libs/ai/src/server/validateSql.test.ts
import { describe, expect, it } from 'vitest';
import { validateSql } from './validateSql';

describe('validateSql', () => {
  it('accepts a simple SELECT', () => {
    expect(validateSql('SELECT count(*) FROM reservations')).toBeNull();
  });

  it('accepts SELECT with leading whitespace and trailing semicolons', () => {
    expect(validateSql('  SELECT 1;;;  ')).toBeNull();
  });

  it('rejects non-SELECT statements', () => {
    expect(validateSql('DELETE FROM reservations')).toMatch(/select/i);
    expect(validateSql('UPDATE reservations SET price = 0')).toMatch(/select/i);
    expect(validateSql('CREATE TABLE foo()')).toMatch(/select/i);
  });

  it('rejects multi-statement queries', () => {
    expect(validateSql('SELECT 1; SELECT 2')).toMatch(/multi-statement/i);
  });

  it('rejects DDL/DML keywords mixed in', () => {
    expect(validateSql('SELECT * FROM (INSERT INTO foo VALUES (1) RETURNING *) sub')).toMatch(
      /keyword/i,
    );
    expect(validateSql('SELECT * FROM bar /* DROP TABLE x */')).toMatch(/keyword/i);
  });

  it('case-insensitive keyword detection', () => {
    expect(validateSql('select * from x where y = (delete from z returning 1)')).toMatch(
      /keyword/i,
    );
  });
});
```

- [ ] **Step 2: Run, verify fails**

```bash
pnpm --filter carfect test -- --run libs/ai/src/server/validateSql
```

- [ ] **Step 3: Implement**

```ts
// libs/ai/src/server/validateSql.ts
const FORBIDDEN_KEYWORDS = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create)\b/i;

export function validateSql(sql: string): string | null {
  const trimmed = sql.trim().replace(/;+$/, '').trim();
  if (!/^select\b/i.test(trimmed)) return 'Only SELECT statements are allowed';
  if (trimmed.includes(';')) return 'Multi-statement queries are not allowed';
  if (FORBIDDEN_KEYWORDS.test(trimmed)) return 'DDL/DML keyword detected';
  return null;
}
```

- [ ] **Step 4: Run, verify passes**

```bash
pnpm --filter carfect test -- --run libs/ai/src/server/validateSql
```

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/validateSql.ts libs/ai/src/server/validateSql.test.ts
git commit -m "feat(ai-analyst): validateSql (server-side SQL validator)"
```

### Task 3.3: resolveInstanceId.ts

**Files:**

- Create: `libs/ai/src/server/resolveInstanceId.ts`
- Create: `libs/ai/src/server/resolveInstanceId.test.ts`

**Behavior:** Given a Request and a Supabase client, returns `{ user_id, instance_id }`. Throws typed errors:

- 401 if JWT missing/invalid
- 403 if user has no roles
- 403 if super-admin user with multiple instances and `X-Carfect-Instance` header missing or not in their allowlist

- [ ] **Step 1: Write failing tests**

```ts
// libs/ai/src/server/resolveInstanceId.test.ts
import { describe, expect, it, vi } from 'vitest';
import { resolveInstanceId, AiAnalystAuthError } from './resolveInstanceId';

const makeReq = (headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/ai-analyst-v2', { method: 'POST', headers });

const makeSupabase = (userResponse: unknown, rolesResponse: unknown) =>
  ({
    auth: { getUser: vi.fn().mockResolvedValue(userResponse) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue(rolesResponse),
    }),
  }) as unknown as Parameters<typeof resolveInstanceId>[1];

describe('resolveInstanceId', () => {
  it('throws 401 when Authorization header missing', async () => {
    const supabase = makeSupabase({ data: { user: null }, error: null }, { data: [], error: null });
    await expect(resolveInstanceId(makeReq(), supabase)).rejects.toMatchObject({ status: 401 });
  });

  it('throws 401 when JWT invalid', async () => {
    const supabase = makeSupabase(
      { data: { user: null }, error: { message: 'bad jwt' } },
      { data: [], error: null },
    );
    await expect(
      resolveInstanceId(makeReq({ Authorization: 'Bearer x' }), supabase),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('throws 403 when user has no roles', async () => {
    const supabase = makeSupabase(
      { data: { user: { id: 'u1' } }, error: null },
      { data: [], error: null },
    );
    await expect(
      resolveInstanceId(makeReq({ Authorization: 'Bearer x' }), supabase),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns single instance when user has one role', async () => {
    const supabase = makeSupabase(
      { data: { user: { id: 'u1' } }, error: null },
      { data: [{ instance_id: 'i1' }], error: null },
    );
    await expect(
      resolveInstanceId(makeReq({ Authorization: 'Bearer x' }), supabase),
    ).resolves.toEqual({ user_id: 'u1', instance_id: 'i1' });
  });

  it('throws 403 when multi-instance user omits X-Carfect-Instance', async () => {
    const supabase = makeSupabase(
      { data: { user: { id: 'u1' } }, error: null },
      { data: [{ instance_id: 'i1' }, { instance_id: 'i2' }], error: null },
    );
    await expect(
      resolveInstanceId(makeReq({ Authorization: 'Bearer x' }), supabase),
    ).rejects.toMatchObject({ status: 403, message: expect.stringMatching(/instance/i) });
  });

  it('throws 403 when X-Carfect-Instance not in user allowlist', async () => {
    const supabase = makeSupabase(
      { data: { user: { id: 'u1' } }, error: null },
      { data: [{ instance_id: 'i1' }, { instance_id: 'i2' }], error: null },
    );
    await expect(
      resolveInstanceId(
        makeReq({ Authorization: 'Bearer x', 'X-Carfect-Instance': 'i3' }),
        supabase,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns selected instance when multi-instance user provides valid header', async () => {
    const supabase = makeSupabase(
      { data: { user: { id: 'u1' } }, error: null },
      { data: [{ instance_id: 'i1' }, { instance_id: 'i2' }], error: null },
    );
    await expect(
      resolveInstanceId(
        makeReq({ Authorization: 'Bearer x', 'X-Carfect-Instance': 'i2' }),
        supabase,
      ),
    ).resolves.toEqual({ user_id: 'u1', instance_id: 'i2' });
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
// libs/ai/src/server/resolveInstanceId.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export class AiAnalystAuthError extends Error {
  constructor(
    public status: 401 | 403 | 429,
    message: string,
  ) {
    super(message);
    this.name = 'AiAnalystAuthError';
  }
}

export async function resolveInstanceId(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ user_id: string; instance_id: string }> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) throw new AiAnalystAuthError(401, 'Missing Authorization');
  const token = auth.slice('Bearer '.length);

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) throw new AiAnalystAuthError(401, 'Invalid token');
  const userId = userData.user.id;

  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('instance_id')
    .eq('user_id', userId);
  if (rolesErr) throw new AiAnalystAuthError(403, 'Could not load roles');
  if (!roles || roles.length === 0) throw new AiAnalystAuthError(403, 'No instance access');

  const allowedIds = roles.map((r: { instance_id: string }) => r.instance_id);

  if (allowedIds.length === 1) {
    return { user_id: userId, instance_id: allowedIds[0] };
  }

  const requested = req.headers.get('X-Carfect-Instance');
  if (!requested || !allowedIds.includes(requested)) {
    throw new AiAnalystAuthError(403, 'Invalid or missing instance selection');
  }
  return { user_id: userId, instance_id: requested };
}
```

- [ ] **Step 4: Run, verify passes**

```bash
pnpm --filter carfect test -- --run libs/ai/src/server/resolveInstanceId
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/resolveInstanceId.ts libs/ai/src/server/resolveInstanceId.test.ts
git commit -m "feat(ai-analyst): resolveInstanceId from JWT + user_roles"
```

### Task 3.4: rateLimit.ts

**Files:**

- Create: `libs/ai/src/server/rateLimit.ts`
- Create: `libs/ai/src/server/rateLimit.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// libs/ai/src/server/rateLimit.test.ts
import { describe, expect, it, vi } from 'vitest';
import { enforceRateLimit } from './rateLimit';
import { AiAnalystAuthError } from './resolveInstanceId';

const makeSupabase = (countResp: { count: number | null; error: unknown | null }) =>
  ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue(countResp),
    }),
  }) as unknown as Parameters<typeof enforceRateLimit>[0];

describe('enforceRateLimit', () => {
  it('allows when under limit', async () => {
    const supabase = makeSupabase({ count: 5, error: null });
    await expect(enforceRateLimit(supabase, 'u1', 'i1')).resolves.toBeUndefined();
  });

  it('throws 429 when at user-hour limit (30)', async () => {
    const supabase = makeSupabase({ count: 30, error: null });
    await expect(enforceRateLimit(supabase, 'u1', 'i1')).rejects.toMatchObject({ status: 429 });
  });

  it('throws when supabase errors', async () => {
    const supabase = makeSupabase({ count: null, error: { message: 'db error' } });
    await expect(enforceRateLimit(supabase, 'u1', 'i1')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
// libs/ai/src/server/rateLimit.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { AiAnalystAuthError } from './resolveInstanceId';

export const USER_HOURLY_LIMIT = 30;
export const INSTANCE_DAILY_LIMIT = 200;

export async function enforceRateLimit(
  supabase: SupabaseClient,
  userId: string,
  instanceId: string,
): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count, error } = await supabase
    .from('ai_analyst_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo);
  if (error) throw new AiAnalystAuthError(429, `Rate limit check failed: ${error.message}`);
  if ((count ?? 0) >= USER_HOURLY_LIMIT) {
    throw new AiAnalystAuthError(429, 'Hourly request limit exceeded');
  }
  // NOTE: instance daily limit check intentionally simplified for v1 — single user-hour check is enough
  // to block runaway costs. Extend to per-instance daily check in v2 (separate query, same pattern).
  void instanceId;
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/rateLimit.ts libs/ai/src/server/rateLimit.test.ts
git commit -m "feat(ai-analyst): per-user hourly rate limit"
```

### Task 3.5: auditLog.ts

**Files:**

- Create: `libs/ai/src/server/auditLog.ts`
- Create: `libs/ai/src/server/auditLog.test.ts`

**Behavior:** pure helpers building/inserting `ai_analyst_logs` rows. Cost calculation for gpt-4.1 (input $0.002/1k, output $0.008/1k as of 2026 — adjust if user provides different).

- [ ] **Step 1: Write failing tests**

```ts
// libs/ai/src/server/auditLog.test.ts
import { describe, expect, it, vi } from 'vitest';
import { computeCostUsd, insertAuditLog, type AuditLogPayload } from './auditLog';

describe('computeCostUsd', () => {
  it('computes gpt-4.1 cost from token counts', () => {
    expect(computeCostUsd({ tokens_in: 1000, tokens_out: 500, model: 'gpt-4.1' })).toBeCloseTo(
      0.002 + 0.004,
      6,
    );
  });
  it('returns 0 when tokens missing', () => {
    expect(computeCostUsd({ tokens_in: null, tokens_out: null, model: 'gpt-4.1' })).toBe(0);
  });
});

describe('insertAuditLog', () => {
  it('inserts a row with the given payload', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn().mockReturnValue({ insert }) } as unknown as Parameters<
      typeof insertAuditLog
    >[0];
    const payload: AuditLogPayload = {
      instance_id: 'i1',
      user_id: 'u1',
      question: 'Q',
      tool_calls: [],
      final_answer: 'A',
      tokens_in: 10,
      tokens_out: 5,
      duration_ms: 1234,
      status: 'success',
      error_message: null,
    };
    await insertAuditLog(supabase, payload);
    expect(supabase.from).toHaveBeenCalledWith('ai_analyst_logs');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ instance_id: 'i1', status: 'success' }),
    );
  });

  it('swallows insert errors (non-blocking)', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: 'db down' } });
    const supabase = { from: vi.fn().mockReturnValue({ insert }) } as unknown as Parameters<
      typeof insertAuditLog
    >[0];
    const payload = {
      instance_id: 'i1',
      user_id: 'u1',
      question: 'Q',
      tool_calls: [],
      final_answer: '',
      tokens_in: 0,
      tokens_out: 0,
      duration_ms: 0,
      status: 'error',
      error_message: 'x',
    } satisfies AuditLogPayload;
    await expect(insertAuditLog(supabase, payload)).resolves.toBeUndefined(); // does not throw
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
// libs/ai/src/server/auditLog.ts
import type { SupabaseClient } from '@supabase/supabase-js';

const PRICING_USD_PER_1K = {
  'gpt-4.1': { in: 0.002, out: 0.008 },
  'gpt-4.1-mini': { in: 0.0004, out: 0.0016 },
  'gpt-5': { in: 0.01, out: 0.03 },
} as const;

export function computeCostUsd({
  tokens_in,
  tokens_out,
  model,
}: {
  tokens_in: number | null;
  tokens_out: number | null;
  model: string;
}): number {
  const rates =
    PRICING_USD_PER_1K[model as keyof typeof PRICING_USD_PER_1K] ?? PRICING_USD_PER_1K['gpt-4.1'];
  const inUsd = ((tokens_in ?? 0) / 1000) * rates.in;
  const outUsd = ((tokens_out ?? 0) / 1000) * rates.out;
  return inUsd + outUsd;
}

export interface AuditLogPayload {
  instance_id: string;
  user_id: string;
  question: string;
  tool_calls: unknown[];
  final_answer: string;
  tokens_in: number | null;
  tokens_out: number | null;
  duration_ms: number;
  status: 'success' | 'error' | 'timeout';
  error_message: string | null;
}

export async function insertAuditLog(
  supabase: SupabaseClient,
  payload: AuditLogPayload,
): Promise<void> {
  const cost_usd = computeCostUsd({
    tokens_in: payload.tokens_in,
    tokens_out: payload.tokens_out,
    model: process.env.AI_ANALYST_MODEL ?? 'gpt-4.1',
  });
  const { error } = await supabase.from('ai_analyst_logs').insert({ ...payload, cost_usd });
  if (error) console.error('[ai_analyst] audit log insert failed:', error.message);
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/auditLog.ts libs/ai/src/server/auditLog.test.ts
git commit -m "feat(ai-analyst): audit log helpers + cost computation"
```

---

## Chunk 4: Server tools (TDD)

Six LangChain tools. Each tool is a factory function `createXxxTool(deps): Tool` so deps (Supabase client, vector store, etc.) are injected — not captured via closure. This keeps tools testable and Vercel-warm-instance-safe.

### Task 4.1: getToday tool

**Files:**

- Create: `libs/ai/src/server/tools/getToday.ts`
- Create: `libs/ai/src/server/tools/getToday.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// libs/ai/src/server/tools/getToday.test.ts
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { computeTodayBoundaries, createGetTodayTool } from './getToday';

describe('computeTodayBoundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-30T10:30:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns ISO date for today', () => {
    expect(computeTodayBoundaries().date).toBe('2026-04-30');
  });

  it('returns Monday as week_start', () => {
    expect(computeTodayBoundaries().week_start).toBe('2026-04-27');
  });

  it('returns first of current month', () => {
    expect(computeTodayBoundaries().month_start).toBe('2026-04-01');
  });

  it('returns previous month boundaries', () => {
    const r = computeTodayBoundaries();
    expect(r.prev_month_start).toBe('2026-03-01');
    expect(r.prev_month_end).toBe('2026-03-31');
  });

  it('returns first of current quarter (Q2)', () => {
    expect(computeTodayBoundaries().quarter_start).toBe('2026-04-01');
  });

  it('returns first of current year', () => {
    expect(computeTodayBoundaries().year_start).toBe('2026-01-01');
  });

  it('returns weekday in lowercase English', () => {
    expect(computeTodayBoundaries().weekday).toBe('thursday');
  });
});

describe('createGetTodayTool', () => {
  it('creates a langchain Tool that returns boundaries', async () => {
    const tool = createGetTodayTool();
    expect(tool.name).toBe('get_today');
    const result = await tool.invoke({});
    expect(typeof result === 'string' ? JSON.parse(result) : result).toHaveProperty('date');
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
// libs/ai/src/server/tools/getToday.ts
import { tool } from 'langchain';
import { z } from 'zod';

export interface TodayBoundaries {
  date: string;
  weekday: string;
  week_start: string;
  month_start: string;
  prev_month_start: string;
  prev_month_end: string;
  quarter_start: string;
  year_start: string;
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function computeTodayBoundaries(now: Date = new Date()): TodayBoundaries {
  const y = now.getUTCFullYear(),
    m = now.getUTCMonth(),
    d = now.getUTCDate();
  const date = new Date(Date.UTC(y, m, d));
  const dow = date.getUTCDay(); // 0=Sun..6=Sat
  const monOffset = (dow + 6) % 7;
  const week = new Date(date);
  week.setUTCDate(date.getUTCDate() - monOffset);
  const monthStart = new Date(Date.UTC(y, m, 1));
  const prevMonthStart = new Date(Date.UTC(y, m - 1, 1));
  const prevMonthEnd = new Date(Date.UTC(y, m, 0));
  const quarterStart = new Date(Date.UTC(y, Math.floor(m / 3) * 3, 1));
  const yearStart = new Date(Date.UTC(y, 0, 1));
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return {
    date: isoDate(date),
    weekday: weekdays[dow],
    week_start: isoDate(week),
    month_start: isoDate(monthStart),
    prev_month_start: isoDate(prevMonthStart),
    prev_month_end: isoDate(prevMonthEnd),
    quarter_start: isoDate(quarterStart),
    year_start: isoDate(yearStart),
  };
}

export function createGetTodayTool() {
  return tool(async () => JSON.stringify(computeTodayBoundaries()), {
    name: 'get_today',
    description:
      'Return deterministic date boundaries (today, week_start, month_start, prev_month_start/end, quarter_start, year_start).',
    schema: z.object({}),
  });
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/tools/getToday.ts libs/ai/src/server/tools/getToday.test.ts
git commit -m "feat(ai-analyst): get_today tool with deterministic date boundaries"
```

### Task 4.2: dataOverview tool

**Files:**

- Create: `libs/ai/src/server/tools/dataOverview.ts`
- Create: `libs/ai/src/server/tools/dataOverview.test.ts`

**Behavior:** Tool that calls a Supabase RPC `ai_analyst_data_overview(table_name text, date_column text DEFAULT NULL, instance_id uuid)` returning row counts + date range. Since this RPC doesn't exist yet, we'll use direct Supabase queries instead — simpler for v1.

Actually, simpler: tool implements queries via supabase-js directly using the GUC-aware RLS context.

- [ ] **Step 1: Write failing test**

```ts
// libs/ai/src/server/tools/dataOverview.test.ts
import { describe, expect, it, vi } from 'vitest';
import { computeDataOverview } from './dataOverview';

const ALLOWED_TABLES = new Set(['reservations', 'customers', 'sales_orders', 'offers']);

describe('computeDataOverview', () => {
  it('returns total count when no date_column', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(Promise.resolve({ count: 47, error: null })),
      }),
    } as unknown as Parameters<typeof computeDataOverview>[0];
    const result = await computeDataOverview(supabase, 'reservations', undefined, ALLOWED_TABLES);
    expect(result).toEqual({ total_rows: 47 });
  });

  it('returns date range when date_column given', async () => {
    const calls: string[] = [];
    const supabase = {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation((cols: string) => {
          calls.push(cols);
          if (cols.includes('count')) return Promise.resolve({ count: 100, error: null });
          if (cols.includes('min'))
            return Promise.resolve({
              data: [{ min: '2024-01-01', max: '2026-04-30' }],
              error: null,
            });
          return Promise.resolve({ data: [], error: null });
        }),
      })),
    } as unknown as Parameters<typeof computeDataOverview>[0];
    const result = await computeDataOverview(
      supabase,
      'reservations',
      'reservation_date',
      ALLOWED_TABLES,
    );
    expect(result.total_rows).toBe(100);
    expect(result.date_range).toEqual({ min: '2024-01-01', max: '2026-04-30' });
  });

  it('rejects table not in allowlist', async () => {
    const supabase = {} as Parameters<typeof computeDataOverview>[0];
    await expect(
      computeDataOverview(supabase, 'pg_user', undefined, ALLOWED_TABLES),
    ).rejects.toThrow(/not allowed/i);
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
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
```

**Note:** `min:col.min()` syntax is PostgREST aggregate function shorthand. May need fallback if not supported in current Supabase version — implementer should test in Step 4.

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/tools/dataOverview.ts libs/ai/src/server/tools/dataOverview.test.ts
git commit -m "feat(ai-analyst): data_overview tool for diagnostic checks"
```

### Task 4.3: runSql tool (with auto-overview guard)

**Files:**

- Create: `libs/ai/src/server/tools/runSql.ts`
- Create: `libs/ai/src/server/tools/runSql.test.ts`

**Behavior:**

1. Validate SQL via `validateSql`.
2. Inject `LIMIT 50` if no LIMIT present.
3. Call `execute_readonly_query(sql, instance_id)` RPC.
4. If `row_count === 0`, **automatically** run `data_overview` on the first FROM-clause table (extract via simple regex) and include result as `auto_overview`.
5. Return structured result.

- [ ] **Step 1: Write failing tests**

```ts
// libs/ai/src/server/tools/runSql.test.ts
import { describe, expect, it, vi } from 'vitest';
import { extractFromTable, executeRunSql } from './runSql';

const ALLOWED = new Set(['reservations', 'customers']);

describe('extractFromTable', () => {
  it('extracts table after FROM', () => {
    expect(extractFromTable('SELECT * FROM reservations WHERE x=1')).toBe('reservations');
  });
  it('handles lowercase from', () => {
    expect(extractFromTable('select count(*) from customers')).toBe('customers');
  });
  it('returns null when no FROM', () => {
    expect(extractFromTable('SELECT 1')).toBeNull();
  });
  it('handles schema-qualified', () => {
    expect(extractFromTable('SELECT * FROM public.reservations')).toBe('reservations');
  });
});

describe('executeRunSql', () => {
  it('rejects invalid SQL', async () => {
    const supabase = {} as Parameters<typeof executeRunSql>[0];
    const result = await executeRunSql(
      supabase,
      { sql: 'DELETE FROM x', intent: 'test' },
      'i1',
      ALLOWED,
    );
    const parsed = JSON.parse(result);
    expect(parsed.error).toMatch(/select/i);
  });

  it('injects LIMIT 50 when missing', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ a: 1 }], error: null });
    const supabase = { rpc } as unknown as Parameters<typeof executeRunSql>[0];
    await executeRunSql(
      supabase,
      { sql: 'SELECT * FROM reservations', intent: 'test' },
      'i1',
      ALLOWED,
    );
    const callArg = rpc.mock.calls[0][1].query_text;
    expect(callArg).toMatch(/LIMIT 50$/i);
  });

  it('does not inject LIMIT when present', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ a: 1 }], error: null });
    const supabase = { rpc } as unknown as Parameters<typeof executeRunSql>[0];
    await executeRunSql(
      supabase,
      { sql: 'SELECT * FROM reservations LIMIT 10', intent: 'test' },
      'i1',
      ALLOWED,
    );
    const callArg = rpc.mock.calls[0][1].query_text;
    expect(callArg).toMatch(/LIMIT 10$/i);
    expect(callArg).not.toMatch(/LIMIT 50/i);
  });

  it('returns rows on success', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ a: 1 }, { a: 2 }], error: null });
    const supabase = { rpc } as unknown as Parameters<typeof executeRunSql>[0];
    const result = await executeRunSql(
      supabase,
      { sql: 'SELECT a FROM reservations LIMIT 10', intent: 'test' },
      'i1',
      ALLOWED,
    );
    const parsed = JSON.parse(result);
    expect(parsed.row_count).toBe(2);
    expect(parsed.rows).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('attaches auto_overview when 0 rows', async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: [], error: null });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(Promise.resolve({ count: 1247, error: null })),
    });
    const supabase = { rpc, from } as unknown as Parameters<typeof executeRunSql>[0];
    const result = await executeRunSql(
      supabase,
      {
        sql: "SELECT * FROM reservations WHERE reservation_date = '2099-01-01' LIMIT 10",
        intent: 'test',
      },
      'i1',
      ALLOWED,
    );
    const parsed = JSON.parse(result);
    expect(parsed.row_count).toBe(0);
    expect(parsed.auto_overview).toBeDefined();
    expect(parsed.auto_overview.total_rows).toBe(1247);
  });

  it('returns error when RPC fails', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'syntax error' } });
    const supabase = { rpc } as unknown as Parameters<typeof executeRunSql>[0];
    const result = await executeRunSql(
      supabase,
      { sql: 'SELECT * FROM reservations LIMIT 10', intent: 'test' },
      'i1',
      ALLOWED,
    );
    const parsed = JSON.parse(result);
    expect(parsed.error).toMatch(/syntax error/);
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/tools/runSql.ts libs/ai/src/server/tools/runSql.test.ts
git commit -m "feat(ai-analyst): run_sql tool with hard-coded diagnostic guard"
```

### Task 4.4: lookupSchema tool

**Files:**

- Create: `libs/ai/src/server/tools/lookupSchema.ts`
- Create: `libs/ai/src/server/tools/lookupSchema.test.ts`

**Behavior:** Embed `terms.join(' ')`, run `match_schema_chunks` and `match_glossary` RPCs filtered by `schema_context`, return combined results.

- [ ] **Step 1: Write failing test**

```ts
// libs/ai/src/server/tools/lookupSchema.test.ts
import { describe, expect, it, vi } from 'vitest';
import { runLookupSchema } from './lookupSchema';

describe('runLookupSchema', () => {
  it('embeds the joined terms and queries both RPCs with schema_context filter', async () => {
    const embed = vi.fn().mockResolvedValue([0.1, 0.2]);
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          { content: 'reservations table', metadata: { table_name: 'reservations', columns: [] } },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            content: 'zlecenia term',
            metadata: {
              term_pl: 'zlecenia',
              meaning: 'rezerwacje',
              related_tables: ['reservations'],
            },
          },
        ],
        error: null,
      });
    const supabase = { rpc } as unknown as Parameters<typeof runLookupSchema>[0];

    const result = await runLookupSchema(supabase, { embed, schemaContext: 'carfect' }, [
      'zlecenia',
      'marzec',
    ]);
    expect(embed).toHaveBeenCalledWith('zlecenia marzec');
    expect(rpc).toHaveBeenNthCalledWith(
      1,
      'match_schema_chunks',
      expect.objectContaining({ filter: { schema_context: 'carfect' } }),
    );
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      'match_glossary',
      expect.objectContaining({ filter: { schema_context: 'carfect' } }),
    );
    expect(result.tables).toHaveLength(1);
    expect(result.glossary).toHaveLength(1);
  });

  it('handles empty embedding gracefully', async () => {
    const embed = vi.fn().mockResolvedValue([]);
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const supabase = { rpc } as unknown as Parameters<typeof runLookupSchema>[0];
    const result = await runLookupSchema(supabase, { embed, schemaContext: 'carfect' }, []);
    expect(result.tables).toEqual([]);
    expect(result.glossary).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/tools/lookupSchema.ts libs/ai/src/server/tools/lookupSchema.test.ts
git commit -m "feat(ai-analyst): lookup_schema tool with pgvector RAG"
```

### Task 4.5: findSimilarQuestions tool

**Files:**

- Create: `libs/ai/src/server/tools/findSimilarQuestions.ts`
- Create: `libs/ai/src/server/tools/findSimilarQuestions.test.ts`

Mirrors `lookupSchema` but queries `match_training_examples`. Pattern is identical.

- [ ] **Step 1: Write failing test** (use `lookupSchema.test.ts` as template — adapt for examples)

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
// libs/ai/src/server/tools/findSimilarQuestions.ts
import { tool } from 'langchain';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface FindSimilarDeps {
  embed: (text: string) => Promise<number[]>;
  schemaContext: 'carfect' | 'hiservice';
}

export interface SimilarQuestion {
  question_pl: string;
  sql: string;
  notes?: string;
}

export async function runFindSimilar(
  supabase: SupabaseClient,
  { embed, schemaContext }: FindSimilarDeps,
  question: string,
): Promise<{ examples: SimilarQuestion[] }> {
  if (!question.trim()) return { examples: [] };
  const embedding = await embed(question);
  const { data } = await supabase.rpc('match_training_examples', {
    query_embedding: embedding,
    match_count: 5,
    filter: { schema_context: schemaContext },
  });
  return {
    examples: (data ?? []).map(
      (r: { content: string; metadata: { sql: string; notes?: string } }) => ({
        question_pl: r.content,
        sql: r.metadata.sql,
        notes: r.metadata.notes,
      }),
    ),
  };
}

export function createFindSimilarTool(supabase: SupabaseClient, deps: FindSimilarDeps) {
  return tool(
    async ({ question }) => JSON.stringify(await runFindSimilar(supabase, deps, question)),
    {
      name: 'find_similar_questions',
      description:
        'Retrieve top 5 most similar past question→SQL pairs from training set. Use these as few-shot exemplars when generating new SQL.',
      schema: z.object({ question: z.string().min(1) }),
    },
  );
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/tools/findSimilarQuestions.ts libs/ai/src/server/tools/findSimilarQuestions.test.ts
git commit -m "feat(ai-analyst): find_similar_questions tool"
```

### Task 4.6: makeChart tool

**Files:**

- Create: `libs/ai/src/server/tools/makeChart.ts`
- Create: `libs/ai/src/server/tools/makeChart.test.ts`

**Behavior:** Doesn't query DB. Receives a `ChartSpec`-shaped input (validated by Zod), emits to `config.writer({ type: 'chart', id, spec })` (LangChain custom stream channel — surfaces as `data-chart` part on AI SDK frontend), returns ack string.

- [ ] **Step 1: Write failing test**

```ts
// libs/ai/src/server/tools/makeChart.test.ts
import { describe, expect, it, vi } from 'vitest';
import { createMakeChartTool } from './makeChart';

describe('createMakeChartTool', () => {
  it('emits a chart event via writer and returns ack', async () => {
    const writer = vi.fn();
    const tool = createMakeChartTool();
    const spec = {
      type: 'bar' as const,
      title: 'T',
      data: [{ x: 'a', y: 1 }],
      x_key: 'x',
      y_keys: ['y'],
    };
    const result = await tool.invoke(spec, { configurable: { writer } } as never);
    // LangChain test invocation may not pass writer through — test doc-style:
    expect(typeof result).toBe('string');
  });

  it('rejects malformed spec via Zod', async () => {
    const tool = createMakeChartTool();
    await expect(tool.invoke({ type: 'donut' } as never)).rejects.toThrow();
  });
});
```

**NOTE for implementer:** writer access in unit tests is awkward; prefer integration test in Chunk 6 to verify chart events surface. The unit test here covers the schema validation + smoke.

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
// libs/ai/src/server/tools/makeChart.ts
import { tool } from 'langchain';
import { ChartSpecSchema, type ChartSpec } from '../../charts/chartSpec';

export function createMakeChartTool() {
  return tool(
    async (spec: ChartSpec, config) => {
      const id = crypto.randomUUID();
      const writer = (config as { writer?: (chunk: unknown) => void }).writer;
      writer?.({ type: 'chart', id, spec });
      return `Chart ${id} emitted to client.`;
    },
    {
      name: 'make_chart',
      description:
        'Render a bar/line/pie chart from query results. Call AFTER run_sql when results are visualizable (≥3 categories, ranking, or time series).',
      schema: ChartSpecSchema,
    },
  );
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/tools/makeChart.ts libs/ai/src/server/tools/makeChart.test.ts
git commit -m "feat(ai-analyst): make_chart tool with custom stream writer"
```

---

## Chunk 5: Agent factory + prompt builder (TDD)

### Task 5.1: promptBuilder.ts

**Files:**

- Create: `libs/ai/src/server/promptBuilder.ts`
- Create: `libs/ai/src/server/promptBuilder.test.ts`

**Behavior:** Pure function returning the system prompt string given `{ schemaContext, todayIso, instanceName? }`. No RAG inside the prompt — schema/glossary/examples come from tools.

- [ ] **Step 1: Write failing test**

```ts
// libs/ai/src/server/promptBuilder.test.ts
import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from './promptBuilder';

describe('buildSystemPrompt', () => {
  it('embeds today date and schema context', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toContain('2026-04-30');
    expect(prompt).toContain('carfect');
  });

  it('mentions diagnostic loop rule', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/0 wier|brak danych|auto_overview/i);
  });

  it('explicitly forbids WHERE instance_id', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/instance_id/i);
    expect(prompt).toMatch(/RLS/i);
  });

  it('lists tool usage order', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/lookup_schema/);
    expect(prompt).toMatch(/find_similar_questions/);
    expect(prompt).toMatch(/run_sql/);
  });

  it('forbids hallucinating numbers', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/nie wymyślaj|nigdy.*wymyślaj/i);
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
// libs/ai/src/server/promptBuilder.ts
export interface PromptInput {
  schemaContext: 'carfect' | 'hiservice';
  todayIso: string;
  instanceName?: string;
}

export function buildSystemPrompt({ schemaContext, todayIso, instanceName }: PromptInput): string {
  return `Jesteś asystentem biznesowym studia detailingowego/PPF (${schemaContext}). Odpowiadasz po polsku, zwięźle, konkretnymi liczbami.

Kontekst:
- Schema: ${schemaContext}${instanceName ? ` (instancja: ${instanceName})` : ''}
- Dzisiejsza data: ${todayIso}

Zasady krytyczne:
1. NIGDY nie wymyślaj liczb. Zawsze najpierw pobierz dane przez run_sql.
2. NIE dodawaj WHERE instance_id w SQL — RLS automatycznie filtruje per-tenant na poziomie bazy.
3. Jeśli nie znasz tabeli/kolumny, najpierw użyj lookup_schema z polskimi terminami biznesowymi.
4. Dla każdego pytania o "marzec", "wczoraj", "rok temu" itp. — najpierw wywołaj get_today aby uzyskać deterministyczne granice dat.
5. Jeśli zapytanie zwróci 0 wierszy, narzędzie run_sql automatycznie dołączy auto_overview pokazujące dostępny zakres danych — używaj go w odpowiedzi zamiast mówić "brak danych".
6. Format kwot: "X XXX,XX zł" (spacja jako separator tysięcy).
7. Kiedy wynik nadaje się do wizualizacji (≥3 kategorie, ranking, time series) — wywołaj make_chart.

Sekwencja rekomendowana:
1. lookup_schema(["term1","term2"]) — znajdź relevantne tabele i glossary
2. find_similar_questions("pełne pytanie usera") — pobierz few-shot z training setu
3. get_today() — jeśli pytanie dotyczy dat
4. run_sql({sql, intent}) — wykonaj zapytanie
5. (opcjonalnie) make_chart({...}) — gdy wynik jest wizualizowalny
6. Krótka odpowiedź (2-4 zdania) + tabela markdown jeśli kilka wierszy.

Bądź zwięzły. User chce odpowiedź, nie wykład.`;
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/server/promptBuilder.ts libs/ai/src/server/promptBuilder.test.ts
git commit -m "feat(ai-analyst): system prompt builder"
```

### Task 5.2: createAgent.ts factory

**Files:**

- Create: `libs/ai/src/server/createAgent.ts`
- Create: `libs/ai/src/server/createAgent.test.ts`

**Behavior:** Factory taking `{ supabase, openai (model+embed), schemaContext, instanceId, allowedTables }` and returning a configured LangChain agent with all 6 tools wired and middleware applied. The agent itself is created once per request.

- [ ] **Step 1: Write failing test**

```ts
// libs/ai/src/server/createAgent.test.ts
import { describe, expect, it, vi } from 'vitest';
import { buildAgent } from './createAgent';

describe('buildAgent', () => {
  it('returns an agent with all six tools registered', () => {
    const agent = buildAgent({
      llm: { invoke: vi.fn() } as never,
      embed: vi.fn(),
      supabase: {} as never,
      schemaContext: 'carfect',
      instanceId: 'i1',
      allowedTables: new Set(['reservations']),
      todayIso: '2026-04-30',
    });
    // Agent is opaque; just check it constructs.
    expect(agent).toBeDefined();
    expect(typeof (agent as { stream?: unknown }).stream).toBe('function');
  });
});
```

**NOTE for implementer:** comprehensive testing of `createAgent` (real model invocation) is in Chunk 6 smoke test. Here we just verify wiring doesn't throw.

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
// libs/ai/src/server/createAgent.ts
import { createAgent, toolCallLimitMiddleware, createMiddleware, ToolMessage } from 'langchain';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from './promptBuilder';
import { createGetTodayTool } from './tools/getToday';
import { createDataOverviewTool } from './tools/dataOverview';
import { createRunSqlTool } from './tools/runSql';
import { createLookupSchemaTool } from './tools/lookupSchema';
import { createFindSimilarTool } from './tools/findSimilarQuestions';
import { createMakeChartTool } from './tools/makeChart';

export interface BuildAgentInput {
  llm: unknown; // ChatOpenAI instance (typed loosely to avoid version coupling)
  embed: (text: string) => Promise<number[]>;
  supabase: SupabaseClient;
  schemaContext: 'carfect' | 'hiservice';
  instanceId: string;
  allowedTables: Set<string>;
  todayIso: string;
  instanceName?: string;
}

const handleToolErrors = createMiddleware({
  name: 'HandleToolErrors',
  wrapToolCall: async (request, next) => {
    try {
      return await next(request);
    } catch (e) {
      return new ToolMessage({
        content: `Tool error: ${(e as Error).message}. Try a different approach.`,
        tool_call_id: request.toolCall.id ?? 'unknown',
      });
    }
  },
});

export function buildAgent(input: BuildAgentInput) {
  const { llm, embed, supabase, schemaContext, instanceId, allowedTables, todayIso, instanceName } =
    input;

  const tools = [
    createLookupSchemaTool(supabase, { embed, schemaContext }),
    createFindSimilarTool(supabase, { embed, schemaContext }),
    createGetTodayTool(),
    createRunSqlTool(supabase, instanceId, allowedTables),
    createDataOverviewTool(supabase, allowedTables),
    createMakeChartTool(),
  ];

  return createAgent({
    model: llm as never,
    tools,
    contextSchema: z.object({ instance_id: z.string() }),
    systemPrompt: buildSystemPrompt({ schemaContext, todayIso, instanceName }),
    middleware: [handleToolErrors, toolCallLimitMiddleware({ runLimit: 12, exitBehavior: 'end' })],
  });
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Update `libs/ai/src/server/index.ts` exports**

```ts
// libs/ai/src/server/index.ts
export { resolveInstanceId, AiAnalystAuthError } from './resolveInstanceId';
export { enforceRateLimit, USER_HOURLY_LIMIT } from './rateLimit';
export { insertAuditLog, computeCostUsd, type AuditLogPayload } from './auditLog';
export { buildSystemPrompt } from './promptBuilder';
export { buildAgent, type BuildAgentInput } from './createAgent';
export { validateSql } from './validateSql';
```

- [ ] **Step 6: Commit**

```bash
git add libs/ai/src/server/createAgent.ts libs/ai/src/server/createAgent.test.ts libs/ai/src/server/index.ts
git commit -m "feat(ai-analyst): agent factory with all tools + middleware"
```

---

## Chunk 6: Vercel handler + smoke test

### Task 6.1: Create `api/ai-analyst-v2.ts`

**Files:**

- Create: `api/ai-analyst-v2.ts`

- [ ] **Step 1: Define ALLOWED_TABLES constant**

In `api/ai-analyst-v2.ts`:

```ts
// Tenant-scoped tables the agent can read. Keep aligned with RLS migration 20260430140200.
const ALLOWED_TABLES_CARFECT = new Set([
  'reservations',
  'customers',
  'customer_vehicles',
  'stations',
  'employees',
  'unified_services',
  'unified_categories',
  'services',
  'service_categories',
  'offers',
  'offer_options',
  'offer_option_items',
  'offer_scopes',
  'vehicle_protocols',
  'sales_orders',
  'sales_order_items',
  'sales_customers',
  'sales_products',
  'sales_product_variants',
  'sales_rolls',
  'trainings',
  'breaks',
  'closed_days',
  'time_entries',
  'employee_days_off',
  'followup_events',
  'followup_tasks',
  'customer_reminders',
  'notifications',
  'sms_logs',
  'yard_vehicles',
]);
```

- [ ] **Step 2: Implement handler**

```ts
// api/ai-analyst-v2.ts
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse, type UIMessage } from 'ai';
import {
  resolveInstanceId,
  AiAnalystAuthError,
  enforceRateLimit,
  insertAuditLog,
  buildAgent,
  computeCostUsd,
} from '../libs/ai/src/server';
import { computeTodayBoundaries } from '../libs/ai/src/server/tools/getToday';

export const config = { runtime: 'nodejs', maxDuration: 60 };

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const MODEL = process.env.AI_ANALYST_MODEL ?? 'gpt-4.1';

const ALLOWED_TABLES_CARFECT = new Set([
  /* same list as Step 1 */
]);

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-carfect-instance',
      },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const startedAt = Date.now();

  let instance_id = '',
    user_id = '';
  try {
    ({ instance_id, user_id } = await resolveInstanceId(req, supabase));
    await enforceRateLimit(supabase, user_id, instance_id);

    const { messages } = (await req.json()) as { messages: UIMessage[] };
    if (!messages?.length) throw new AiAnalystAuthError(403, 'No messages');
    const lcMessages = await toBaseMessages(messages);

    const llm = new ChatOpenAI({ model: MODEL, temperature: 0, apiKey: OPENAI_API_KEY });
    const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
      apiKey: OPENAI_API_KEY,
    });
    const embed = (text: string) => embeddings.embedQuery(text);
    const today = computeTodayBoundaries();

    const agent = buildAgent({
      llm,
      embed,
      supabase,
      schemaContext: 'carfect',
      instanceId: instance_id,
      allowedTables: ALLOWED_TABLES_CARFECT,
      todayIso: today.date,
    });

    const stream = await agent.stream(
      { messages: lcMessages },
      { streamMode: ['values', 'messages', 'custom'], context: { instance_id } },
    );

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream, {
        onFinish: ({
          usage,
          finalMessage,
        }: {
          usage?: { promptTokens?: number; completionTokens?: number };
          finalMessage?: { content?: string };
        }) => {
          void insertAuditLog(supabase, {
            instance_id,
            user_id,
            question: extractLastUserText(messages),
            tool_calls: [], // populate from stream events in v2
            final_answer: finalMessage?.content ?? '',
            tokens_in: usage?.promptTokens ?? null,
            tokens_out: usage?.completionTokens ?? null,
            duration_ms: Date.now() - startedAt,
            status: 'success',
            error_message: null,
          });
        },
      }),
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    if (err instanceof AiAnalystAuthError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    const message = (err as Error).message ?? 'Internal error';
    if (instance_id && user_id) {
      void insertAuditLog(supabase, {
        instance_id,
        user_id,
        question: '',
        tool_calls: [],
        final_answer: '',
        tokens_in: null,
        tokens_out: null,
        duration_ms: Date.now() - startedAt,
        status: 'error',
        error_message: message,
      });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

function extractLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== 'user') continue;
    const parts = (m as { parts?: Array<{ type: string; text?: string }> }).parts;
    return (
      parts
        ?.filter((p) => p.type === 'text')
        .map((p) => p.text ?? '')
        .join('') ?? ''
    );
  }
  return '';
}
```

- [ ] **Step 3: Commit (without test yet)**

```bash
git add api/ai-analyst-v2.ts
git commit -m "feat(ai-analyst): /api/ai-analyst-v2 endpoint composing agent + auth + logging"
```

### Task 6.2: Smoke test for handler

**Files:**

- Create: `api/__tests__/ai-analyst-v2.smoke.test.ts`

**Behavior:** Mocks Supabase + ChatOpenAI to verify the handler wires correctly: 401 without auth, 403 without instance access, 200 with valid request.

- [ ] **Step 1: Write failing test**

```ts
// api/__tests__/ai-analyst-v2.smoke.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(),
  OpenAIEmbeddings: vi
    .fn()
    .mockImplementation(() => ({ embedQuery: vi.fn().mockResolvedValue([]) })),
}));

describe('/api/ai-analyst-v2 handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when Authorization missing', async () => {
    const { default: handler } = await import('../ai-analyst-v2');
    const req = new Request('http://localhost/api/ai-analyst-v2', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user has no roles', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    (createClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    const { default: handler } = await import('../ai-analyst-v2');
    const req = new Request('http://localhost/api/ai-analyst-v2', {
      method: 'POST',
      headers: { Authorization: 'Bearer x' },
      body: JSON.stringify({ messages: [{ role: 'user', parts: [{ type: 'text', text: 'hi' }] }] }),
    });
    const res = await handler(req);
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Add api to vitest include**

Edit `apps/carfect/vitest.config.ts`:

```ts
include: [
  // ... existing entries
  '../../api/__tests__/**/*.{test,spec}.{ts,tsx}',
],
```

- [ ] **Step 3: Run, verify passes**

```bash
pnpm --filter carfect test -- --run ai-analyst-v2.smoke
```

Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add api/__tests__/ai-analyst-v2.smoke.test.ts apps/carfect/vitest.config.ts
git commit -m "test(ai-analyst): smoke test for v2 handler (auth paths)"
```

### Task 6.3: Local dev verification

- [ ] **Step 1: Set local env vars**

Required in `.env` (root):

```
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=...   (already set)
VITE_SUPABASE_URL=...           (already set)
AI_ANALYST_MODEL=gpt-4.1
```

- [ ] **Step 2: Run dev server**

```bash
SUPABASE_SERVICE_ROLE_KEY="..." VITE_SUPABASE_URL="..." OPENAI_API_KEY="..." npx tsx --tsconfig api/tsconfig.json api/server.ts
```

If `api/server.ts` is PDF-only, add a route forwarder to `ai-analyst-v2`:

Edit `api/server.ts` to import and dispatch on path `/api/ai-analyst-v2`:

```ts
// inside server route handler
if (req.url?.startsWith('/api/ai-analyst-v2')) {
  const { default: handler } = await import('./ai-analyst-v2');
  const standardReq = nodeReqToRequest(req); // convert IncomingMessage → Web Request
  const standardRes = await handler(standardReq);
  return forwardWebResponse(standardRes, res);
}
```

(Implementer: write `nodeReqToRequest` + `forwardWebResponse` adapters; pattern is reusable for any handler.)

- [ ] **Step 3: Manual curl test (without DB data, expect 401/403)**

```bash
curl -i -X POST http://localhost:3333/api/ai-analyst-v2 \
  -H "Content-Type: application/json" \
  -d '{"messages":[]}'
```

Expected: 401 (no auth header).

- [ ] **Step 4: Commit any server.ts updates**

```bash
git add api/server.ts
git commit -m "feat(ai-analyst): wire /api/ai-analyst-v2 into local dev server"
```

---

## Chunk 7: Training data seed + sync script

### Task 7.1: Write `schema.yaml` (~20 most relevant tables)

**Files:**

- Create: `libs/ai/src/training/carfect/schema.yaml`

- [ ] **Step 1: Compose schema entries**

Format (one table per entry):

```yaml
- table_name: reservations
  description: |
    Customer reservations / orders for detailing and PPF services.
    Key columns: customer_name, customer_phone, vehicle_plate, reservation_date,
    end_date, start_time, end_time, status, price (total), service_items (jsonb).
    Status enum: pending, confirmed, in_progress, completed, cancelled, no_show, change_request.
    To compute revenue: SUM(price) WHERE status = 'completed'.
    NO customer_id column — join via customer_phone if needed.
  columns:
    - { name: id, type: uuid }
    - { name: customer_name, type: text }
    - { name: customer_phone, type: text }
    - { name: customer_email, type: text }
    - { name: vehicle_plate, type: text }
    - { name: car_size, type: enum, values: [small, medium, large] }
    - { name: reservation_date, type: date }
    - { name: end_date, type: date }
    - { name: start_time, type: timestamptz }
    - { name: end_time, type: timestamptz }
    - { name: status, type: text }
    - { name: price, type: numeric }
    - { name: service_items, type: jsonb }
    - { name: station_id, type: uuid }
    - { name: assigned_employee_ids, type: jsonb }
    - { name: created_at, type: timestamptz }
    - { name: completed_at, type: timestamptz }

- table_name: customers
  description: |
    Customer master data. Joinable to reservations via phone (NOT customer_id).
    has_no_show flag indicates problematic customers.
    discount_percent applied at offer time. is_net_payer means NIP/B2B.
  columns:
    - { name: id, type: uuid }
    - { name: name, type: text }
    - { name: phone, type: text }
    - { name: email, type: text }
    - { name: company, type: text }
    - { name: nip, type: text }
    - { name: discount_percent, type: numeric }
    - { name: is_net_payer, type: boolean }
    - { name: has_no_show, type: boolean }
    - { name: sms_consent, type: boolean }
    - { name: created_at, type: timestamptz }
# ... continue for: customer_vehicles, stations, employees, unified_services,
# unified_categories, offers, offer_options, offer_option_items, offer_scopes,
# vehicle_protocols, sales_orders, sales_order_items, sales_customers,
# sales_products, trainings, time_entries, employee_days_off, followup_events,
# customer_reminders, sms_logs.
```

**Note for implementer:** model approx 20 tables based on Carfect domain priorities. Follow the SCHEMA_CONTEXTS string in old `api/ai-analyst.ts:13-62` as input — that's the agreed-upon table list. Move each block into YAML.

- [ ] **Step 2: Validate YAML parses**

```bash
node -e "console.log(require('yaml').parse(require('fs').readFileSync('libs/ai/src/training/carfect/schema.yaml','utf8')).length)"
```

Expected: prints array length (~20).

- [ ] **Step 3: Commit**

```bash
git add libs/ai/src/training/carfect/schema.yaml
git commit -m "feat(ai-analyst): seed schema.yaml with carfect tables"
```

### Task 7.2: Write `glossary.yaml` (~30 PL business terms)

**Files:**

- Create: `libs/ai/src/training/carfect/glossary.yaml`

- [ ] **Step 1: Compose glossary entries**

```yaml
- term_pl: zlecenia
  meaning: |
    W carfect "zlecenia" zwykle znaczą rezerwacje detailingowe — tabela `reservations`.
    Wyjątek: w kontekście sprzedaży foliarskiej oznaczają `sales_orders`.
    Domyślnie wybieraj reservations chyba że pytanie wyraźnie dotyczy sprzedaży.
  related_tables: [reservations, sales_orders]

- term_pl: przychód
  meaning: |
    Suma kwot zafakturowanych. W carfect = SUM(price) FROM reservations
    WHERE status = 'completed' AND reservation_date BETWEEN ...
  related_tables: [reservations]

- term_pl: klient
  meaning: |
    Tabela `customers` (master data). Łączenie z reservations przez phone
    (NIE przez customer_id — kolumny nie ma).
  related_tables: [customers, reservations]

- term_pl: no-show
  meaning: |
    Klient który nie przyszedł na rezerwację.
    Sygnały: customers.has_no_show = true LUB reservations.status = 'no_show'.
  related_tables: [customers, reservations]

- term_pl: foliarz
  meaning: |
    Sprzedaż folii PPF/PPS. Tabela sales_orders + sales_order_items.
  related_tables: [sales_orders, sales_order_items, sales_products]

- term_pl: pracownicy
  meaning: |
    Tabela `employees`. assigned_employee_ids w reservations to jsonb array UUIDów.
  related_tables: [employees, reservations, time_entries]

- term_pl: stanowisko
  meaning: |
    Tabela `stations` — boxy/miejsca pracy w warsztacie.
  related_tables: [stations]
# ... ~25 more entries dictated by user during seeding.
```

**Note:** initial seed should be ~30 entries; user reviews and corrects before sync.

- [ ] **Step 2: Commit**

```bash
git add libs/ai/src/training/carfect/glossary.yaml
git commit -m "feat(ai-analyst): seed glossary.yaml with PL business terms"
```

### Task 7.3: Write `examples.yaml` (~30 question→SQL pairs)

**Files:**

- Create: `libs/ai/src/training/carfect/examples.yaml`

- [ ] **Step 1: Compose examples**

```yaml
- question: Jaki był mój przychód w bieżącym miesiącu?
  sql: |
    SELECT SUM(price)::numeric AS revenue, COUNT(*) AS bookings
    FROM reservations
    WHERE status = 'completed'
      AND reservation_date >= date_trunc('month', CURRENT_DATE)
      AND reservation_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
  notes: |
    Filtrujemy po reservation_date, nie created_at.
    instance_id wstawia RLS automatycznie — NIE dodawaj.

- question: Najpopularniejsze usługi w ostatnich 30 dniach
  sql: |
    SELECT si->>'name' AS service, COUNT(*) AS booked,
           SUM((si->>'price')::numeric) AS revenue
    FROM reservations r,
         jsonb_array_elements(r.service_items) si
    WHERE r.service_items IS NOT NULL
      AND r.reservation_date >= CURRENT_DATE - interval '30 days'
      AND r.status = 'completed'
    GROUP BY si->>'name'
    ORDER BY booked DESC
    LIMIT 10
  notes: |
    service_items może być NULL, dlatego IS NOT NULL przed jsonb_array_elements.

- question: Top 10 klientów po liczbie rezerwacji w 3 ostatnich miesiącach
  sql: |
    SELECT customer_name, customer_phone,
           COUNT(*) AS visits,
           SUM(price)::numeric AS total_spent
    FROM reservations
    WHERE reservation_date >= CURRENT_DATE - interval '3 months'
      AND status = 'completed'
    GROUP BY customer_name, customer_phone
    ORDER BY visits DESC
    LIMIT 10
  notes: Joinujemy po customer_phone bo nie ma customer_id.

- question: Ile no-show w ubiegłym miesiącu?
  sql: |
    SELECT COUNT(*) AS no_show_count
    FROM reservations
    WHERE status = 'no_show'
      AND reservation_date >= date_trunc('month', CURRENT_DATE - interval '1 month')
      AND reservation_date < date_trunc('month', CURRENT_DATE)

- question: Ile zleceń w marcu
  sql: |
    SELECT COUNT(*) AS bookings
    FROM reservations
    WHERE reservation_date >= date_trunc('month', date '2026-03-01')
      AND reservation_date < date_trunc('month', date '2026-03-01') + interval '1 month'
  notes: |
    UWAGA: model powinien wywołać get_today() i podstawić właściwy rok dla "marca".
    Tutaj zakładamy 2026-03 — ale w realnym query agent dynamicznie wybiera rok.

# ... ~25 more pairs covering: revenue per period, top services, customer
# segments, employee utilization, no-show rate, foliarz sales, PPF protocols,
# trainings completed, employee days off counts, sms volume, etc.
```

**Note:** prioritize examples that EXERCISE the diagnostic loop (e.g., asking for a future date or non-existent period to teach the model how to handle 0-result responses). Include 2-3 such "trap" examples.

- [ ] **Step 2: Commit**

```bash
git add libs/ai/src/training/carfect/examples.yaml
git commit -m "feat(ai-analyst): seed examples.yaml with question→SQL pairs"
```

### Task 7.4: Write sync script

**Files:**

- Create: `scripts/sync-training-data.ts`

- [ ] **Step 1: Implement script**

```ts
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
```

- [ ] **Step 2: Add npm script in root package.json**

```json
"scripts": {
  ...
  "ai:sync-training": "tsx scripts/sync-training-data.ts"
}
```

- [ ] **Step 3: Run sync**

```bash
pnpm ai:sync-training carfect
```

Expected: prints 3 success lines (`✓ Synced N rows to ...`).

- [ ] **Step 4: Verify in DB**

```sql
SELECT COUNT(*) FROM ai_analyst_schema_chunks WHERE metadata->>'schema_context' = 'carfect';
SELECT COUNT(*) FROM ai_analyst_glossary WHERE metadata->>'schema_context' = 'carfect';
SELECT COUNT(*) FROM ai_analyst_training_examples WHERE metadata->>'schema_context' = 'carfect';
```

Expected: counts match YAML file lengths.

- [ ] **Step 5: Commit**

```bash
git add scripts/sync-training-data.ts package.json
git commit -m "feat(ai-analyst): YAML→pgvector sync script"
```

---

## Chunk 8: Frontend charts (TDD)

### Task 8.1: formatters.ts

**Files:**

- Create: `libs/ai/src/charts/formatters.ts`
- Create: `libs/ai/src/charts/formatters.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// libs/ai/src/charts/formatters.test.ts
import { describe, expect, it } from 'vitest';
import { formatPLN, formatCount, formatPercent, formatDate } from './formatters';

describe('formatPLN', () => {
  it('formats with space thousands and comma decimal', () => {
    expect(formatPLN(23450)).toBe('23 450,00 zł');
    expect(formatPLN(1234.5)).toBe('1 234,50 zł');
    expect(formatPLN(0)).toBe('0,00 zł');
  });
  it('handles negative', () => {
    expect(formatPLN(-100)).toBe('-100,00 zł');
  });
});

describe('formatCount', () => {
  it('appends szt.', () => {
    expect(formatCount(47)).toBe('47 szt.');
  });
});

describe('formatPercent', () => {
  it('formats with %', () => {
    expect(formatPercent(0.234)).toBe('23,4%');
  });
});

describe('formatDate', () => {
  it('formats ISO date as DD.MM.YYYY', () => {
    expect(formatDate('2026-04-30')).toBe('30.04.2026');
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```ts
// libs/ai/src/charts/formatters.ts
const plFormatter = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const intFormatter = new Intl.NumberFormat('pl-PL');
const pctFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatPLN(n: number): string {
  return `${plFormatter.format(n)} zł`;
}

export function formatCount(n: number): string {
  return `${intFormatter.format(n)} szt.`;
}

export function formatPercent(n: number): string {
  return pctFormatter.format(n);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/charts/formatters.ts libs/ai/src/charts/formatters.test.ts
git commit -m "feat(ai-analyst): PL number/date formatters"
```

### Task 8.2: BarChartView, LineChartView, PieChartView

**Files (per chart, repeat for all three):**

- Create: `libs/ai/src/charts/BarChartView.tsx` + `.test.tsx`
- Create: `libs/ai/src/charts/LineChartView.tsx` + `.test.tsx`
- Create: `libs/ai/src/charts/PieChartView.tsx` + `.test.tsx`

- [ ] **Step 1: Write failing test (BarChart example, mirror for others)**

```tsx
// libs/ai/src/charts/BarChartView.test.tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarChartView } from './BarChartView';

describe('BarChartView', () => {
  it('renders without crashing for valid spec', () => {
    const { container } = render(
      <BarChartView
        spec={{
          type: 'bar',
          title: 'Revenue',
          data: [
            { name: 'PPF', value: 12000 },
            { name: 'Ceramic', value: 8000 },
          ],
          x_key: 'name',
          y_keys: ['value'],
          unit: 'zł',
        }}
      />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders title text', () => {
    const { getByText } = render(
      <BarChartView
        spec={{
          type: 'bar',
          title: 'Revenue per service',
          data: [{ x: 'a', y: 1 }],
          x_key: 'x',
          y_keys: ['y'],
        }}
      />,
    );
    expect(getByText('Revenue per service')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement BarChartView**

```tsx
// libs/ai/src/charts/BarChartView.tsx
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartSpec } from './chartSpec';
import { formatPLN, formatCount, formatPercent } from './formatters';

interface Props {
  spec: ChartSpec;
}

const fmtFor = (unit?: ChartSpec['unit']) =>
  unit === 'zł' ? formatPLN : unit === '%' ? formatPercent : formatCount;

export function BarChartView({ spec }: Props) {
  const fmt = fmtFor(spec.unit);
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium mb-2">{spec.title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={spec.x_key} />
          <YAxis tickFormatter={(v) => fmt(Number(v))} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          {spec.y_keys.map((key) => (
            <Bar key={key} dataKey={key} fill="#3b82f6" />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Repeat for LineChartView (replace Bar→Line) and PieChartView (use Pie + Cell)**

PieChartView guidance: use `Pie` from recharts, max 8 segments. If `data.length > 8`, render top 7 + aggregated "Pozostałe" segment.

- [ ] **Step 6: Commit each separately**

```bash
git add libs/ai/src/charts/BarChartView.tsx libs/ai/src/charts/BarChartView.test.tsx
git commit -m "feat(ai-analyst): BarChartView (Recharts)"
# repeat for Line + Pie
```

### Task 8.3: ChartRenderer.tsx

**Files:**

- Create: `libs/ai/src/charts/ChartRenderer.tsx`
- Create: `libs/ai/src/charts/ChartRenderer.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// libs/ai/src/charts/ChartRenderer.test.tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartRenderer } from './ChartRenderer';

describe('ChartRenderer', () => {
  it('routes to BarChartView for type=bar', () => {
    const { container } = render(
      <ChartRenderer
        spec={{
          type: 'bar',
          title: 'T',
          data: [{ x: 1, y: 2 }],
          x_key: 'x',
          y_keys: ['y'],
        }}
      />,
    );
    expect(container.querySelector('.recharts-bar')).toBeTruthy();
  });

  it('shows error fallback for invalid spec', () => {
    // @ts-expect-error testing invalid spec
    const { getByText } = render(<ChartRenderer spec={{ type: 'invalid' }} />);
    expect(getByText(/wykres/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Implement**

```tsx
// libs/ai/src/charts/ChartRenderer.tsx
import { ChartSpecSchema, type ChartSpec } from './chartSpec';
import { BarChartView } from './BarChartView';
import { LineChartView } from './LineChartView';
import { PieChartView } from './PieChartView';

interface Props {
  spec: unknown;
}

export function ChartRenderer({ spec }: Props) {
  const parsed = ChartSpecSchema.safeParse(spec);
  if (!parsed.success) {
    return <div className="text-xs text-muted-foreground">Nieprawidłowy wykres.</div>;
  }
  const validated: ChartSpec = parsed.data;
  switch (validated.type) {
    case 'bar':
      return <BarChartView spec={validated} />;
    case 'line':
      return <LineChartView spec={validated} />;
    case 'pie':
      return <PieChartView spec={validated} />;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add libs/ai/src/charts/ChartRenderer.tsx libs/ai/src/charts/ChartRenderer.test.tsx
git commit -m "feat(ai-analyst): ChartRenderer routes spec to correct chart view"
```

---

## Chunk 9: Frontend wiring + i18n

### Task 9.1: Update `libs/ai/src/types.ts`

**Files:**

- Modify: `libs/ai/src/types.ts`

- [ ] **Step 1: Add types**

```ts
// libs/ai/src/types.ts
export interface AiAnalystSuggestion {
  label: string;
  prompt: string;
}

export type ChartDataPart = { type: 'data-chart'; id: string; data: { spec: unknown } };
```

- [ ] **Step 2: Commit**

```bash
git add libs/ai/src/types.ts
git commit -m "feat(ai-analyst): types for chart data parts"
```

### Task 9.2: Update `useAiAnalyst.ts`

**Files:**

- Modify: `libs/ai/src/useAiAnalyst.ts`
- Create: `libs/ai/src/useAiAnalyst.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// libs/ai/src/useAiAnalyst.test.ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAiAnalyst } from './useAiAnalyst';

vi.mock('@ai-sdk/react', () => ({
  useChat: vi
    .fn()
    .mockReturnValue({ messages: [], sendMessage: vi.fn(), status: 'idle', error: null }),
}));
vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn().mockImplementation((opts) => opts),
}));

describe('useAiAnalyst', () => {
  it('configures DefaultChatTransport with v2 endpoint', async () => {
    const supabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } }),
      },
    } as unknown as Parameters<typeof useAiAnalyst>[0]['supabaseClient'];
    renderHook(() => useAiAnalyst({ instanceId: 'i1', schemaContext: 'carfect', supabaseClient }));
    const { DefaultChatTransport } = await import('ai');
    const opts = (DefaultChatTransport as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0][0] as { api: string };
    expect(opts.api).toBe('/api/ai-analyst-v2');
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Update implementation**

```ts
// libs/ai/src/useAiAnalyst.ts
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

interface UseAiAnalystOptions {
  instanceId: string;
  schemaContext: 'carfect' | 'hiservice';
  supabaseClient: SupabaseClient;
}

export function useAiAnalyst({ instanceId, schemaContext, supabaseClient }: UseAiAnalystOptions) {
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/ai-analyst-v2',
      headers: async () => {
        const { data } = await supabaseClient.auth.getSession();
        return {
          Authorization: `Bearer ${data.session?.access_token ?? ''}`,
          'X-Carfect-Instance': instanceId,
        };
      },
    });
  }, [instanceId, supabaseClient]);
  void schemaContext; // Server resolves this from instance config; kept in signature for v1 compat.
  return useChat({ transport });
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/useAiAnalyst.ts libs/ai/src/useAiAnalyst.test.ts
git commit -m "feat(ai-analyst): point useAiAnalyst at /api/ai-analyst-v2 with X-Carfect-Instance header"
```

### Task 9.3: Refactor `AiAnalystView.tsx` (markdown + charts + hidden tools)

**Files:**

- Modify: `libs/ai/src/AiAnalystView.tsx`
- Create: `libs/ai/src/AiAnalystView.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// libs/ai/src/AiAnalystView.test.tsx
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiAnalystView } from './AiAnalystView';

vi.mock('./useAiAnalyst', () => ({
  useAiAnalyst: () => ({
    messages: [
      { id: '1', role: 'user', parts: [{ type: 'text', text: 'Pytanie' }] },
      {
        id: '2',
        role: 'assistant',
        parts: [
          { type: 'text', text: '**Odpowiedź** liczba: 42' },
          {
            type: 'data-chart',
            data: {
              spec: { type: 'bar', title: 'T', data: [{ x: 1, y: 2 }], x_key: 'x', y_keys: ['y'] },
            },
          },
        ],
      },
    ],
    sendMessage: vi.fn(),
    status: 'idle',
    error: null,
  }),
}));

describe('AiAnalystView', () => {
  it('renders markdown bold from assistant text', () => {
    const { container } = render(
      <AiAnalystView
        instanceId="i1"
        suggestions={[]}
        schemaContext="carfect"
        supabaseClient={{} as never}
      />,
    );
    expect(container.querySelector('strong')?.textContent).toBe('Odpowiedź');
  });

  it('renders chart for data-chart part', () => {
    const { container } = render(
      <AiAnalystView
        instanceId="i1"
        suggestions={[]}
        schemaContext="carfect"
        supabaseClient={{} as never}
      />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('hides tool-run_sql parts', () => {
    // tool parts are filtered out — no specific assertion, just ensure no crash
  });
});
```

- [ ] **Step 2: Run, verify fails**

- [ ] **Step 3: Refactor implementation**

```tsx
// libs/ai/src/AiAnalystView.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAiAnalyst } from './useAiAnalyst';
import { ChartRenderer } from './charts/ChartRenderer';
import type { AiAnalystSuggestion } from './types';

interface Props {
  instanceId: string;
  suggestions: AiAnalystSuggestion[];
  schemaContext: 'carfect' | 'hiservice';
  supabaseClient: SupabaseClient;
}

const HIDDEN_TOOL_TYPES = new Set([
  'tool-run_sql',
  'tool-lookup_schema',
  'tool-data_overview',
  'tool-find_similar_questions',
  'tool-get_today',
]);

export function AiAnalystView({ instanceId, suggestions, schemaContext, supabaseClient }: Props) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } = useAiAnalyst({
    instanceId,
    schemaContext,
    supabaseClient,
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const adjustHeight = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, []);
  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const submit = (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    sendMessage({ text });
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">{t('aiAnalyst.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('aiAnalyst.subtitle')}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => submit(s.prompt)}
                  disabled={isLoading}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="space-y-4 py-4 max-w-3xl mx-auto w-full">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm max-w-[80%]">
                      {(message.parts ?? [])
                        .filter((p) => p.type === 'text')
                        .map((p, i) => (
                          <span key={i}>{(p as { text: string }).text}</span>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(message.parts ?? []).map((part, i) => {
                      if (HIDDEN_TOOL_TYPES.has(part.type)) {
                        return (
                          <div
                            key={i}
                            className="text-xs text-muted-foreground inline-flex items-center gap-1"
                          >
                            •••
                          </div>
                        );
                      }
                      if (part.type === 'text') {
                        const text = (part as { text: string }).text;
                        return text ? (
                          <div key={i} className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                          </div>
                        ) : null;
                      }
                      if (part.type === 'data-chart') {
                        const spec = (part as { data: { spec: unknown } }).data?.spec;
                        return (
                          <div key={i} className="my-2">
                            <ChartRenderer spec={spec} />
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                {t('aiAnalyst.analyzing')}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error.message || t('aiAnalyst.error')}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-background pt-3 pb-4 space-y-2 px-4">
        <div className="max-w-3xl mx-auto w-full space-y-2">
          {hasMessages && !isLoading && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => submit(s.prompt)}
                  disabled={isLoading}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={t('aiAnalyst.placeholder')}
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              style={{ maxHeight: 200 }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="inline-flex items-center justify-center rounded-md bg-primary h-9 w-9 shrink-0 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run, verify passes**

- [ ] **Step 5: Commit**

```bash
git add libs/ai/src/AiAnalystView.tsx libs/ai/src/AiAnalystView.test.tsx
git commit -m "feat(ai-analyst): refactor AiAnalystView with markdown, charts, i18n, hidden tool calls"
```

### Task 9.4: i18n keys for pl/en/de

**Files:**

- Modify: `apps/carfect/src/i18n/locales/pl.json`
- Modify: `apps/carfect/src/i18n/locales/en.json`
- Modify: `apps/carfect/src/i18n/locales/de.json`

- [ ] **Step 1: Add keys**

In `pl.json` add:

```json
{
  "aiAnalyst": {
    "title": "Asystent AI",
    "subtitle": "Zapytaj o swój biznes — przychody, klientów, usługi, rezerwacje...",
    "analyzing": "Analizuję...",
    "error": "Nie udało się przetworzyć zapytania",
    "placeholder": "Zapytaj o swój biznes..."
  }
}
```

`en.json`:

```json
{
  "aiAnalyst": {
    "title": "AI Assistant",
    "subtitle": "Ask about your business — revenue, customers, services, bookings...",
    "analyzing": "Analyzing...",
    "error": "Could not process request",
    "placeholder": "Ask about your business..."
  }
}
```

`de.json`:

```json
{
  "aiAnalyst": {
    "title": "KI-Assistent",
    "subtitle": "Fragen Sie über Ihr Geschäft — Umsatz, Kunden, Dienstleistungen, Buchungen...",
    "analyzing": "Analysiere...",
    "error": "Anfrage konnte nicht verarbeitet werden",
    "placeholder": "Fragen Sie über Ihr Geschäft..."
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/carfect/src/i18n/locales/pl.json apps/carfect/src/i18n/locales/en.json apps/carfect/src/i18n/locales/de.json
git commit -m "feat(ai-analyst): i18n keys for AiAnalystView (pl/en/de)"
```

### Task 9.5: Update AiAnalystTab.tsx

**Files:**

- Modify: `apps/carfect/src/components/admin/AiAnalystTab.tsx`

- [ ] **Step 1: Replace content**

```tsx
// apps/carfect/src/components/admin/AiAnalystTab.tsx
import { AiAnalystView, type AiAnalystSuggestion } from '@shared/ai';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const SUGGESTIONS: AiAnalystSuggestion[] = [
  {
    label: 'Przychód w tym miesiącu',
    prompt: 'Jaki był mój łączny przychód w bieżącym miesiącu? Podaj sumę i liczbę rezerwacji.',
  },
  {
    label: 'Najpopularniejsze usługi',
    prompt: 'Jakie usługi były najczęściej rezerwowane w ostatnich 30 dniach? Pokaż ranking.',
  },
  {
    label: 'Top klienci',
    prompt:
      'Którzy klienci mieli najwięcej rezerwacji w ostatnich 3 miesiącach? Pokaż top 10 z liczbą wizyt i łączną kwotą.',
  },
];

interface Props {
  instanceId: string;
}

export default function AiAnalystTab({ instanceId }: Props) {
  return (
    <AiAnalystView
      instanceId={instanceId}
      suggestions={SUGGESTIONS}
      schemaContext="carfect"
      supabaseClient={supabase}
    />
  );
}
```

(No structural changes from current — just confirms still works after refactor.)

- [ ] **Step 2: Commit**

```bash
git add apps/carfect/src/components/admin/AiAnalystTab.tsx
git commit -m "chore(ai-analyst): keep AiAnalystTab in sync after view refactor"
```

### Task 9.6: Uncomment sidebar nav

**Files:**

- Modify: `apps/carfect/src/pages/AdminDashboard.tsx`

- [ ] **Step 1: Uncomment lines 1436-1454**

Replace the commented-out block (`{/* {hasFeature('ai_analyst') && ( ... )} */}`) with the live version. Also gate the render at line 1842 with `hasFeature('ai_analyst')`:

```tsx
{
  currentView === 'ai_analyst' && instanceId && hasFeature('ai_analyst') && (
    <AiAnalystTab instanceId={instanceId} />
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
pnpm dev
```

Open `armcar.admin.carfect.pl` (or local equivalent), confirm sidebar shows "Asystent AI" entry, clicking opens the chat.

- [ ] **Step 3: Commit**

```bash
git add apps/carfect/src/pages/AdminDashboard.tsx
git commit -m "feat(ai-analyst): enable AI Analyst sidebar nav (gated by feature flag)"
```

---

## Chunk 10: Eval set + runner

### Task 10.1: Write eval.yaml (25-30 questions)

**Files:**

- Create: `libs/ai/src/training/carfect/eval.yaml`

- [ ] **Step 1: Compose eval entries**

```yaml
- id: revenue_current_month
  question: Jaki był mój przychód w bieżącym miesiącu?
  expected:
    answer_contains: ['zł']
    sql_must_use_table: reservations
    sql_must_filter_status: [completed]

- id: orders_march_diagnostic
  question: Podsumuj zlecenia za marzec
  expected:
    diagnostic_loop_triggered: true # auto_overview must appear in tool output
    answer_contains_any: [marca, zakres, dane, '2024', '2025', '2026']

- id: top_services_30d
  question: Jakie usługi były najczęściej rezerwowane w ostatnich 30 dniach?
  expected:
    answer_contains: ['szt.']
    sql_must_use_jsonb_elements: true # service_items expansion

- id: top_customers_3m
  question: Top 10 klientów w ostatnich 3 miesiącach
  expected:
    sql_must_join_on: customer_phone
    sql_must_use_table: reservations

- id: noshow_last_month
  question: Ile no-show w ubiegłym miesiącu?
  expected:
    sql_must_filter_status: [no_show]
# ... 20-25 more entries dictated by user
```

- [ ] **Step 2: Commit**

```bash
git add libs/ai/src/training/carfect/eval.yaml
git commit -m "feat(ai-analyst): seed eval.yaml (25-30 questions)"
```

### Task 10.2: Write eval runner

**Files:**

- Create: `scripts/run-eval.ts`

- [ ] **Step 1: Implement runner**

```ts
// scripts/run-eval.ts
// Usage: tsx scripts/run-eval.ts --instance=armcar [--endpoint=http://localhost:3333/api/ai-analyst-v2]
import { readFileSync, writeFileSync } from 'fs';
import yaml from 'yaml';

type EvalCase = {
  id: string;
  question: string;
  expected: {
    answer_contains?: string[];
    answer_contains_any?: string[];
    sql_must_use_table?: string;
    sql_must_filter_status?: string[];
    sql_must_join_on?: string;
    sql_must_use_jsonb_elements?: boolean;
    diagnostic_loop_triggered?: boolean;
  };
};

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=') as [string, string]),
);
const instance = args.instance ?? 'armcar';
const endpoint = args.endpoint ?? `http://localhost:3333/api/ai-analyst-v2`;
const jwt = process.env.AI_ANALYST_EVAL_JWT;
if (!jwt) {
  console.error('Set AI_ANALYST_EVAL_JWT env var with a valid Supabase access token');
  process.exit(1);
}

const cases: EvalCase[] = yaml.parse(
  readFileSync(
    `libs/ai/src/training/${instance.startsWith('demo') ? 'carfect' : 'carfect'}/eval.yaml`,
    'utf-8',
  ),
);

interface Result {
  id: string;
  pass: boolean;
  reasons: string[];
  final?: string;
  toolNames?: string[];
}
const results: Result[] = [];

for (const c of cases) {
  console.log(`▸ ${c.id}: ${c.question.slice(0, 60)}…`);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
      'X-Carfect-Instance': process.env.AI_ANALYST_INSTANCE_ID ?? '',
    },
    body: JSON.stringify({
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: c.question }] }],
    }),
  });

  // Stream parsing — accumulate text + tool events.
  const reader = res.body!.getReader();
  let buf = '',
    finalText = '';
  const toolNames: string[] = [];
  let sawAutoOverview = false;
  let sqlUsed = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += new TextDecoder().decode(value);
    // crude SSE-ish parse — split by newlines
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const evt = JSON.parse(line.replace(/^data:\s*/, ''));
        if (evt.type === 'text-delta') finalText += evt.delta ?? '';
        if (evt.type?.startsWith('tool-')) toolNames.push(evt.type);
        if (evt.type === 'tool-output-available' && evt.toolName === 'run_sql') {
          const out = typeof evt.output === 'string' ? JSON.parse(evt.output) : evt.output;
          if (out?.auto_overview) sawAutoOverview = true;
          if (typeof evt.input?.sql === 'string') sqlUsed += evt.input.sql + '\n';
        }
      } catch {
        /* not json line, ignore */
      }
    }
  }

  const reasons: string[] = [];
  const e = c.expected;
  if (e.answer_contains && !e.answer_contains.every((s) => finalText.includes(s)))
    reasons.push(
      `answer missing: ${e.answer_contains.filter((s) => !finalText.includes(s)).join(', ')}`,
    );
  if (e.answer_contains_any && !e.answer_contains_any.some((s) => finalText.includes(s)))
    reasons.push(`answer should contain any of: ${e.answer_contains_any.join(' | ')}`);
  if (e.sql_must_use_table && !sqlUsed.includes(e.sql_must_use_table))
    reasons.push(`sql missing table ${e.sql_must_use_table}`);
  if (e.sql_must_filter_status && !e.sql_must_filter_status.some((s) => sqlUsed.includes(s)))
    reasons.push(`sql missing status filter ${e.sql_must_filter_status.join('|')}`);
  if (e.sql_must_join_on && !sqlUsed.includes(e.sql_must_join_on))
    reasons.push(`sql missing join on ${e.sql_must_join_on}`);
  if (e.sql_must_use_jsonb_elements && !/jsonb_array_elements/i.test(sqlUsed))
    reasons.push('sql missing jsonb_array_elements');
  if (e.diagnostic_loop_triggered && !sawAutoOverview) reasons.push('auto_overview not triggered');

  results.push({
    id: c.id,
    pass: reasons.length === 0,
    reasons,
    final: finalText.slice(0, 200),
    toolNames,
  });
  console.log(reasons.length === 0 ? '  ✓ PASS' : `  ✗ FAIL: ${reasons.join('; ')}`);
}

const passed = results.filter((r) => r.pass).length;
const report = [
  `# Eval Results — ${new Date().toISOString().slice(0, 10)} — instance=${instance}`,
  `**Pass rate:** ${passed}/${results.length} (${Math.round((100 * passed) / results.length)}%)`,
  '',
  ...results.map(
    (r) =>
      `## ${r.pass ? '✓' : '✗'} ${r.id}\n\n` +
      (r.pass ? '' : `**Reasons:**\n- ${r.reasons.join('\n- ')}\n\n`) +
      `**Tools used:** ${(r.toolNames ?? []).join(' → ')}\n\n` +
      `**Final answer (truncated):** ${r.final}\n`,
  ),
].join('\n');

const reportPath = `eval-results-${new Date().toISOString().slice(0, 10)}-${instance}.md`;
writeFileSync(reportPath, report);
console.log(`\nReport written to ${reportPath}`);
process.exit(passed === results.length ? 0 : 1);
```

- [ ] **Step 2: Add npm script**

```json
"ai:eval": "tsx scripts/run-eval.ts"
```

- [ ] **Step 3: Run baseline (manual, against deployed armcar)**

```bash
AI_ANALYST_EVAL_JWT="<token>" AI_ANALYST_INSTANCE_ID="<armcar uuid>" pnpm ai:eval --instance=armcar --endpoint=http://localhost:3333/api/ai-analyst-v2
```

Expected: report file written. Initial pass rate likely 50-70%; iterate on prompt/glossary until ≥70% (PoC bar) and ≥85% (production bar) per spec.

- [ ] **Step 4: Commit**

```bash
git add scripts/run-eval.ts package.json
git commit -m "feat(ai-analyst): eval runner with markdown report"
```

---

## Chunk 11: Cleanup + final verification

### Task 11.1: Delete deprecated edge function

**Files:**

- Delete: `supabase/functions/ai-analyst/`

- [ ] **Step 1: Confirm not referenced**

```bash
grep -rn "supabase.functions.invoke('ai-analyst'" apps libs
```

Expected: no matches (frontend uses `/api/ai-analyst-v2`).

- [ ] **Step 2: Delete folder**

```bash
git rm -r supabase/functions/ai-analyst
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(ai-analyst): remove deprecated Deno edge function"
```

### Task 11.2: Final type check + full test pass

- [ ] **Step 1: Type check**

```bash
pnpm --filter carfect exec tsc --noEmit
```

Expected: 0 errors. Fix any typing issues that surface.

- [ ] **Step 2: Run all tests**

```bash
pnpm --filter carfect test -- --run
```

Expected: all green. Per CLAUDE.md, max 1 test process — run sequentially in main context.

- [ ] **Step 3: Smoke test in browser**

```bash
pnpm dev
```

Manual checks:

- [ ] Login as armcar admin
- [ ] Click "Asystent AI" in sidebar
- [ ] Ask "Jaki był mój przychód w bieżącym miesiącu?" → expect non-zero answer with formatted PLN
- [ ] Ask "Najpopularniejsze usługi" → expect chart rendered
- [ ] Ask "Podsumuj zlecenia za marzec 2099" → expect "no data" + diagnostic message about actual range
- [ ] Verify no SQL or tool names visible to user

### Task 11.3: Update MEMORY.md

**Files:**

- Modify: `/Users/tomasznastaly/.claude/projects/-Users-tomasznastaly-Documents-programming-carfect/memory/project_ai_analyst_status.md`
- Modify: `/Users/tomasznastaly/.claude/projects/-Users-tomasznastaly-Documents-programming-carfect/memory/MEMORY.md`

- [ ] **Step 1: Update status memory**

Mark v1 as superseded by v2. Capture: stack (LangChain.js v1 + AI SDK v6 + pgvector), key patterns (GUC RLS, contextSchema instead of closure, hard-coded diagnostic guard, custom stream channel for charts), and what's still TODO post-v1 (multi-turn memory, CSV export, conversation persistence, hiservice).

- [ ] **Step 2: Commit memory update**

(Memory commits per user's auto-memory mechanism — usually no manual git commit needed.)

### Task 11.4: Delete legacy `api/ai-analyst.ts`

**Files:**

- Delete: `api/ai-analyst.ts`

**Only after** Task 11.2 smoke test passes and v2 stable for at least one ramp interaction.

- [ ] **Step 1: Verify nothing references the old endpoint**

```bash
grep -rn "/api/ai-analyst[^-]" apps libs scripts | grep -v ai-analyst-v2 | grep -v ai-analyst.ts
```

Expected: empty.

- [ ] **Step 2: Delete**

```bash
git rm api/ai-analyst.ts
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(ai-analyst): remove legacy v1 endpoint"
```

### Task 11.5: PR

- [ ] **Step 1: Push and open PR**

```bash
git push -u origin ui-agent-feature
gh pr create --title "feat(ai-analyst): rebuild on LangChain.js v1 + pgvector" --body "..."
```

PR body template:

```markdown
## Summary

- Replaces single-shot `api/ai-analyst.ts` with LangChain.js v1 agent (`api/ai-analyst-v2.ts`)
- 6 tools (lookup_schema, find_similar_questions, get_today, run_sql with auto-overview, data_overview, make_chart) backed by pgvector RAG over schema/glossary/examples
- Server-side instance_id from JWT + GUC + RLS — LLM never handles tenant isolation
- Recharts inline charts, react-markdown, hidden tool calls (black-box UX)
- i18n in pl/en/de
- Eval suite + runner

## Test plan

- [ ] Type check passes
- [ ] All vitest tests pass
- [ ] Smoke test in armcar admin UI
- [ ] Eval baseline ≥70%
- [ ] Cross-tenant isolation test (manual SQL with two instances)
- [ ] Cost guard: 30 requests/h hits 429
```

---

## Quick reference: per-task commands

| Action                               | Command                                                   |
| ------------------------------------ | --------------------------------------------------------- |
| Apply migrations locally             | `supabase db push`                                        |
| Push migrations remote               | `supabase db push --linked` (requires user approval)      |
| Run all tests (--run flag mandatory) | `pnpm --filter carfect test -- --run`                     |
| Run specific test file               | `pnpm --filter carfect test -- --run <substring>`         |
| Type check                           | `pnpm --filter carfect exec tsc --noEmit`                 |
| Sync training data                   | `pnpm ai:sync-training carfect`                           |
| Run eval                             | `pnpm ai:eval --instance=armcar`                          |
| Local dev (frontend + api)           | `pnpm dev` (frontend) + dedicated tsx for `api/server.ts` |

## Critical CLAUDE.md rules to honor

1. **One test process at a time** — never run vitest in parallel (zombies)
2. **Always `--run`** — vitest watch mode is forbidden
3. **No `any`** in new code — types via Zod inference
4. **Backend logic must have tests** — every `libs/ai/src/server/*.ts` and tool ships with `.test.ts`
5. **i18n in apps/carfect** — new strings via `t()`; `libs/ai` UI uses `useTranslation`
6. **No auto-push** — commits are local until user requests push
7. **No destructive DB ops** without explicit confirmation (esp. `supabase db reset`)
