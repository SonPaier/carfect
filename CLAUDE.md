## Stack

- React 19 + Vite + TypeScript
- Supabase, TanStack Query v5
- React Hook Form + Zod
- Tailwind CSS v3 + shadcn/ui
- Vitest + @testing-library/react

## TypeScript

- NIGDY nie używaj `any` w nowym kodzie — to ostateczność
- Unikaj `unknown` — używaj konkretnych typów. `unknown` tylko w catch i tam gdzie typ naprawdę nie jest znany
- Szukaj istniejących typów: Supabase generated types (`src/integrations/supabase/types.ts`), interfejsy w pliku
- Dla Supabase query callbacks: twórz lokalne interfejsy z polami które są faktycznie używane
- Dla catch: `catch (error: unknown)` + `(error as Error).message`
- Dla obiektów: `Record<string, unknown>` zamiast `Record<string, any>`

## Testing

- Pliki testów: \*.test.tsx obok komponentów
- Mockowanie Supabase: vi.mock('@supabase/supabase-js')
- Async: zawsze userEvent.setup() przed testem
- **Każdy nowy komponent MUSI mieć testy** — nie commituj komponentu bez pliku testowego
- Testy pisz od razu razem z komponentem, nie "potem"

### Zarządzanie procesami testowymi (KRYTYCZNE)

- **Max 1 proces testowy w danym momencie** — NIGDY nie uruchamiaj testów z wielu agentów równolegle
- **ZAWSZE `--run`** — każde wywołanie vitest MUSI mieć flagę `--run` (bez watch mode)
- **Agenty (implementer, bug-finder, itp.) NIE uruchamiają testów samodzielnie** — testy uruchamia tylko główny kontekst
- Przed uruchomieniem nowego testu upewnij się, że poprzedni się zakończył
- Naruszenie tych zasad powoduje dziesiątki zombie procesów node/vitest i wymusza reset komputera

## i18n

- `apps/carfect/` — ZAWSZE używaj `t()` z react-i18next, NIGDY hardcoded polski tekst w JSX
- `apps/hiservice/` — polski hardcoded OK (nie będzie tłumaczony)
- Klucze i18n w `apps/carfect/src/i18n/locales/pl.json`

## Backend testing (Edge Functions, RPCs, triggers, libs)

**Bezwzględna reguła: każda funkcja edge i KAŻDA logika backend MUSI mieć testy.**
Dotyczy: edge functions (Deno), Vercel API endpoints (`api/*.ts`),
PG functions / triggers / RPCs (DB unit tests lub integracyjne),
oraz shared backend lib code (`libs/*/src/`).

Backend bez testu = backend nie działa. Bez wyjątków, nawet dla
"oczywistego" 5-liniowego helpera. Jeśli logika jest trudna do przetestowania
— wydziel ją do pure function w osobnym pliku.

### Edge Functions (Deno) — szczegóły

- Pliki testów: `*_test.ts` obok kodu (konwencja Deno, nie `.test.ts`)
- Framework: `Deno.test` + `jsr:@std/assert` + `jsr:@std/testing/mock`
- Pure logic wydzielaj do osobnych plików (np. `helpers.ts`) — `index.ts` odpala `serve()` i nie da się go importować w testach
- Każdy nowy helper w `helpers.ts` MUSI mieć test (XSS escape, walidacja
  wejścia, transformacje URL, parsowanie body)
- CI: `deno test supabase/functions/ --no-check --allow-env --allow-net --allow-read`

### Vercel API endpoints

- `api/server.ts` to lokalny dev server — testuj logikę wydzieloną do helpers,
  nie samego handlera
- Każdy endpoint w `api/` musi mieć smoke test wywołania (lokalny server
  na :3333) udokumentowany w PR

### PG functions / triggers / migrations z logiką

- Trigger generujący slug, RPC z conditional, CHECK constraint — każdy
  taki nietrywialny kawałek SQL musi mieć test (frontend hook test wywołujący
  RPC + asercje na zwrócony shape, lub dedykowany SQL test)

## Skills

Zainstaluj superpowers przed rozpoczęciem pracy:
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

## End-of-task checklist

Po zakończeniu implementacji każdego taska (przed commitem), ZAWSZE uruchom w tej kolejności:

1. `/find-bugs` — przejrzyj zmiany pod kątem bugów i bezpieczeństwa
2. `/simplify` — przejrzyj zmiany pod kątem reuse, jakości i wydajności
3. Napraw znalezione problemy
4. Uruchom testy: `pnpm --filter carfect test -- --run`
5. Dopiero potem commituj

<!-- autoskills:start -->
<!-- autoskills:end -->
