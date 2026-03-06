

## Plan: Ujednolicenie stylów drawerów Sales CRM

### Problem
Drawery w Panel Studio (np. `AddReservationDialogV2`) mają spójne style: białe tło, ciemne obramowania inputów/textarea/selectów. Drawery w Sales CRM tego nie mają.

### Styl referencyjny (Panel Studio)
```
bg-white [&_input]:border-foreground/60 [&_textarea]:border-foreground/60 [&_select]:border-foreground/60
```

### Zmiany — dodanie tych samych klas do className w SheetContent

4 pliki do edycji:

1. **`src/components/sales/AddSalesOrderDrawer.tsx`** (linia ~404)
   - Dodać `bg-white [&_input]:border-foreground/60 [&_textarea]:border-foreground/60 [&_select]:border-foreground/60` do className SheetContent

2. **`src/components/sales/AddSalesProductDrawer.tsx`** (linia ~121)
   - Dodać te same klasy do className SheetContent

3. **`src/components/sales/AddEditSalesCustomerDrawer.tsx`** (linia ~398)
   - Dodać te same klasy do className SheetContent
   - Zmienić `bg-background` w footer (linia ~429) na `bg-white`

4. **`src/components/sales/SalesProductSelectionDrawer.tsx`** (linia ~113)
   - Dodać te same klasy do className SheetContent

Każda zmiana to dodanie jednej linijki klas CSS — bez zmian w logice ani strukturze.

