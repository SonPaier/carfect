# AI Analyst v2 — Rebuild Design Spec

## Cel

Zastąpienie obecnego AI Analysta (`api/ai-analyst.ts` + `libs/ai/`) nowym agentem opartym o **LangChain.js + pgvector** w Supabase. Agent ma rzetelnie analizować dane biznesowe carfect (rezerwacje, klienci, sprzedaż, oferty) odpowiadając na pytania w języku polskim, bez halucynowania liczb i bez gubienia się przy 0-result queries.

## Problem (obecne symptomy)

- Pytanie "podsumuj zlecenia za marzec" zwraca pustkę — agent wybiera złą tabelę albo zły zakres dat
- Wymyśla liczby zamiast zwracać "brak danych w tym zakresie"
- Cały schema (60+ tabel) wepchnięty w system prompt → uwaga modelu rozproszona
- `gpt-4.1-mini` zbyt słaby na multi-step SQL reasoning
- Brak diagnostic loopa: gdy SQL zwróci 0 wierszy, agent nie próbuje sprawdzić zakresu dat ani alternatywnych predykatów
- Brak przykładów (few-shot) — agent generuje SQL od zera

## Decyzje architektoniczne

| Decyzja               | Wybór                                                                |
| --------------------- | -------------------------------------------------------------------- |
| Stack                 | LangChain.js (Node/TS, zostajemy w stacku)                           |
| Vector store          | pgvector w naszej Supabase (nie ChromaDB, nie Pinecone)              |
| Model                 | `gpt-4.1` (env-overridable)                                          |
| Provider              | OpenAI                                                               |
| Lib                   | rozbudowa istniejącego `libs/ai/` (`@shared/ai`)                     |
| Scope v1              | tylko carfect (admin + super admin), hiservice odłożone              |
| UI trust              | black box — czysta odpowiedź + wykresy, **bez** SQL/reasoning panelu |
| Wykresy               | Recharts (już w stacku)                                              |
| Storage training data | YAML w repo (`libs/ai/src/training/carfect/`)                        |
| Glossary              | ja generuję seed, user review-uje                                    |
| Eval set              | user dostarczy pytania, ja zbuduję runner                            |

### Odrzucone alternatywy

- **Vanna 2.0 OSS** — repo zarchiwizowane 29.03.2026, brak fix-ów i wsparcia nowych modeli
- **Wren AI** — over-engineered (semantic layer, Docker stack) na nasz scope
- **Vanna Premium** — vendor lock-in, recurring cost, dane idą przez ich serwis
- **Python (Vanna self-hosted)** — drugi runtime/deploy bez wyraźnego ROI

## Architektura

```
┌─────────────────────────────────────────────────────┐
│  Frontend (apps/carfect)                            │
│  AdminDashboard → AiAnalystTab → @shared/ai         │
│  - useAiAnalyst (useChat, AI SDK v6)                │
│  - AiAnalystView (chat UI + Recharts renderer)      │
└────────────────┬────────────────────────────────────┘
                 │ POST /api/ai-analyst-v2
                 │ Authorization: Bearer <jwt>
                 │ X-Carfect-Instance: <uuid hint>
                 │ body: { messages }   ← BEZ instanceId
                 ▼
┌─────────────────────────────────────────────────────┐
│  Vercel Serverless (Node) — api/ai-analyst-v2.ts    │
│  1. verify JWT → user                                │
│  2. resolve instance_id (token → user_roles)         │
│  3. enforce rate limit (30/h per user)               │
│  4. spawn LangChain agent                            │
│  5. stream UIMessage chunks back                     │
│  6. log to ai_analyst_logs                           │
└────────────────┬────────────────────────────────────┘
                 │
       ┌─────────┴──────────┐
       ▼                    ▼
┌──────────────┐    ┌──────────────────┐
│ OpenAI       │    │ Supabase Postgres│
│ gpt-4.1      │    │ - tables (RLS)   │
└──────────────┘    │ - pgvector index │
                    │ - execute_       │
                    │   readonly_query │
                    │   (sets GUC)     │
                    │ - audit logs     │
                    └──────────────────┘
```

### Lifecycle pojedynczego pytania

1. User wpisuje "podsumuj zlecenia za marzec"
2. Frontend POST z `messages`, **bez** `instanceId`. Wysyła nagłówek `X-Carfect-Instance: <uuid>` (preferowany instance — z aktualnego kontekstu admin panelu)
3. Backend weryfikuje JWT (`supabase.auth.getUser`), czyta `user_roles` → ustala `instance_id`:
   - jeśli user ma 1 rolę → ten instance
   - jeśli > 1 → musi pasować do `X-Carfect-Instance` (i być na liście)
4. Rate limit check (`ai_analyst_logs` — 30 requests/h per user)
5. Agent dostaje system prompt (skompresowany, **bez** dump-u 60 tabel) + tools
6. Agent: `lookup_schema(["zlecenia", "marzec"])` → DDL `reservations`, `sales_orders`, glossary "zlecenia → reservations"
7. Agent: `find_similar_questions("podsumuj zlecenia za marzec")` → top 3-5 par
8. Agent: `get_today()` → deterministyczne granice dat
9. Agent: `run_sql(...)` — bez `WHERE instance_id`, RLS robi resztę
10. Jeśli 0 wierszy → automatyczne `data_overview('reservations', 'reservation_date')` (instrukcja w system prompcie)
11. Jeśli wynik nadaje się na wykres → `make_chart({type, data, ...})`
12. Frontend streamuje tekst, na końcu renderuje wykres

## Tooling agenta

Sześć narzędzi, każde z jasną odpowiedzialnością. Wszystkie z Zod schemami.

### `lookup_schema`

- **Input**: `{ terms: string[] }`
- **Output**: `{ tables: Array<{name, columns, description}>, glossary: Array<{term_pl, meaning, related_tables}> }`
- Embed `terms.join(' ')` przez `text-embedding-3-small` → top-K=8 z `ai_analyst_schema_chunks` + `ai_analyst_glossary`

### `find_similar_questions`

- **Input**: `{ question: string }`
- **Output**: `{ examples: Array<{question_pl, sql, notes?}> }` (top 3-5)
- Few-shot serwowany on-demand przez RAG nad `ai_analyst_training_examples`

### `get_today`

- **Input**: `{}`
- **Output**: `{ date, weekday, week_start, month_start, prev_month_start, prev_month_end, quarter_start, year_start }`
- Deterministyczne date helpers — eliminuje błędy typu "marzec → 2025 czy 2026?"

### `run_sql`

- **Input**: `{ sql: string, intent: string }`
- **Output**: `{ rows, row_count, truncated, warning?, execution_ms }`
- Wewnętrznie: `execute_readonly_query(sql, instance_id)` RPC
- Walidator: tylko SELECT, bez `;`, bez DDL keywords, brak walidacji `instance_id` (RLS)
- LIMIT 50 wstrzykiwany jeśli brak

### `data_overview`

- **Input**: `{ table: string, date_column?: string }`
- **Output**: `{ total_rows, date_range?: {min, max, distinct_months}, null_count_in_date? }`
- Diagnostic narzędzie wywoływane automatycznie gdy `run_sql` zwróci 0 wierszy

### `make_chart`

- **Input**: `{ type: 'bar'|'line'|'pie', title, data, x_key, y_keys, unit? }`
- **Output**: `{ chart_id }` (marker dla frontendu)
- Nie wykonuje SQL — tylko zwraca strukturę dla Recharts

### Czego NIE ma

- `clarify` — black box, agent sam wybiera interpretację
- `list_tables` / `describe_table` osobno — zlepione w `lookup_schema`
- Bezpośredni `information_schema` — schema jest seed-owany

### Agent loop config

- LangChain `createOpenAIToolsAgent` + `AgentExecutor`
- `maxIterations: 12` (więcej niż obecne 5 — miejsce na diagnostic loop)
- Streaming: `streamEvents` → konwertowane do AI SDK `UIMessageStream` przez `LangChainAdapter`
- Tool error handling: error wraca do modelu jako tool result, model próbuje naprawić
- Hard timeout: 60s (Vercel `maxDuration`)

## Bezpieczeństwo i izolacja multi-tenant

### Resolve instance_id (server-side, never trust client body)

```ts
async function resolveInstanceId(req, supabase): Promise<string> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) throw new HttpError(401, 'Unauthorized');

  const requestedInstanceId = req.headers.get('X-Carfect-Instance');
  const { data: roles } = await supabase
    .from('user_roles')
    .select('instance_id, role')
    .eq('user_id', user.id);
  if (!roles?.length) throw new HttpError(403, 'No instance access');

  const allowedIds = roles.map((r) => r.instance_id);
  if (allowedIds.length === 1) return allowedIds[0];
  if (!requestedInstanceId || !allowedIds.includes(requestedInstanceId)) {
    throw new HttpError(403, 'Invalid or missing instance');
  }
  return requestedInstanceId;
}
```

### RLS via GUC pattern

`execute_readonly_query` ustawia `set_config('app.current_instance_id', ..., true)`. Wszystkie tabele z `instance_id` dostają policy:

```sql
CREATE POLICY "ai_analyst_tenant_isolation"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.instance_id = reservations.instance_id
    )
    OR
    instance_id::text = current_setting('app.current_instance_id', true)
  );
```

LLM **nie dodaje** `WHERE instance_id` — system prompt explicit. RLS automatycznie filtruje.

### SQL validator

```ts
function validateSql(sql: string): string | null {
  const trimmed = sql.trim().replace(/;+$/, '').trim();
  if (!/^select\b/i.test(trimmed)) return 'Only SELECT allowed';
  if (trimmed.includes(';')) return 'Multi-statement not allowed';
  if (/\b(insert|update|delete|drop|alter|truncate|grant|revoke|create)\b/i.test(trimmed)) {
    return 'DDL/DML keyword detected';
  }
  return null;
}
```

`execute_readonly_query` ma `statement_timeout = '10s'` jako twardy bezpiecznik.

## Model danych

### Migracje

```sql
-- 20260430140000_pgvector_setup.sql
CREATE EXTENSION IF NOT EXISTS vector;

-- 20260430140100_ai_training_tables.sql
CREATE TABLE ai_analyst_schema_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_context text NOT NULL CHECK (schema_context IN ('carfect', 'hiservice')),
  table_name text NOT NULL,
  description text NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ai_analyst_glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_context text NOT NULL,
  term_pl text NOT NULL,
  meaning text NOT NULL,
  related_tables text[],
  embedding vector(1536)
);

CREATE TABLE ai_analyst_training_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_context text NOT NULL,
  question_pl text NOT NULL,
  sql text NOT NULL,
  notes text,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON ai_analyst_schema_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON ai_analyst_glossary USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON ai_analyst_training_examples USING ivfflat (embedding vector_cosine_ops);

ALTER TABLE ai_analyst_schema_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_training_chunks" ON ai_analyst_schema_chunks
  FOR SELECT TO authenticated USING (true);
-- analogicznie dla glossary i training_examples
-- Write tylko service_role (sync skrypt)

-- 20260430140200_ai_analyst_rls.sql
-- RLS policies via GUC dla wszystkich data tables z instance_id
-- (reservations, customers, sales_orders, offers, vehicle_protocols, services, employees, ...)

-- 20260430140300_ai_analyst_logs.sql
CREATE TABLE ai_analyst_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id),
  user_id uuid NOT NULL,
  question text NOT NULL,
  tool_calls jsonb,
  final_answer text,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10,6),
  duration_ms int,
  status text CHECK (status IN ('success', 'error', 'timeout')),
  error_message text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON ai_analyst_logs (instance_id, created_at DESC);
CREATE INDEX ON ai_analyst_logs (user_id, created_at DESC);
ALTER TABLE ai_analyst_logs ENABLE ROW LEVEL SECURITY;
-- read: superadmin only; write: service_role only
```

## UI / streaming

### `AiAnalystView` refactor

Zachowuje shape (chat z fixed bottom input + suggestion chips), dokłada bogate renderowanie message parts:

| `part.type`                   | Render                                           |
| ----------------------------- | ------------------------------------------------ |
| `text`                        | Markdown przez `react-markdown`                  |
| `tool-make_chart`             | `<ChartRenderer spec={part.input} />` (Recharts) |
| `tool-run_sql`                | **Ukryte** (black box) — subtelny "•••" loading  |
| `tool-lookup_schema`          | **Ukryte**                                       |
| `tool-data_overview`          | **Ukryte**                                       |
| `tool-find_similar_questions` | **Ukryte**                                       |
| `tool-get_today`              | **Ukryte**                                       |

Loading states:

- Po wysłaniu pytania: "Analizuję..."
- Podczas tool callów: "•••"
- Po pierwszym tokenie tekstu: spinner znika

### Charts (`libs/ai/src/charts/`)

```
charts/
├── ChartRenderer.tsx     # switch po type
├── BarChartView.tsx      # Recharts BarChart
├── LineChartView.tsx     # Recharts LineChart (time series)
├── PieChartView.tsx      # Recharts PieChart (max 8 segments)
├── chartSpec.ts          # Zod schemy spec'ów (shared z backendem)
└── formatters.ts         # PL: "23 450 zł", "47 szt.", daty
```

Styling: max-height ~300px, responsive, tooltips po polsku, kolory z `libs/ui/` palette.

### Streaming

Backend używa LangChain `streamEvents` → konwertuje przez `LangChainAdapter.toDataStreamResponse(stream)` do AI SDK `UIMessageStream`. `useAiAnalyst` na froncie nie zmienia się znacząco — tylko endpoint inny + `X-Carfect-Instance` header.

## Cost guards

- **Per request**: `maxTokens` w call do OpenAI (input 4000, output 2000)
- **Per user**: rate limit 30 requests/h (z `ai_analyst_logs` count, bez Redis na v1)
- **Per instance**: 200 requests/dzień
- **Per instance/month**: alert (nie hard cap) gdy `SUM(cost_usd) > 50 USD`. V1 tylko log
- **Token cost tracking**: zapisywane do `ai_analyst_logs` z każdego responsu OpenAI

## Eval

### Storage: `libs/ai/src/training/carfect/eval.yaml`

```yaml
- id: revenue_current_month
  question: 'Jaki był mój przychód w bieżącym miesiącu?'
  expected_for_armcar:
    answer_contains: ['zł', 'kwiecień']
    sql_must_use_table: 'reservations'
    sql_must_filter_status: ['completed']
  expected_for_demo:
    answer_contains: ['zł']

- id: orders_march_no_data
  question: 'Podsumuj zlecenia za marzec'
  expected_for_armcar:
    diagnostic_loop_triggered: true
    answer_contains: ['marca', 'zakres', 'dane']
```

### Eval runner

`pnpm --filter ai eval:run --instance=armcar`:

1. Loaduje eval.yaml
2. Dla każdego pytania wywołuje `/api/ai-analyst-v2`
3. Zbiera: final answer, sekwencję tool calls, tokens, czas
4. Sprawdza expectations
5. Wypluwa raport markdown `eval-results-YYYY-MM-DD.md`

### Bramka

- **PoC**: minimum 70% pass rate
- **Production rollout**: minimum 85%
- Nie odpalamy automatycznie w CI v1 (koszt OpenAI), tylko manualnie pre-merge dla zmian agenta

## Testing

### Frontend (vitest + RTL)

- `libs/ai/src/AiAnalystView.test.tsx` — render messages, suggestion chips, charts, loading, error
- `libs/ai/src/charts/*.test.tsx` — każdy chart komponent z różnymi spec
- `libs/ai/src/charts/chartSpec.test.ts` — Zod schema accept/reject

### Backend (vitest, pure functions)

- `api/lib/agent/validateSql.test.ts`
- `api/lib/agent/resolveInstanceId.test.ts` — wszystkie ścieżki (single/multi instance, missing header, invalid)
- `api/lib/agent/tools/*.test.ts` — każde tool z mock supabase i pgvector
- `api/lib/agent/promptBuilder.test.ts` — system prompt z RAG snippets

### Smoke test

- `api/__tests__/ai-analyst-v2.smoke.test.ts` — wywołanie endpointu na `:3333`

### Integration test

- RLS test sprawdzający że GUC izoluje cross-tenant (pgTAP albo SELECT-based w `supabase/tests/`)

## Struktura plików (delta)

```
libs/ai/                                    # rozbudowa istniejącego @shared/ai
├── src/
│   ├── index.ts                           # +exports charts, types
│   ├── AiAnalystView.tsx                  # refactor
│   ├── AiAnalystView.test.tsx             # NEW
│   ├── useAiAnalyst.ts                    # +X-Carfect-Instance header
│   ├── useAiAnalyst.test.ts               # NEW
│   ├── types.ts                           # +ChartSpec, +MessagePart types
│   ├── charts/                            # NEW
│   │   ├── ChartRenderer.tsx
│   │   ├── ChartRenderer.test.tsx
│   │   ├── BarChartView.tsx
│   │   ├── LineChartView.tsx
│   │   ├── PieChartView.tsx
│   │   ├── chartSpec.ts
│   │   ├── chartSpec.test.ts
│   │   └── formatters.ts
│   └── training/                          # NEW
│       └── carfect/
│           ├── schema.yaml                # ~20 tables, hand-curated
│           ├── glossary.yaml              # ~30 PL terms
│           ├── examples.yaml              # ~30 question→SQL pairs
│           └── eval.yaml                  # 25-30 eval questions
└── package.json                            # +deps: react-markdown, langchain, pgvector libs

api/
├── ai-analyst-v2.ts                        # NEW: LangChain agent endpoint
├── ai-analyst.ts                           # KEEP for now (fallback), delete after v2 stable
└── lib/
    └── agent/
        ├── resolveInstanceId.ts + test
        ├── validateSql.ts + test
        ├── promptBuilder.ts + test
        └── tools/
            ├── lookupSchema.ts + test
            ├── findSimilarQuestions.ts + test
            ├── getToday.ts + test
            ├── runSql.ts + test
            ├── dataOverview.ts + test
            └── makeChart.ts + test

scripts/
└── sync-training-data.ts                   # NEW: YAML → pgvector via service role

supabase/
├── migrations/
│   ├── 20260430140000_pgvector_setup.sql
│   ├── 20260430140100_ai_training_tables.sql
│   ├── 20260430140200_ai_analyst_rls.sql
│   └── 20260430140300_ai_analyst_logs.sql
└── functions/
    └── ai-analyst/                         # DELETE (deprecated Deno fn)

apps/carfect/src/
├── components/admin/AiAnalystTab.tsx       # update: usuwa instanceId prop, dodaje X-Carfect-Instance
└── pages/AdminDashboard.tsx                # ODKOMENTOWANIE sidebar nav (linie 1436-1454)
```

## Rollout

- Zachowujemy istniejący feature flag `ai_analyst` w `instance_features`
- Dodajemy parametr `version: 'v2'` w `feature_params`
- armcar/demo dostają v2 od razu (są jedynymi z `ai_analyst=true`)
- Po 2 tygodniach soak: rollout szerszy
- Stary `api/ai-analyst.ts` usuwamy gdy v2 stable
- Stary `supabase/functions/ai-analyst/` usuwamy w pierwszej migracji (już deprecated)

## Backward compat

- `useAiAnalyst` API praktycznie się nie zmienia — frontend code prawie bez zmian
- Sidebar nav w `AdminDashboard.tsx` odkomentowany, gated przez `hasFeature('ai_analyst')`
- Frontend zaczyna wysyłać nagłówek `X-Carfect-Instance` (nowy) — backend toleruje brak (jeśli user ma 1 instance)

## Out of scope v1

- Persystencja historii konwersacji między sesjami
- Follow-up questions z prior context (single-turn agent)
- CSV export wyników
- Edycja training data z superadmin UI
- Hiservice schema
- Provenance / cytowanie SQL w odpowiedzi (black box)
- Wielojęzyczność agenta (PL only)
- Rate limit per IP
- Anomaly detection
- Charts agregujące wyniki z multiple SQL
- Real-time streaming wykresów (chart renderuje się po zakończeniu tool call)

## Otwarte ryzyka

| Ryzyko                                                      | Mitygacja                                                                                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| pgvector cosine similarity nie znajduje trafnych przykładów | Manual review top-K wyników podczas seed-owania, ewentualnie hybrid search (BM25 + vector)     |
| LangChain.js stream events niekompatybilne z AI SDK v6      | `LangChainAdapter` z AI SDK to oficjalna ścieżka — sprawdzone, ale fallback: ręczny SSE bridge |
| `gpt-4.1` halucynuje SQL mimo few-shot                      | Eval set wcześnie wyłapie, alternatywa: gpt-5 lub structured output dla SQL gen                |
| RLS policy z GUC nie działa dla wszystkich tabel uniformly  | Integration test pre-merge sprawdza każdą tabelę z `instance_id` osobno                        |
| Vercel maxDuration 60s nieadekwatne dla agent loop          | Telemetria w `ai_analyst_logs.duration_ms` od początku, alert >45s                             |
| Koszt OpenAI eskaluje                                       | Hard rate limit (30/h/user) + per-request token cap; alert na $50/instance/miesiąc             |

## Estymacja

POC end-to-end (armcar + demo, 70% eval pass rate): **3-5 dni roboczych**.
Production-ready (85% pass, full test coverage, monitoring): **+2-3 dni**.
