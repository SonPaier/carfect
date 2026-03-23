# Spec: AI Business Analyst

## Summary

Natural language interface for instance owners to query their business data. User writes a prompt ("ile ceramik zrobiłem w marcu?"), AI generates SQL, executes on read-only DB, returns formatted text + optional table. Behind feature flag. MVP for Carfect, shared lib for future HiService reuse.

## Architecture

```
User prompt + schemaContext
        ↓
  Edge function "ai-analyst"
        ↓
  1. Load schema description for schemaContext (carfect | hiservice)
  2. Send to OpenAI GPT-4o-mini: system prompt with schema + user question → SQL
  3. Validate SQL (SELECT only, no mutations)
  4. Inject instance_id WHERE clause
  5. Execute SQL via service role client
  6. Send results back to GPT: raw rows + user question → formatted answer
  7. Return JSON: { answer: string, table?: { headers: string[], rows: string[][] } }
        ↓
  Frontend renders text + optional table
```

## Shared Library: `@shared/ai`

New lib at `libs/ai/` — shared between Carfect and HiService.

### Files

```
libs/ai/
  src/
    index.ts                    — barrel export
    types.ts                    — AiAnalystRequest, AiAnalystResponse, TableResult
    useAiAnalyst.ts             — hook: sends prompt to edge function, returns response
    AiAnalystView.tsx           — full UI component: input, suggestions, response area, table
```

### Types

```ts
interface AiAnalystSuggestion {
  label: string;
  prompt: string;
}

interface AiAnalystRequest {
  prompt: string;
  instanceId: string;
  schemaContext: 'carfect' | 'hiservice';
}

interface AiAnalystResponse {
  answer: string;
  table?: {
    headers: string[];
    rows: string[][];
  };
}
```

### Component API

```tsx
<AiAnalystView
  instanceId={instanceId}
  suggestions={[...]}
  schemaContext="carfect"
  supabaseClient={supabase}
/>
```

## Edge Function: `ai-analyst`

Location: `supabase/functions/ai-analyst/index.ts`

### Flow

1. Receive POST: `{ prompt, instanceId, schemaContext }`
2. Validate auth (JWT from request)
3. Load schema description for `schemaContext`
4. Call OpenAI GPT-4o-mini with system prompt:
   - Role: SQL analyst for a business
   - Schema description (tables, key columns, relationships)
   - Rules: SELECT only, always filter by instance_id, use Polish month names awareness
   - Output: raw SQL string
5. Validate generated SQL:
   - Must start with SELECT (case-insensitive, trimmed)
   - Must not contain INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE
   - Must contain instance_id filter
6. Execute SQL via Supabase service role client (`supabase.rpc` or raw SQL)
7. Call OpenAI again with:
   - Original user question
   - SQL results as JSON
   - Instructions: format as human-readable Polish answer, optionally include table structure
   - Output: JSON `{ answer, table? }`
8. Return response

### Schema Contexts

**Carfect** — tables available to AI:
- `reservations` (id, instance_id, customer_name, customer_phone, service_items, start_time, end_time, status, total_price, created_at)
- `customers` (id, instance_id, name, phone, email, car_model_id, created_at)
- `unified_services` (id, instance_id, name, category_id, base_price, service_type)
- `unified_categories` (id, instance_id, name, slug)
- `offers` (id, instance_id, offer_number, status, total_price, customer_data, created_at, sent_at, approved_at)
- `stations` (id, instance_id, name, station_type)
- `sales_orders` (id, instance_id, status, total_amount, customer_id, created_at)
- `sales_customers` (id, instance_id, name, phone, email, nip)

**HiService** (future) — different tables, same edge function.

### Security

- OpenAI API key in Supabase secrets (`OPENAI_API_KEY`), never in code
- SQL validation: reject any non-SELECT statements
- Instance scoping: inject `WHERE instance_id = $1` — AI-generated SQL must reference instance_id
- Auth: require valid JWT, extract user's instance_id from `user_roles`
- No raw SQL exposure to frontend — only formatted answer + table

## Frontend

### New Tab in AdminDashboard

- Feature flag: `ai_analyst` in `instance_features`
- Tab label: "Asystent AI" (or "Raporty AI")
- Icon: Sparkles from lucide-react

### UI Layout

```
┌─────────────────────────────────────────────┐
│  Asystent AI                                │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Zapytaj o swój biznes...        [→] │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Przychód w tym miesiącu]                  │
│  [Najpopularniejsze usługi]                 │
│  [Top klienci]                              │
│                                             │
│  ─── after query ───                        │
│                                             │
│  🗨 "Ile ceramik zrobiłem w marcu?"         │
│                                             │
│  W marcu 2026 zrealizowano 12 usług         │
│  ceramicznych na łączną kwotę 18 400 zł.    │
│                                             │
│  ┌──────────────────────────────────┐       │
│  │ Usługa        │ Ilość │ Kwota   │       │
│  │───────────────│───────│─────────│       │
│  │ Korekta       │  8    │ 12 800  │       │
│  │ Ochrona       │  4    │  5 600  │       │
│  └──────────────────────────────────┘       │
│                                             │
│  [Przychód w tym miesiącu]                  │
│  [Najpopularniejsze usługi]                 │
│  [Top klienci]                              │
└─────────────────────────────────────────────┘
```

### Behavior

- Input: text field with submit button (Enter or click)
- Suggestions: 3 pill buttons below input, clicking fills input and auto-submits
- Loading: spinner/skeleton in response area
- Response: text paragraph + optional Table component (shadcn Table)
- Session history: scroll up to see previous Q&A pairs
- Suggestions always visible at bottom for next query
- Error: toast on failure, "Nie udało się przetworzyć zapytania"

## Feature Flag

Key: `ai_analyst`

Enable per instance via `instance_features` table:
```sql
INSERT INTO instance_features (instance_id, feature_key, enabled)
VALUES ('...', 'ai_analyst', true);
```

## Pastilki (Suggestion Prompts)

1. **"Przychód w tym miesiącu"** → "Jaki był mój łączny przychód w bieżącym miesiącu? Podaj sumę i liczbę rezerwacji."
2. **"Najpopularniejsze usługi"** → "Jakie usługi były najczęściej rezerwowane w ostatnich 30 dniach? Pokaż ranking."
3. **"Top klienci"** → "Którzy klienci mieli najwięcej rezerwacji w ostatnich 3 miesiącach? Pokaż top 10 z liczbą wizyt i łączną kwotą."

## Out of Scope (v1)

- Charts/graphs (v2 — recharts)
- Export to PDF/CSV
- Scheduled reports
- Multi-turn conversation (each query is independent)
- HiService integration (later, same shared lib)
