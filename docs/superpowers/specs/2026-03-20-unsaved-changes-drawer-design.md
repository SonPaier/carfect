# Design: Ochrona niezapisanych zmian w drawerach panelu sprzedaży

**Data:** 2026-03-20
**Status:** Zatwierdzone

---

## Cel

Zmiana zachowania drawerów panelu sprzedaży:

- Kliknięcie poza drawerem / Escape / przycisk X **bez zmian** → zamknięcie natychmiastowe
- Kliknięcie poza drawerem / Escape / przycisk X **z niezapisanymi zmianami** → popup z pytaniem

---

## Zakres

Wszystkie cztery drawery panelu sprzedaży:

- `AddSalesOrderDrawer.tsx`
- `AddEditSalesCustomerDrawer.tsx`
- `AddSalesProductDrawer.tsx`
- `AddEditRollDrawer.tsx`

---

## Decyzje projektowe

- **Wykrywanie zmian:** prosta flaga `isDirty` ustawiana przy każdej zmianie inputu, resetowana po zapisie/odrzuceniu.
- **Popup:** 3 opcje — „Zapisz", „Odrzuć zmiany", „Kontynuuj edycję".
- **Architektura:** wspólny hook `useUnsavedChanges` — logika w jednym miejscu.

---

## Architektura

### Hook `useUnsavedChanges`

Plik: `apps/carfect/src/components/sales/hooks/useUnsavedChanges.ts`

```ts
interface UseUnsavedChangesReturn {
  isDirty: boolean;
  markDirty: () => void;
  resetDirty: () => void;
  handleClose: (onSave: () => void, onDiscard: () => void) => void;
  ConfirmDialog: React.FC;
}
```

**Logika:**

- `markDirty()` — ustawia `isDirty = true`
- `resetDirty()` — ustawia `isDirty = false`
- `handleClose(onSave, onDiscard)`:
  - jeśli `!isDirty` → wywołuje `onDiscard()` bezpośrednio (natychmiastowe zamknięcie)
  - jeśli `isDirty` → otwiera dialog, zapamiętuje oba callbacki w `useRef`
- `ConfirmDialog` — renderuje `AlertDialog` z 3 przyciskami

**Ważne:** `handleClose` zawsze wywołuje `e.preventDefault()` poza hookiem — hook sam nie zapobiega zamknięciu Sheet, tylko zarządza stanem dialogu. `ConfirmDialog` jest kontrolowany przez stan `dialogOpen` wewnątrz hooka (nie ref). Jeśli `handleClose` jest wywołane ponownie gdy dialog jest już otwarty — ignoruje wywołanie (guard przed rapid clicks).

### AlertDialog — przyciski

| Przycisk             | Akcja                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| **Zapisz**           | wywołuje `onSave()` (submit formularza); po pomyślnym zapisie drawer zamknie się przez własną logikę |
| **Odrzuć zmiany**    | wywołuje `onDiscard()` → resetuje form + zamyka drawer; wywołuje `resetDirty()`                      |
| **Kontynuuj edycję** | zamknięcie dialogu, drawer pozostaje otwarty, `isDirty` bez zmian                                    |

**Obsługa błędu `onSave`:** jeśli `onSave()` jest async i rzuci błąd — drawer obsługuje błąd wewnętrznie (toast), dialog znika, drawer pozostaje otwarty.

---

## Strategia przechwytywania zamknięcia

Aby uniknąć nieskończonej pętli, **nie używamy `onOpenChange` Sheet do guardu**. Zamiast tego przechwytujemy zdarzenia bezpośrednio:

### `onInteractOutside` (klik poza drawer)

```tsx
onInteractOutside={(e) => {
  e.preventDefault(); // zawsze blokuj naturalne zamknięcie
  handleClose(handleSubmit, () => {
    resetDirty();
    resetForm();
    onOpenChange(false); // prop z rodzica — bezpośrednie zamknięcie
  });
}}
```

### `onEscapeKeyDown` (klawisz Escape)

```tsx
onEscapeKeyDown={(e) => {
  e.preventDefault(); // zawsze blokuj naturalne zamknięcie
  handleClose(handleSubmit, () => {
    resetDirty();
    resetForm();
    onOpenChange(false);
  });
}}
```

### Przycisk X / Anuluj

```tsx
onClick={() =>
  handleClose(handleSubmit, () => {
    resetDirty();
    resetForm();
    onOpenChange(false);
  })
}
```

### `onOpenChange` Sheet

Zostawiamy istniejącą logikę **bez zmian** w tych drawerach, gdzie Sheet używa `onOpenChange`. Ponieważ `onInteractOutside` i `onEscapeKeyDown` blokują naturalne zamknięcie przez `e.preventDefault()`, `onOpenChange(false)` będzie wywoływane **tylko** przez nasze własne callbacki (kontrolowane).

---

## Zmiany per drawer

Każdy z 4 drawerów wymaga identycznych zmian:

### 1. Import hooka

```ts
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
// lub odpowiednia ścieżka relative do lokalizacji pliku
```

### 2. Inicjalizacja

```ts
const { isDirty, markDirty, resetDirty, handleClose, ConfirmDialog } = useUnsavedChanges();
```

### 3. Oznaczanie zmian

Każdy setter stanu formularza dostaje wywołanie `markDirty()`. Przykład:

```ts
onChange={(e) => {
  setField(e.target.value);
  markDirty();
}}
```

### 4. Intercept zamknięcia

Dodaj `onInteractOutside` i `onEscapeKeyDown` do `SheetContent` (patrz wzorzec wyżej).
Zmień przycisk X / Anuluj na wzorzec z `handleClose` (patrz wyżej).

### 5. Reset po zapisie

W każdym miejscu gdzie drawer się zamyka po pomyślnym zapisie, wywołaj `resetDirty()` przed `onOpenChange(false)`.

### 6. Render dialogu

Na końcu JSX drawera (przed zamknięciem `<>` lub `<Sheet>`):

```tsx
<ConfirmDialog />
```

---

## Zagnieżdżone drawery

`AddSalesOrderDrawer` zawiera zagnieżdżone drawery (`AddEditSalesCustomerDrawer`, `SalesProductSelectionDrawer`). Te drawery mają własny `onInteractOutside={(e) => e.preventDefault()}` — kliknięcie poza nimi **nie propaguje** do rodzica. Zagnieżdżone drawery nie potrzebują własnego `useUnsavedChanges` w tym zakresie.

---

## Co NIE wchodzi w zakres

- Drawery poza panelem sprzedaży
- Głębokie porównanie stanu (deep diff)
- Automatyczny zapis (autosave)
- Zachowanie przy nawigacji przeglądarki (beforeunload)
- Dodawanie `useUnsavedChanges` do zagnieżdżonych drawerów (SalesProductSelectionDrawer)
