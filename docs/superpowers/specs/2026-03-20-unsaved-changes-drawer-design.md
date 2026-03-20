# Design: Ochrona niezapisanych zmian w drawerach panelu sprzedaży

**Data:** 2026-03-20
**Status:** Zatwierdzone

---

## Cel

Zmiana zachowania drawerów panelu sprzedaży:

- Kliknięcie poza drawerem (lub przycisk X) **bez zmian** → zamknięcie natychmiastowe
- Kliknięcie poza drawerem (lub przycisk X) **z niezapisanymi zmianami** → popup z pytaniem

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
  - jeśli `!isDirty` → wywołuje `onDiscard()` bezpośrednio
  - jeśli `isDirty` → otwiera dialog, zapamiętuje callbacks
- `ConfirmDialog` — renderuje `AlertDialog` z 3 przyciskami

### AlertDialog — przyciski

| Przycisk             | Akcja                                                       |
| -------------------- | ----------------------------------------------------------- |
| **Zapisz**           | wywołuje `onSave()` (submit formularza), dialog znika       |
| **Odrzuć zmiany**    | wywołuje `onDiscard()` (zamknięcie drawera), `resetDirty()` |
| **Kontynuuj edycję** | zamknięcie dialogu, drawer pozostaje otwarty                |

---

## Zmiany per drawer

Każdy z 4 drawerów wymaga identycznych zmian:

### 1. Import hooka

```ts
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
// lub odpowiednia ścieżka relative
```

### 2. Inicjalizacja

```ts
const { isDirty, markDirty, resetDirty, handleClose, ConfirmDialog } = useUnsavedChanges();
```

### 3. Oznaczanie zmian

Każdy `onChange` handler / setter formularza dostaje wywołanie `markDirty()`. Przykład:

```ts
const handleFieldChange = (value: string) => {
  setField(value);
  markDirty();
};
```

### 4. Intercept zamknięcia

**`onInteractOutside`** — zamiast `e.preventDefault()`:

```tsx
onInteractOutside={(e) => {
  e.preventDefault();
  handleClose(handleSubmit, () => {
    resetDirty();
    onOpenChange(false);
  });
}}
```

**`onOpenChange`** / przycisk X:

```tsx
onOpenChange={(isOpen) => {
  if (!isOpen) {
    handleClose(handleSubmit, () => {
      resetDirty();
      resetForm();
      onOpenChange(false);
    });
  }
}}
```

### 5. Reset po zapisie

W `resetForm()` i po pomyślnym zapisie:

```ts
resetDirty();
```

### 6. Render dialogu

Na końcu JSX drawera:

```tsx
<ConfirmDialog />
```

---

## Co NIE wchodzi w zakres

- Drawery poza panelem sprzedaży
- Głębokie porównanie stanu (deep diff)
- Automatyczny zapis (autosave)
- Zachowanie przy nawigacji przeglądarki (beforeunload)
