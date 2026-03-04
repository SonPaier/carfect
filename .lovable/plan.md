

## Plan: Oczyszczenie mock danych i logika zamówień Sales CRM

### 1. Usunięcie mock danych

**`src/data/salesMockData.ts`** — wyczyścić `mockSalesOrders` do pustej tablicy `[]`, zachować interfejsy.

**`src/components/sales/SalesOrdersView.tsx`** — zamiast `useState(mockSalesOrders)` → `useState<SalesOrder[]>([])`. Usunąć import `mockSalesOrders`.

**`src/components/sales/AddSalesOrderDrawer.tsx`** — usunąć `mockCustomers` i `mockProducts` (linie 32-58). Zastąpić pustymi tablicami `[]` na razie (docelowo będą z bazy).

**`src/components/sales/SalesCustomersView.tsx`** — usunąć `mockCustomers` i `caretakers`, użyć pustej tablicy.

**`src/components/sales/SalesProductsView.tsx`** — usunąć `generateMockProducts`, użyć pustej tablicy.

### 2. Nr zamówienia: format `[nr_w_miesiacu]/[MM]/[YY]`

W `SalesOrdersView` i `AddSalesOrderDrawer` — dodać helper `getNextOrderNumber()` który na razie zwraca `1/MM/YYYY` (bo nie ma danych z bazy). Docelowo będzie liczony z bazy.

W `AddSalesOrderDrawer` — tytuł drawera: `Dodaj zamówienie: {nextOrderNumber}`.

### 3. Sortowanie kolumn w tabeli zamówień

Dodać stan `sortColumn` i `sortDirection` do `SalesOrdersView`. Kolumny sortowalne: Nr, Klient, Data utw., Status, Kwota netto. Nr listu przewozowego — niesortowalna.

Ikona strzałki (ArrowUpDown / ArrowUp / ArrowDown) wyświetlana **tylko** na aktywnie sortowanej kolumnie. Pozostałe kolumny klikalne ale bez ikony. Domyślne sortowanie: po numerze zamówienia malejąco.

Nagłówki kolumn jako `<button>` z `onClick` do zmiany sortowania.

### 4. Rozszerzenie wyszukiwania

Placeholder: `"Szukaj po firmie, mieście, osobie, produkcie..."`.

Filtrowanie po: `customerName`, `orderNumber`, `city` (nowe pole w `SalesOrder`), `contactPerson` (nowe pole), oraz `products[].name`. Na razie pola `city`/`contactPerson` dodamy do interfejsu `SalesOrder` jako opcjonalne — będą wypełniane z bazy.

### 5. Rabat na poziomie klienta (nie zamówienia)

W `AddSalesOrderDrawer`:
- Usunąć obecny blok rabatu (percent/amount toggle + input, linie 331-366)
- Zamiast tego: jeśli `selectedCustomer` ma `discountPercent > 0`, wyświetlić info `Rabat: X%` z toggle `Switch` "Zastosuj rabat" (domyślnie włączony)
- Dodać pole `discountPercent` do interfejsu klienta
- Obliczenia: jeśli toggle włączony i klient ma rabat → rabat procentowy od subtotal

### Pliki do zmiany
- `src/data/salesMockData.ts` — wyczyścić mock, zachować typy
- `src/components/sales/SalesOrdersView.tsx` — puste dane, sortowanie, rozszerzony search
- `src/components/sales/AddSalesOrderDrawer.tsx` — puste dane, nr zamówienia w tytule, rabat z klienta + toggle
- `src/components/sales/SalesCustomersView.tsx` — puste dane
- `src/components/sales/SalesProductsView.tsx` — puste dane

