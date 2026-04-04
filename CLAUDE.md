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
