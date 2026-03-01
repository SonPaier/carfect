

# Plan: Modul bezpieczenstwa hasel

## Stan obecny

- Hasla walidowane tylko na dlugosc (min 6 znakow) -- brak wymagan co do zlozonosci
- Brak strength meter, brak checklisty wymagan
- Reset hasla pracownika: admin wpisuje nowe haslo w dialogu (bez potwierdzenia swoim haslem)
- Super admin: osobna edge function `reset-password` z hardcodowanym kluczem `RESET_SUPERADMIN_2025` -- niebezpieczne
- Brak flow "zapomnialem hasla" (admini maja email, ale nie ma strony /forgot-password)
- Brak blokady konta po nieudanych probach (is_blocked istnieje, ale nie ma auto-blokady)
- Brak rate limitingu na logowaniu
- Brak audytu prob logowania

## Architektura modulu (wyenkapsulowany, kopiowalny do N2Service)

```text
src/components/password/
  PasswordInput.tsx          -- input + toggle visibility + strength meter + checklista
  PasswordConfirmInput.tsx   -- pole potwierdzenia hasla
  passwordValidation.ts      -- logika walidacji (regex, entropia, sekwencje)
  passwordStrength.ts        -- obliczanie sily hasla (4 poziomy)
  commonPasswords.ts         -- top 1000 popularnych hasel (frontend)
  usePasswordValidation.ts   -- hook laczy walidacje + stan

supabase/functions/_shared/passwordPolicy.ts  -- walidacja server-side (ta sama logika)
```

---

## Etapy wdrozenia

### ETAP 1: Komponent PasswordInput + walidacja frontend
**Effort: 3 SP**

- Komponent `<PasswordInput />` z:
  - Toggle widocznosci hasla (ikona oka)
  - Checklista wymagan w czasie rzeczywistym (8+ znakow, wielka litera, mala litera, cyfra, znak specjalny)
  - Pasek sily hasla (4 poziomy: slabe/srednie/dobre/silne) z kolorami
  - Blokada sekwencji (123456, qwerty, abcdef)
  - Sprawdzanie listy 1000 popularnych hasel (frontend, ~15KB)
  - Blokada hasla zawierajacego login
- Komponent `<PasswordConfirmInput />` -- walidacja zgodnosci
- Hook `usePasswordValidation` -- caly stan walidacji
- Podpiecie do: `AddInstanceUserDialog`, `ResetPasswordDialog`, `EditInstanceUserDialog`
- i18n -- wszystkie komunikaty w pl.json

### ETAP 2: Walidacja server-side (backend)
**Effort: 2 SP**

- Shared modul `_shared/passwordPolicy.ts` z ta sama logika co frontend
- Top 10k popularnych hasel sprawdzane server-side
- Walidacja w `manage-instance-users` (akcje: create, reset-password)
- Walidacja w `init-admin` i `create-user`
- Usuniecie niebezpiecznej edge function `reset-password` (hardcodowany klucz)
- Odpowiedzi bledow nie zdradzaja szczegolowych informacji

### ETAP 3: Zmiana hasla przez admina z potwierdzeniem
**Effort: 2 SP**

- Reset hasla pracownika: admin musi podac SWOJE haslo jako potwierdzenie
- Zmiana wlasnego hasla admina: stare haslo + nowe haslo (strona /settings/change-password lub dialog)
- Backend weryfikuje haslo admina przed wykonaniem operacji

### ETAP 4: Blokada konta po nieudanych probach
**Effort: 3 SP**

- Tabela `login_attempts` (user_id, instance_id, ip, success, created_at)
- Po 6 nieudanych probach: auto-blokada konta (is_blocked = true)
- Pracownik: komunikat "Skontaktuj sie z administratorem"
- Admin (z emailem): auto-email z linkiem resetowym
- Licznik pozostalych prob widoczny od 3. blednej proby
- Komunikat logowania: "Bledne dane logowania" (nigdy nie ujawniamy co jest zle)

### ETAP 5: Forgot password flow (tylko admini z emailem)
**Effort: 3 SP**

- Strona `/forgot-password` -- admin podaje email
- Edge function wysyla email z linkiem (template z zalacznika HTML)
- Strona `/reset-password?token=...` -- nowe haslo + PasswordInput
- Token jednorazowy, wazny 1h
- Odpowiedz zawsze taka sama ("Jesli konto istnieje, wyslalismy email")
- Pracownicy NIE maja tego flow (brak emaila)

### ETAP 6: Rate limiting + audit trail
**Effort: 2 SP**

- Rate limiting na endpointach logowania (max 3 req/min na IP)
- Rate limiting na forgot-password (max 3 req/min na IP)
- Tabela `auth_audit_log` (event_type, user_id, ip, metadata, created_at)
- Logowanie: udane/nieudane logowania, resety hasel, blokady kont

### ETAP 7: Historia hasel (opcjonalne)
**Effort: 1 SP**

- Tabela `password_history` (user_id, password_hash, created_at)
- Blokada ostatnich 5 hasel
- Sprawdzanie przy kazdej zmianie hasla

---

## Priorytety i zaleznosci

```text
Etap 1 ──► Etap 2 ──► Etap 3
                  └──► Etap 4 ──► Etap 5
                            └──► Etap 6
                                    └──► Etap 7 (opcjonalny)
```

Etap 1+2 to fundament -- reszta buduje na nich. Etap 7 jest opcjonalny wg JIRA (SHOULD HAVE).

