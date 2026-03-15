## Stack

- React 19 + Vite + TypeScript
- Supabase, TanStack Query v5
- React Hook Form + Zod
- Tailwind CSS v3 + shadcn/ui
- Vitest + @testing-library/react

## Testing

- Pliki testów: \*.test.tsx obok komponentów
- Mockowanie Supabase: vi.mock('@supabase/supabase-js')
- Async: zawsze userEvent.setup() przed testem

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
