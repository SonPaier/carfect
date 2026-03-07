

## Plan: Kategorie produktów w Sales CRM

### 1. Migracja bazy danych
Dodanie kolumny `category_id` do tabeli `sales_products` z FK do `unified_categories`:
```sql
ALTER TABLE public.sales_products 
  ADD COLUMN category_id uuid REFERENCES public.unified_categories(id) ON DELETE SET NULL;
```

### 2. SalesProductsView.tsx
- Dodać przycisk "Kategorie" obok "Dodaj produkt" (identycznie jak w ProductsView — `FolderOpen` icon)
- Zaimportować i użyć istniejącego `CategoryManagementDialog` z `serviceCounts` wyliczanym z produktów
- Rozszerzyć fetch o `category_id` i przekazywać do drawera
- Dodać kolumnę "Kategoria" w tabeli

### 3. AddSalesProductDrawer.tsx
- Dodać Select z kategoriami (pobieranymi z `unified_categories` dla danego `instanceId`) po polu "Skrócona nazwa produktu"
- Zapisywać `category_id` w payload INSERT/UPDATE
- Rozszerzyć `SalesProductData` o `categoryId`

### Pliki do edycji
- `src/components/sales/SalesProductsView.tsx` — btn Kategorie + dialog + kolumna w tabeli
- `src/components/sales/AddSalesProductDrawer.tsx` — Select kategorii w formularzu

### Reużyte komponenty
- `CategoryManagementDialog` — bez zmian, ten sam komponent co w Panel Studio

