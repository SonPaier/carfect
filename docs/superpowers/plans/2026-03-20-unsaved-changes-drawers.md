# Unsaved Changes Guard for Sales Drawers — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać ochronę niezapisanych zmian we wszystkich 4 drawerach panelu sprzedaży — kliknięcie poza drawerem bez zmian zamyka go, z niezapisanymi zmianami wyświetla popup (Zapisz / Odrzuć / Kontynuuj).

**Architecture:** Shared hook `useUnsavedChanges` zarządza flagą `isDirty`, stanem dialogu i callbackami. Plik eksportuje też komponent `UnsavedChangesDialog` (poza hookiem). Każdy drawer importuje hook + komponent, wywołuje `markDirty()` przy zmianach, `handleClose()` przy próbie zamknięcia, i renderuje `<UnsavedChangesDialog {...dialogProps} />` w JSX.

**Tech Stack:** React 19, TypeScript, shadcn/ui (AlertDialog, Sheet), Tailwind CSS

---

## Chunk 1: Hook `useUnsavedChanges`

### Task 1: Stwórz hook `useUnsavedChanges`

**Files:**

- Create: `apps/carfect/src/components/sales/hooks/useUnsavedChanges.tsx`

- [ ] **Step 1: Stwórz plik hooka z pełną implementacją**

Hook zwraca `dialogProps` — obiekt propsów gotowy do spread do `<UnsavedChangesDialog>`. Komponent `UnsavedChangesDialog` jest eksportowany z tego samego pliku i definiowany poza hookiem (stabilny typ — brak re-mount). W drawerze: `<UnsavedChangesDialog {...dialogProps} />`.

```tsx
import { useState, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui';
import { Button } from '@shared/ui';

// Eksportowany komponent — definiowany POZA hookiem dla stabilnego typu
export interface UnsavedChangesDialogProps {
  open: boolean;
  onContinue: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export const UnsavedChangesDialog = ({
  open,
  onContinue,
  onDiscard,
  onSave,
}: UnsavedChangesDialogProps) => (
  <AlertDialog open={open}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Niezapisane zmiany</AlertDialogTitle>
        <AlertDialogDescription>Masz niezapisane zmiany. Co chcesz zrobić?</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" className="sm:mr-auto" onClick={onContinue}>
          Kontynuuj edycję
        </Button>
        <Button variant="destructive" onClick={onDiscard}>
          Odrzuć zmiany
        </Button>
        <Button onClick={onSave}>Zapisz</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export function useUnsavedChanges() {
  const [isDirty, setIsDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const callbacksRef = useRef<{ onSave: () => void; onDiscard: () => void } | null>(null);

  const markDirty = () => setIsDirty(true);
  const resetDirty = () => setIsDirty(false);

  const handleClose = (onSave: () => void, onDiscard: () => void) => {
    if (dialogOpen) return; // guard: rapid clicks
    if (!isDirty) {
      onDiscard();
      return;
    }
    callbacksRef.current = { onSave, onDiscard };
    setDialogOpen(true);
  };

  const dialogProps: UnsavedChangesDialogProps = {
    open: dialogOpen,
    onContinue: () => setDialogOpen(false),
    onDiscard: () => {
      setDialogOpen(false);
      setIsDirty(false);
      callbacksRef.current?.onDiscard();
    },
    onSave: () => {
      setDialogOpen(false);
      callbacksRef.current?.onSave();
    },
  };

  return { isDirty, markDirty, resetDirty, handleClose, dialogProps };
}
```

**Użycie w drawerze:**

```tsx
import { useUnsavedChanges, UnsavedChangesDialog } from './hooks/useUnsavedChanges';
// ...
const { markDirty, resetDirty, handleClose, dialogProps } = useUnsavedChanges();
// ...w JSX:
<UnsavedChangesDialog {...dialogProps} />;
```

- [ ] **Step 2: Sprawdź TypeScript**

```bash
cd /Users/rafnastaly/Documents/programming/carfect/apps/carfect && npx tsc --noEmit 2>&1 | head -20
```

Oczekiwane: brak błędów.

- [ ] **Step 3: Commit**

```bash
git add apps/carfect/src/components/sales/hooks/useUnsavedChanges.tsx
git commit -m "feat: add useUnsavedChanges hook for sales drawers"
```

---

## Chunk 2: AddSalesOrderDrawer

### Task 2: Podpięcie hooka w `AddSalesOrderDrawer.tsx`

**Files:**

- Modify: `apps/carfect/src/components/sales/AddSalesOrderDrawer.tsx`

**Kontekst:**

- Plik: ~710 linii
- `handleClose()` (linia ~261): tylko `onOpenChange(false)`
- `resetForm()` (linia ~265): resetuje cały stan formularza
- `handleSubmit` (linia ~279): async, zapisuje zamówienie
- SheetContent (linia ~561): brak `onInteractOutside` i `onEscapeKeyDown`
- X button (linia ~575-579): `onClick={handleClose}`
- Anuluj button (linia ~686): `onClick={handleClose}`
- Settery stanu: `setPaymentMethod`, `setBankAccountNumber`, `setComment`, `setSendEmail`, `setAttachments`
- Produkty/paczki: zarządzane przez `orderPackages` hook — `markDirty()` dodajemy na callbackach przekazywanych do `PackagesSection`

- [ ] **Step 1: Dodaj import hooka**

Po ostatnim imporcie w bloku (ok. linia 38), dopisz:

```ts
import { useUnsavedChanges, UnsavedChangesDialog } from './hooks/useUnsavedChanges';
```

- [ ] **Step 2: Inicjalizuj hook po inicjalizacji `orderPackages`**

Po linii z `const orderPackages = useOrderPackages(...)` (ok. linia ~95), dopisz:

```ts
const {
  isDirty,
  markDirty,
  resetDirty,
  handleClose: handleUnsavedClose,
  dialogProps,
} = useUnsavedChanges();
```

Uwaga: lokalny `handleClose` (linia ~261) pozostaje — nazwiemy hook-ową wersję `handleUnsavedClose`.

- [ ] **Step 3: Zmień lokalny `handleClose` żeby używał hooka**

Zastąp istniejący `handleClose`:

```ts
// PRZED:
const handleClose = () => {
  onOpenChange(false);
};

// PO:
const handleClose = () => {
  handleUnsavedClose(handleSubmit, () => {
    resetDirty();
    resetForm();
    onOpenChange(false);
  });
};
```

- [ ] **Step 4: Dodaj `markDirty()` do głównych setterów**

Zmień każdy setter stanu formularza (w JSX lub w callbackach) żeby wywoływał `markDirty()`:

- `setPaymentMethod(v)` → `setPaymentMethod(v); markDirty();`
- `setBankAccountNumber(v)` → `setBankAccountNumber(v); markDirty();`
- `setComment(v)` → `setComment(v); markDirty();`
- `setSendEmail(v)` → `setSendEmail(v); markDirty();`
- `setAttachments(v)` → `setAttachments(v); markDirty();`

Dla paczek/produktów — dodaj `markDirty()` do callbacków `PackagesSection`:

```tsx
onAddProduct={(packageId) => {
  markDirty();
  orderPackages.setActivePackageId(packageId);
  orderPackages.setProductDrawerOpen(true);
}}
onRemoveProduct={(pkgId, itemKey) => {
  markDirty();
  orderPackages.removeProductFromPackage(pkgId, itemKey);
}}
onUpdateQuantity={(...args) => { markDirty(); orderPackages.updateQuantity(...args); }}
onUpdateVehicle={(...args) => { markDirty(); orderPackages.updateVehicle(...args); }}
onShippingMethodChange={(...args) => { markDirty(); orderPackages.updatePackageShippingMethod(...args); }}
```

- [ ] **Step 5: Dodaj `resetDirty()` po udanym zapisie**

W `handleSubmit`, tuż przed `onOpenChange(false)` po sukcesie (linia ~540-541 i ~503-506):

```ts
resetDirty();
resetForm();
onOpenChange(false);
```

(Znajdź miejsca gdzie jest `onOpenChange(false)` po `toast.success` w handleSubmit i dodaj `resetDirty()` przed nimi.)

- [ ] **Step 6: Dodaj `onInteractOutside` i `onEscapeKeyDown` do `SheetContent`**

W `<SheetContent ...>` (linia ~561), dodaj:

```tsx
onInteractOutside={(e) => {
  e.preventDefault();
  handleClose();
}}
onEscapeKeyDown={(e) => {
  e.preventDefault();
  handleClose();
}}
```

- [ ] **Step 7: Renderuj `UnsavedChangesDialog` w JSX**

Tuż przed ostatnim `</>` (zamknięcie fragmentu, linia ~720+), dopisz:

```tsx
<UnsavedChangesDialog {...dialogProps} />
```

- [ ] **Step 8: Sprawdź TypeScript**

```bash
cd /Users/rafnastaly/Documents/programming/carfect/apps/carfect && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 9: Commit**

```bash
git add apps/carfect/src/components/sales/AddSalesOrderDrawer.tsx
git commit -m "feat: unsaved changes guard in AddSalesOrderDrawer"
```

---

## Chunk 3: AddSalesProductDrawer

### Task 3: Podpięcie hooka w `AddSalesProductDrawer.tsx`

**Files:**

- Modify: `apps/carfect/src/components/sales/AddSalesProductDrawer.tsx`

**Kontekst:**

- `handleClose()` (linia ~119): `onOpenChange(false)`
- `resetForm()` (linia ~72): resetuje wszystkie stany
- `handleSubmit` (linia ~135): async
- SheetContent (linia ~217): ma już `onInteractOutside={(e) => e.preventDefault()}` i `onEscapeKeyDown={(e) => e.preventDefault()}`
- X button (linia ~230): `onClick={handleClose}`
- Anuluj button (linia ~381): `onClick={handleClose}`
- Settery: `setFullName`, `setShortName`, `setDescription`, `setPriceNet`, `setPriceUnit`, `setCategoryId`, `setExcludeFromDiscount`, `setHasVariants`, `setVariants`
- Po udanym zapisie: `resetForm(); handleClose();` (linia ~196-197)

- [ ] **Step 1: Dodaj import hooka**

```ts
import { useUnsavedChanges, UnsavedChangesDialog } from './hooks/useUnsavedChanges';
```

- [ ] **Step 2: Inicjalizuj hook**

Po `const [saving, setSaving] = useState(false);`, dopisz:

```ts
const { markDirty, resetDirty, handleClose: handleUnsavedClose, dialogProps } = useUnsavedChanges();
```

- [ ] **Step 3: Zmień lokalny `handleClose`**

```ts
// PRZED:
const handleClose = () => {
  onOpenChange(false);
};

// PO:
const handleClose = () => {
  handleUnsavedClose(handleSubmit, () => {
    resetDirty();
    resetForm();
    onOpenChange(false);
  });
};
```

- [ ] **Step 4: Dodaj `markDirty()` do setterów w JSX**

W każdym `onChange` / `onCheckedChange` / `onValueChange` w formularzu, dopisz `markDirty()`. Przykłady:

```tsx
onChange={(e) => { setFullName(e.target.value); markDirty(); }}
onChange={(e) => { setShortName(e.target.value); markDirty(); }}
onChange={(e) => { setPriceNet(e.target.value); markDirty(); }}
onValueChange={(v) => { setPriceUnit(v as 'piece' | 'meter'); markDirty(); }}
onCheckedChange={(v) => { setExcludeFromDiscount(v === true); markDirty(); }}
// ... analogicznie dla pozostałych
```

- [ ] **Step 5: Dodaj `resetDirty()` po udanym zapisie**

Tuż przed `handleClose()` w bloku sukcesu (linia ~196-197):

```ts
resetDirty();
resetForm();
handleClose(); // handleClose już nie wywołuje guardu bo resetDirty() wyczyściło flagę
```

Uwaga: tu `handleClose()` to nasz `handleUnsavedClose` — ponieważ `isDirty` jest już false po `resetDirty()`, zamknie się natychmiast.

- [ ] **Step 6: Zaktualizuj `onInteractOutside` i `onEscapeKeyDown` w SheetContent**

Zmień istniejące z `e.preventDefault()` na:

```tsx
onInteractOutside={(e) => {
  e.preventDefault();
  handleClose();
}}
onEscapeKeyDown={(e) => {
  e.preventDefault();
  handleClose();
}}
```

- [ ] **Step 7: Renderuj `UnsavedChangesDialog`**

Przed ostatnim `</Sheet>`:

```tsx
<UnsavedChangesDialog {...dialogProps} />
```

- [ ] **Step 8: Sprawdź TypeScript i commit**

```bash
cd /Users/rafnastaly/Documents/programming/carfect/apps/carfect && npx tsc --noEmit 2>&1 | head -20
git add apps/carfect/src/components/sales/AddSalesProductDrawer.tsx
git commit -m "feat: unsaved changes guard in AddSalesProductDrawer"
```

---

## Chunk 4: AddEditRollDrawer

### Task 4: Podpięcie hooka w `AddEditRollDrawer.tsx`

**Files:**

- Modify: `apps/carfect/src/components/sales/rolls/AddEditRollDrawer.tsx`

**Kontekst:**

- `handleClose()` (linia ~261): `onOpenChange(false)`
- `resetForm()` (linia ~265): resetuje stany
- `handleSave` (linia ~74 lub podobna): async
- SheetContent (linia ~138): brak `onInteractOutside`, ma `onEscapeKeyDown={(e) => e.preventDefault()}`
- X button (linia ~148): `onClick={() => onOpenChange(false)}`
- Anuluj button (linia ~280): `onClick={() => onOpenChange(false)}`
- Settery: `setBrand`, `setProductName`, `setDescription`, `setProductCode`, `setBarcode`, `setWidthMm`, `setLengthM`, `setDeliveryDate`
- Po udanym zapisie (linia ~540-541): `resetForm(); onOpenChange(false);`

- [ ] **Step 1: Dodaj import hooka**

```ts
import { useUnsavedChanges, UnsavedChangesDialog } from '../hooks/useUnsavedChanges';
```

- [ ] **Step 2: Inicjalizuj hook**

Po `const [saving, setSaving] = useState(false);`, dopisz:

```ts
const { markDirty, resetDirty, handleClose: handleUnsavedClose, dialogProps } = useUnsavedChanges();
```

- [ ] **Step 3: Zmień `handleClose` / X / Anuluj żeby używały hooka**

Istniejący `handleClose` (linia ~261) zmień na:

```ts
const handleClose = () => {
  handleUnsavedClose(handleSave, () => {
    resetDirty();
    onOpenChange(false);
  });
};
```

X button (linia ~148) zmień z `onClick={() => onOpenChange(false)}` na `onClick={handleClose}`.
Anuluj button (linia ~280) zmień z `onClick={() => onOpenChange(false)}` na `onClick={handleClose}`.

- [ ] **Step 4: Dodaj `markDirty()` do setterów w JSX**

```tsx
onChange={(e) => { setBrand(e.target.value); markDirty(); }}
onChange={(e) => { setProductName(e.target.value); markDirty(); }}
onChange={(e) => { setDescription(e.target.value); markDirty(); }}
onChange={(e) => { setProductCode(e.target.value); markDirty(); }}
onChange={(e) => { setBarcode(e.target.value); markDirty(); }}
onChange={(e) => { setWidthMm(e.target.value ? Number(e.target.value) : ''); markDirty(); }}
onChange={(e) => { setLengthM(e.target.value ? Number(e.target.value) : ''); markDirty(); }}
onChange={(e) => { setDeliveryDate(e.target.value); markDirty(); }}
// handlePhotoSelect też warto oznaczać: po wywołaniu setPhotoFile/setPhotoPreview dopisz markDirty()
```

- [ ] **Step 5: Dodaj `resetDirty()` po udanym zapisie**

Przed `onOpenChange(false)` w bloku sukcesu (linia ~540-541):

```ts
resetDirty();
resetForm();
onOpenChange(false);
```

- [ ] **Step 6: Zaktualizuj `onInteractOutside` i `onEscapeKeyDown` w SheetContent**

Dodaj brakujący `onInteractOutside` i zaktualizuj `onEscapeKeyDown`:

```tsx
onInteractOutside={(e) => {
  e.preventDefault();
  handleClose();
}}
onEscapeKeyDown={(e) => {
  e.preventDefault();
  handleClose();
}}
```

- [ ] **Step 7: Renderuj `UnsavedChangesDialog`**

Przed ostatnim `</Sheet>`:

```tsx
<UnsavedChangesDialog {...dialogProps} />
```

- [ ] **Step 8: Sprawdź TypeScript i commit**

```bash
cd /Users/rafnastaly/Documents/programming/carfect/apps/carfect && npx tsc --noEmit 2>&1 | head -20
git add apps/carfect/src/components/sales/rolls/AddEditRollDrawer.tsx
git commit -m "feat: unsaved changes guard in AddEditRollDrawer"
```

---

## Chunk 5: AddEditSalesCustomerDrawer

### Task 5: Podpięcie hooka w `AddEditSalesCustomerDrawer.tsx`

**Files:**

- Modify: `apps/carfect/src/components/sales/AddEditSalesCustomerDrawer.tsx`

**Kontekst (ważne różnice):**

- Ten drawer ma tryby: view mode i edit mode (`editMode` state). Guard stosujemy tylko gdy `editMode === true`.
- Brak `handleClose()` — X button bezpośrednio wywołuje `onOpenChange(false)` (linia ~788).
- `handleSave` (linia ~213): async
- SheetContent (linia ~769): `modal={false}`, ma `onInteractOutside={(e) => e.preventDefault()}` i `onEscapeKeyDown={(e) => e.preventDefault()}`
- Anuluj button (linia ~833-839): złożona logika — jeśli edycja istniejącego klienta → przywraca formularz i wraca do view mode; jeśli nowy klient → zamknięcie drawera
- Wszystkie zmiany formularza przez `setForm({...form, field: value})`
- Po udanym zapisie (linia ~277): `onOpenChange(false)` — tu dodać `resetDirty()`

- [ ] **Step 1: Dodaj import hooka**

```ts
import { useUnsavedChanges, UnsavedChangesDialog } from './hooks/useUnsavedChanges';
```

- [ ] **Step 2: Inicjalizuj hook**

Po `const [saving, setSaving] = useState(false);` (ok. linia ~99), dopisz:

```ts
const { markDirty, resetDirty, handleClose: guardedClose, dialogProps } = useUnsavedChanges();
```

- [ ] **Step 3: Dodaj pomocniczą funkcję zamknięcia**

Po inicjalizacji hooka:

```ts
const handleCloseDrawer = () => {
  guardedClose(handleSave, () => {
    resetDirty();
    onOpenChange(false);
  });
};
```

- [ ] **Step 4: Dodaj `markDirty()` do wszystkich `setForm(...)` w JSX**

Znajdź każde wystąpienie `setForm({ ...form, ... })` (ok. linie 565, 574, 605, 614, 622, 660, 728, 761 i inne) i dopisz `markDirty()` wywołanie przed lub po nim:

```tsx
onChange={(e) => { setForm({ ...form, name: e.target.value }); markDirty(); }}
```

Dodaj też `markDirty()` do callbacków `AddressFields` (`onStreetChange`, `onPostalCodeChange` itp.).

- [ ] **Step 5: Dodaj `resetDirty()` przy wychodzeniu z edit mode i zamknięciu**

- Przy `setEditMode(false)` (powrót do view mode po sukcesie lub anulowaniu): dopisz `resetDirty()` przed/po
- Przy `onOpenChange(false)` w bloku sukcesu (linia ~277): dopisz `resetDirty()` przed
- Przy wejściu w edit mode dla nowego klienta (`setForm(emptyForm); setEditMode(true);`, linia ~195): `resetDirty()` — nowy pusty formularz nie jest "dirty"

- [ ] **Step 6: Zaktualizuj X button**

Zmień X button (linia ~788) z:

```tsx
onClick={() => onOpenChange(false)}
```

na:

```tsx
onClick={() => editMode ? handleCloseDrawer() : onOpenChange(false)}
```

- [ ] **Step 7: Zaktualizuj `onInteractOutside` i `onEscapeKeyDown`**

Zmień istniejące na:

```tsx
onInteractOutside={(e) => {
  e.preventDefault();
  if (editMode) {
    handleCloseDrawer();
  } else {
    onOpenChange(false);
  }
}}
onEscapeKeyDown={(e) => {
  e.preventDefault();
  if (editMode) {
    handleCloseDrawer();
  } else {
    onOpenChange(false);
  }
}}
```

- [ ] **Step 8: Zaktualizuj Anuluj button (linia ~833-839)**

Przed `onOpenChange(false)` w gałęzi `else` (nowy klient bez istniejącego):

```tsx
} else {
  resetDirty();
  onOpenChange(false);
}
```

- [ ] **Step 9: Renderuj `UnsavedChangesDialog`**

Przed ostatnim `</Sheet>`:

```tsx
<UnsavedChangesDialog {...dialogProps} />
```

- [ ] **Step 10: Sprawdź TypeScript i commit**

```bash
cd /Users/rafnastaly/Documents/programming/carfect/apps/carfect && npx tsc --noEmit 2>&1 | head -20
git add apps/carfect/src/components/sales/AddEditSalesCustomerDrawer.tsx
git commit -m "feat: unsaved changes guard in AddEditSalesCustomerDrawer"
```

---

## Chunk 6: Weryfikacja manualna

- [ ] Uruchom dev server: `pnpm --filter carfect dev`
- [ ] **AddSalesOrderDrawer:** Dodaj produkt (isDirty=true), kliknij poza → dialog z 3 opcjami. Kliknij "Kontynuuj edycję" → drawer otwarty. Kliknij poza → "Odrzuć" → drawer zamknięty.
- [ ] **AddSalesOrderDrawer:** Bez zmian, kliknij poza → zamknięcie natychmiastowe bez dialogu.
- [ ] **AddSalesProductDrawer:** Wpisz nazwę (isDirty=true), naciśnij Escape → dialog. Zapisz → zamknięcie.
- [ ] **AddEditRollDrawer:** Zmień pole, kliknij poza → dialog. "Zapisz" → zapis i zamknięcie.
- [ ] **AddEditSalesCustomerDrawer:** View mode, kliknij poza → zamknięcie bez dialogu. Wejdź w edit mode, zmień pole, kliknij poza → dialog.
