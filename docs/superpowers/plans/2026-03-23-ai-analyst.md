# AI Business Analyst Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a natural language business analytics interface to Carfect admin, powered by OpenAI via a shared library reusable by HiService.

**Architecture:** Shared lib `@shared/ai` provides types, hook, and UI component. Supabase edge function `ai-analyst` receives user prompt, generates SQL via OpenAI GPT-4o-mini, executes read-only query scoped to instance_id, formats results via second OpenAI call, returns text + optional table. Gated by `ai_analyst` feature flag.

**Tech Stack:** React 19, TypeScript, TanStack Query, shadcn/ui, Supabase Edge Functions (Deno), OpenAI API

---

## File Structure

### New files

```
libs/ai/
  package.json                          — @shared/ai package definition
  src/
    index.ts                            — barrel exports
    types.ts                            — AiAnalystRequest, AiAnalystResponse, AiAnalystSuggestion
    useAiAnalyst.ts                     — hook: POST to edge function, manage loading/error/history
    AiAnalystView.tsx                   — full UI: input, suggestions, response list, table

supabase/functions/ai-analyst/
  index.ts                              — edge function: prompt → OpenAI → SQL → execute → format

apps/carfect/src/components/admin/
  AiAnalystTab.tsx                      — Carfect-specific wrapper with suggestions + schemaContext
```

### Modified files

```
apps/carfect/vite.config.ts             — add @shared/ai alias
apps/carfect/tsconfig.json              — add @shared/ai path
apps/carfect/tsconfig.app.json          — add @shared/ai path
apps/carfect/src/pages/AdminDashboard.tsx — add 'ai_analyst' to ViewType, sidebar button, render tab
```

---

## Task 1: Create `@shared/ai` library — types and package

**Files:**
- Create: `libs/ai/package.json`
- Create: `libs/ai/src/types.ts`
- Create: `libs/ai/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@shared/ai",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  }
}
```

- [ ] **Step 2: Create types.ts**

```ts
export interface AiAnalystSuggestion {
  label: string;
  prompt: string;
}

export interface AiAnalystRequest {
  prompt: string;
  instanceId: string;
  schemaContext: 'carfect' | 'hiservice';
}

export interface AiAnalystResponse {
  answer: string;
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface AiAnalystHistoryEntry {
  id: string;
  prompt: string;
  response: AiAnalystResponse | null;
  loading: boolean;
  error?: string;
}
```

- [ ] **Step 3: Create barrel export index.ts**

```ts
export * from './types';
export { useAiAnalyst } from './useAiAnalyst';
export { AiAnalystView } from './AiAnalystView';
```

Note: useAiAnalyst and AiAnalystView don't exist yet — they'll be created in Tasks 2 and 3.

- [ ] **Step 4: Commit**

```bash
git add libs/ai/
git commit -m "feat(shared-ai): create @shared/ai library with types"
```

---

## Task 2: Add `@shared/ai` aliases to Carfect app

**Files:**
- Modify: `apps/carfect/vite.config.ts`
- Modify: `apps/carfect/tsconfig.json`
- Modify: `apps/carfect/tsconfig.app.json`

- [ ] **Step 1: Add Vite alias**

In `apps/carfect/vite.config.ts`, add to the `resolve.alias` array:

```ts
{ find: '@shared/ai', replacement: resolve(__dirname, '../../libs/ai/src/index.ts') },
```

- [ ] **Step 2: Add tsconfig.json path**

In `apps/carfect/tsconfig.json` `compilerOptions.paths`, add:

```json
"@shared/ai": ["../../libs/ai/src/index.ts"],
"@shared/ai/*": ["../../libs/ai/src/*"]
```

- [ ] **Step 3: Add tsconfig.app.json path**

Same paths in `apps/carfect/tsconfig.app.json` if it has its own paths section. If it extends tsconfig.json paths, skip this step.

- [ ] **Step 4: Verify** — `pnpm --filter carfect build` should not error on the new alias (no imports yet, but alias should resolve).

- [ ] **Step 5: Commit**

```bash
git add apps/carfect/vite.config.ts apps/carfect/tsconfig.json apps/carfect/tsconfig.app.json
git commit -m "chore: add @shared/ai alias to Carfect app"
```

---

## Task 3: Create `useAiAnalyst` hook

**Files:**
- Create: `libs/ai/src/useAiAnalyst.ts`

- [ ] **Step 1: Implement hook**

```ts
import { useState, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AiAnalystResponse, AiAnalystHistoryEntry } from './types';

interface UseAiAnalystOptions {
  instanceId: string;
  schemaContext: 'carfect' | 'hiservice';
  supabaseClient: SupabaseClient;
}

export function useAiAnalyst({ instanceId, schemaContext, supabaseClient }: UseAiAnalystOptions) {
  const [history, setHistory] = useState<AiAnalystHistoryEntry[]>([]);

  const ask = useCallback(
    async (prompt: string) => {
      const entryId = crypto.randomUUID();
      const entry: AiAnalystHistoryEntry = {
        id: entryId,
        prompt,
        response: null,
        loading: true,
      };

      setHistory((prev) => [...prev, entry]);

      try {
        const { data, error } = await supabaseClient.functions.invoke('ai-analyst', {
          body: { prompt, instanceId, schemaContext },
        });

        if (error) throw error;

        setHistory((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, loading: false, response: data as AiAnalystResponse } : e,
          ),
        );
      } catch (err: any) {
        setHistory((prev) =>
          prev.map((e) =>
            e.id === entryId
              ? { ...e, loading: false, error: err?.message || 'Nie udało się przetworzyć zapytania' }
              : e,
          ),
        );
      }
    },
    [instanceId, schemaContext, supabaseClient],
  );

  const clear = useCallback(() => setHistory([]), []);

  return { history, ask, clear };
}
```

- [ ] **Step 2: Commit**

```bash
git add libs/ai/src/useAiAnalyst.ts
git commit -m "feat(shared-ai): add useAiAnalyst hook"
```

---

## Task 4: Create `AiAnalystView` component

**Files:**
- Create: `libs/ai/src/AiAnalystView.tsx`

- [ ] **Step 1: Implement component**

```tsx
import { useState, useRef, useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAiAnalyst } from './useAiAnalyst';
import type { AiAnalystSuggestion } from './types';

interface AiAnalystViewProps {
  instanceId: string;
  suggestions: AiAnalystSuggestion[];
  schemaContext: 'carfect' | 'hiservice';
  supabaseClient: SupabaseClient;
}

export function AiAnalystView({
  instanceId,
  suggestions,
  schemaContext,
  supabaseClient,
}: AiAnalystViewProps) {
  const [input, setInput] = useState('');
  const { history, ask } = useAiAnalyst({ instanceId, schemaContext, supabaseClient });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text) return;
    setInput('');
    ask(text);
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <h2 className="text-xl font-semibold">Asystent AI</h2>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Zapytaj o swój biznes..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Wyślij
        </button>
      </form>

      {/* Suggestions — show when no history */}
      {history.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleSubmit(s.prompt)}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* History */}
      <div className="space-y-6">
        {history.map((entry) => (
          <div key={entry.id} className="space-y-3">
            {/* User prompt */}
            <div className="flex justify-end">
              <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm max-w-[80%]">
                {entry.prompt}
              </div>
            </div>

            {/* Response */}
            {entry.loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Analizuję...
              </div>
            ) : entry.error ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {entry.error}
              </div>
            ) : entry.response ? (
              <div className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{entry.response.answer}</p>
                {entry.response.table && (
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {entry.response.table.headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {entry.response.table.rows.map((row, ri) => (
                          <tr key={ri} className="border-b last:border-0">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-2">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — show after queries too */}
      {history.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleSubmit(s.prompt)}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add libs/ai/src/AiAnalystView.tsx
git commit -m "feat(shared-ai): add AiAnalystView component"
```

---

## Task 5: Create `ai-analyst` edge function

**Files:**
- Create: `supabase/functions/ai-analyst/index.ts`

- [ ] **Step 1: Implement edge function**

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SCHEMA_CONTEXTS: Record<string, string> = {
  carfect: `Available PostgreSQL tables (all have instance_id column for tenant isolation):

- reservations: id, instance_id, customer_name, customer_phone, service_items (jsonb array of {name, price}), start_time (timestamptz), end_time (timestamptz), status (text: confirmed/completed/cancelled/no_show), total_price (numeric), created_at, station_id
- customers: id, instance_id, name, phone, email, car_model_id (uuid FK to car_models), source (text), created_at
- unified_services: id, instance_id, name, category_id (uuid FK to unified_categories), base_price (numeric), service_type (text), active (boolean), deleted_at
- unified_categories: id, instance_id, name, slug, category_type (text), active (boolean), sort_order (int)
- offers: id, instance_id, offer_number (text), status (text: draft/sent/viewed/approved/rejected), total_price (numeric), customer_data (jsonb with name, phone, email), created_at, sent_at, approved_at
- stations: id, instance_id, name, station_type (text)
- sales_orders: id, instance_id, status (text), total_amount (numeric), customer_id (uuid FK), created_at
- sales_customers: id, instance_id, name, phone, email, nip (text)

Important:
- Always filter by instance_id = $INSTANCE_ID
- Dates are timestamptz — use date_trunc, extract, etc.
- total_price and base_price are numeric, format as Polish currency
- service_items is a jsonb array, use jsonb_array_elements to extract items`,
};

function validateSql(sql: string): string | null {
  const trimmed = sql.trim().replace(/;$/, '').trim();
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith('SELECT')) return 'Query must start with SELECT';
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE'];
  for (const word of forbidden) {
    // Match as whole word to avoid false positives like "UPDATED_AT"
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(trimmed) && word !== 'CREATE') return `Forbidden keyword: ${word}`;
    // Allow CREATE only inside subqueries like "created_at" — check if it's standalone
    if (word === 'CREATE' && /\bCREATE\s+(TABLE|INDEX|VIEW|FUNCTION)/i.test(trimmed)) {
      return `Forbidden keyword: ${word}`;
    }
  }
  return null;
}

async function callOpenAI(messages: Array<{ role: string; content: string }>, jsonMode = false) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, instanceId, schemaContext } = await req.json();

    if (!prompt || !instanceId || !schemaContext) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has access to this instance
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('instance_id', instanceId);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'No access to this instance' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const schemaDesc = SCHEMA_CONTEXTS[schemaContext];
    if (!schemaDesc) {
      return new Response(JSON.stringify({ error: `Unknown schema context: ${schemaContext}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Generate SQL
    const sqlPrompt = `You are a PostgreSQL analyst. Generate a single SELECT query to answer the user's question.

${schemaDesc}

Rules:
- Output ONLY the raw SQL query, nothing else. No markdown, no explanation.
- ALWAYS include WHERE instance_id = '${instanceId}'
- Use Polish locale awareness (e.g., months: styczeń, luty, marzec...)
- Current date: ${new Date().toISOString().split('T')[0]}
- Limit results to 50 rows max
- For aggregations, use meaningful aliases in Polish

User question: ${prompt}`;

    const sqlRaw = await callOpenAI([{ role: 'user', content: sqlPrompt }]);
    const sql = sqlRaw.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();

    // Validate SQL
    const validationError = validateSql(sql);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: `Wygenerowane zapytanie jest nieprawidłowe: ${validationError}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 2: Execute SQL
    const { data: queryResult, error: queryError } = await supabase.rpc('execute_readonly_query', {
      query_text: sql,
    });

    if (queryError) {
      console.error('SQL execution error:', queryError, 'SQL:', sql);
      return new Response(
        JSON.stringify({ error: 'Nie udało się wykonać zapytania. Spróbuj inaczej sformułować pytanie.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 3: Format response
    const formatPrompt = `You are a business analyst assistant. The user asked a question about their business and here are the SQL results.

User question: ${prompt}

SQL results (JSON):
${JSON.stringify(queryResult, null, 2)}

Respond in Polish. Return a JSON object with this structure:
{
  "answer": "Human-readable summary of the results in Polish. Use numbers, percentages, comparisons where relevant. Format currency as X XXX,XX zł.",
  "table": {
    "headers": ["Column 1", "Column 2"],
    "rows": [["val1", "val2"]]
  }
}

Rules:
- "answer" is required — always provide a text summary
- "table" is optional — include ONLY if the data has multiple rows that benefit from tabular display
- For single values (totals, counts), just put them in "answer" without a table
- Format numbers with Polish locale (space as thousands separator, comma for decimals)
- Keep answer concise — 2-3 sentences max`;

    const formatRaw = await callOpenAI(
      [{ role: 'user', content: formatPrompt }],
      true, // JSON mode
    );

    const formatted = JSON.parse(formatRaw);

    return new Response(JSON.stringify(formatted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('AI Analyst error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/ai-analyst/
git commit -m "feat: add ai-analyst edge function with OpenAI integration"
```

---

## Task 6: Create `execute_readonly_query` SQL function

The edge function needs a way to execute dynamic SQL. Create a Postgres function that only allows SELECT.

**Files:**
- Create: `supabase/migrations/20260323120000_execute_readonly_query.sql`

- [ ] **Step 1: Create migration**

```sql
CREATE OR REPLACE FUNCTION execute_readonly_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '10s'
AS $$
DECLARE
  result jsonb;
  trimmed text;
BEGIN
  trimmed := btrim(query_text);

  -- Only allow SELECT statements
  IF upper(left(trimmed, 6)) != 'SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Execute and return as JSON array
  EXECUTE 'SELECT coalesce(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || trimmed || ') t'
  INTO result;

  RETURN result;
END;
$$;
```

- [ ] **Step 2: Apply migration**

Run: `supabase db push`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260323120000_execute_readonly_query.sql
git commit -m "feat: add execute_readonly_query SQL function for AI analyst"
```

---

## Task 7: Set OpenAI API key as Supabase secret

- [ ] **Step 1: Set secret**

Run: `supabase secrets set OPENAI_API_KEY=<your-openai-api-key>`

- [ ] **Step 2: Verify**

Run: `supabase secrets list` — should show OPENAI_API_KEY in the list.

---

## Task 8: Create Carfect `AiAnalystTab` wrapper

**Files:**
- Create: `apps/carfect/src/components/admin/AiAnalystTab.tsx`

- [ ] **Step 1: Implement**

```tsx
import { AiAnalystView, type AiAnalystSuggestion } from '@shared/ai';
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

interface AiAnalystTabProps {
  instanceId: string;
}

const AiAnalystTab = ({ instanceId }: AiAnalystTabProps) => {
  return (
    <AiAnalystView
      instanceId={instanceId}
      suggestions={SUGGESTIONS}
      schemaContext="carfect"
      supabaseClient={supabase}
    />
  );
};

export default AiAnalystTab;
```

- [ ] **Step 2: Commit**

```bash
git add apps/carfect/src/components/admin/AiAnalystTab.tsx
git commit -m "feat(carfect): add AiAnalystTab with Carfect-specific suggestions"
```

---

## Task 9: Wire into AdminDashboard

**Files:**
- Modify: `apps/carfect/src/pages/AdminDashboard.tsx`

- [ ] **Step 1: Add 'ai_analyst' to ViewType**

Find `type ViewType =` and add `'ai_analyst'` to the union. Also add to `validViews` array.

- [ ] **Step 2: Add lazy import**

Near other lazy imports at top of file:

```ts
const AiAnalystTab = lazy(() => import('@/components/admin/AiAnalystTab'));
```

- [ ] **Step 3: Add sidebar button**

Find the sidebar nav section where other feature-flagged buttons are (near `hasFeature('offers')`). Add:

```tsx
{hasFeature('ai_analyst') && (
  <button
    onClick={() => setCurrentView('ai_analyst')}
    className={cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-sidebar-accent',
      currentView === 'ai_analyst' && 'bg-sidebar-accent text-sidebar-accent-foreground',
    )}
  >
    <Sparkles className="h-4 w-4" />
    {!sidebarCollapsed && 'Asystent AI'}
  </button>
)}
```

Import `Sparkles` from `lucide-react` at the top.

- [ ] **Step 4: Add view render**

Find the content area where views are conditionally rendered (`{currentView === 'calendar' && ...}`). Add:

```tsx
{currentView === 'ai_analyst' && (
  <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
    <AiAnalystTab instanceId={instanceId} />
  </Suspense>
)}
```

- [ ] **Step 5: Verify build**

Run: `pnpm --filter carfect build`

- [ ] **Step 6: Commit**

```bash
git add apps/carfect/src/pages/AdminDashboard.tsx
git commit -m "feat(carfect): wire AI Analyst tab into AdminDashboard behind feature flag"
```

---

## Task 10: Enable feature flag and test end-to-end

- [ ] **Step 1: Enable feature flag for test instance**

```sql
INSERT INTO instance_features (instance_id, feature_key, enabled)
SELECT id, 'ai_analyst', true FROM instances WHERE slug = 'armcar';
```

- [ ] **Step 2: Manual E2E test**

1. Navigate to admin panel
2. Verify "Asystent AI" appears in sidebar
3. Click it — verify input + 3 suggestion pills render
4. Click "Przychód w tym miesiącu" pill
5. Verify loading spinner appears
6. Verify response renders with text (and optionally table)
7. Try a custom prompt: "Ile rezerwacji miałem wczoraj?"
8. Verify history shows both Q&A pairs

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(carfect): AI Business Analyst — complete MVP"
```

---

## Dependency Order

```
Task 1 (types) → Task 2 (aliases) → Task 3 (hook) → Task 4 (component)
                                                              ↓
Task 6 (SQL function) → Task 7 (API key) → Task 5 (edge function)
                                                              ↓
                              Task 8 (Carfect tab) → Task 9 (AdminDashboard) → Task 10 (test)
```

Tasks 1-4 and Tasks 5-7 can be done in parallel.
