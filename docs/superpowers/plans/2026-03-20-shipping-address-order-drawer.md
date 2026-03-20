# Shipping Address in Order Drawer — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pokazać rozwijany moduł adresu dostawy w formularzu zamówienia, gdy co najmniej jedna paczka ma metodę dostawy `"shipping"`, z domyślnym adresem klienta nadpisywalnym per-zamówienie.

**Architecture:** Nowa kolumna JSONB `shipping_address` w `sales_orders`. Stan w `AddSalesOrderDrawer` zasilany z `sales_customers`, renderowany przez gotowy `ShippingAddressSection`. `SalesOrdersView` mapuje kolumnę przy budowaniu `editOrder`.

**Tech Stack:** React 19, TypeScript, Supabase, Tailwind CSS, shadcn/ui

---

## Chunk 1: Migracja bazy danych

### Task 1: Dodaj kolumnę `shipping_address` do `sales_orders`

**Files:**

- Create: `supabase/migrations/20260320200000_add_shipping_address_to_sales_orders.sql`

- [ ] **Step 1: Utwórz plik migracji**

```sql
ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS shipping_address JSONB;
```

Zapisz do `supabase/migrations/20260320200000_add_shipping_address_to_sales_orders.sql`.

- [ ] **Step 2: Zastosuj migrację lokalnie**

```bash
cd /Users/rafnastaly/Documents/programming/carfect
pnpm supabase db push
```

Oczekiwane: brak błędów, kolumna dodana.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260320200000_add_shipping_address_to_sales_orders.sql
git commit -m "feat: add shipping_address JSONB column to sales_orders"
```

---

## Chunk 2: Podpięcie w `AddSalesOrderDrawer.tsx`

### Task 2: Stan, fetch klienta, warunek wyświetlania, zapis, reset

**Files:**

- Modify: `apps/carfect/src/components/sales/AddSalesOrderDrawer.tsx`

**Kontekst kodu:** Plik ma ~693 linie. Kluczowe miejsca:

- linia 14-37: importy
- linia 44-58: interfejs `EditOrderData`
- linia 94-107: lokalne stany
- linia 158-177: `useEffect` fetcha adresu klienta (obecnie tylko `postalCode` + `city`)
- linia 233-244: funkcja `resetForm`
- linia 309-344: payload `update` (edycja)
- linia 401-428: payload `insert` (nowe zamówienie)
- linia 561-597: JSX — `PackagesSection` → `PaymentSection`

- [ ] **Step 1: Dodaj import `ShippingAddressSection` i `AddressData`**

W bloku importów (ok. linia 34-37), dopisz:

```ts
import { ShippingAddressSection } from './order-drawer/ShippingAddressSection';
import { type AddressData } from './order-drawer/AddressFields';
```

- [ ] **Step 2: Rozszerz interfejs `EditOrderData`**

W interfejsie `EditOrderData` (linia ~44-58), dopisz pole:

```ts
shippingAddress?: AddressData;
```

- [ ] **Step 3: Dodaj stan `shippingAddress`**

Po linii ~103 (`const [attachments, ...`), dopisz:

```ts
const [shippingAddress, setShippingAddress] = useState<AddressData>({
  country: 'PL',
  street: '',
  streetLine2: '',
  postalCode: '',
  city: '',
});
```

- [ ] **Step 4: Rozszerz `useEffect` fetcha adresu klienta**

Zastąp istniejący `useEffect` (linia ~158-177) rozszerzonym:

```ts
useEffect(() => {
  if (!customerSearch.selectedCustomer?.id) {
    setCustomerAddress({ postalCode: '', city: '' });
    setShippingAddress({ country: 'PL', street: '', streetLine2: '', postalCode: '', city: '' });
    return;
  }
  supabase
    .from('sales_customers')
    .select(
      'shipping_postal_code, shipping_city, shipping_country_code, shipping_street, shipping_street_line2',
    )
    .eq('id', customerSearch.selectedCustomer.id)
    .single()
    .then(({ data }: any) => {
      if (data) {
        setCustomerAddress({
          postalCode: data.shipping_postal_code || '',
          city: data.shipping_city || '',
        });
        setShippingAddress({
          country: data.shipping_country_code || 'PL',
          street: data.shipping_street || '',
          streetLine2: data.shipping_street_line2 || '',
          postalCode: data.shipping_postal_code || '',
          city: data.shipping_city || '',
        });
      }
    });
}, [customerSearch.selectedCustomer?.id]);
```

- [ ] **Step 5: Dodaj computed flag `hasShipping` i ładowanie adresu w trybie edycji**

Tuż po `useEffect` z `nextOrderNumber` (ok. linia ~184), dopisz computed:

```ts
const hasShipping = orderPackages.packages.some((p) => p.shippingMethod === 'shipping');
```

W istniejącym `useEffect` na `open && editOrder` (linia ~116-149), po linii `setAttachments(editOrder.attachments || []);` dopisz:

```ts
if (editOrder.shippingAddress) {
  setShippingAddress(editOrder.shippingAddress);
}
```

- [ ] **Step 6: Rozszerz `resetForm`**

W funkcji `resetForm` (linia ~233), dopisz:

```ts
setShippingAddress({ country: 'PL', street: '', streetLine2: '', postalCode: '', city: '' });
```

- [ ] **Step 7: Dodaj `shipping_address` do payloadu UPDATE**

W obiekcie `.update({...})` (linia ~327-344), dopisz:

```ts
shipping_address: hasShipping ? shippingAddress : null,
```

- [ ] **Step 8: Dodaj `shipping_address` do payloadu INSERT**

W obiekcie `.insert({...})` (linia ~404-427), dopisz:

```ts
shipping_address: hasShipping ? shippingAddress : null,
```

- [ ] **Step 9: Dodaj `ShippingAddressSection` w JSX**

Między `<PackagesSection ... />` (kończy się ok. linia ~589) a `<PaymentSection ... />` (ok. linia ~591), wstaw:

```tsx
{
  hasShipping && <ShippingAddressSection address={shippingAddress} onChange={setShippingAddress} />;
}
```

- [ ] **Step 10: Sprawdź TypeScript**

```bash
cd /Users/rafnastaly/Documents/programming/carfect
pnpm --filter carfect tsc --noEmit
```

Oczekiwane: brak błędów.

- [ ] **Step 11: Commit**

```bash
git add apps/carfect/src/components/sales/AddSalesOrderDrawer.tsx
git commit -m "feat: wire ShippingAddressSection into order drawer"
```

---

## Chunk 3: Mapowanie adresu przy edycji zamówienia

### Task 3: Zaktualizuj `SalesOrdersView.tsx` — budowanie `editOrder`

**Files:**

- Modify: `apps/carfect/src/components/sales/SalesOrdersView.tsx` (linia ~422-436)

- [ ] **Step 1: Rozszerz SELECT w fetchu zamówienia**

W zapytaniu `.select(...)` (linia ~316-317), dodaj `shipping_address` do listy pól:

```ts
'delivery_type, payment_method, bank_account_number, comment, customer_id, customer_name, packages, attachments, shipping_address',
```

- [ ] **Step 2: Dodaj `shippingAddress` do `setEditOrder`**

W obiekcie przekazywanym do `setEditOrder` (linia ~422-436), dopisz:

```ts
shippingAddress: orderData?.shipping_address
  ? (orderData.shipping_address as AddressData)
  : undefined,
```

- [ ] **Step 3: Dodaj import `AddressData`**

Na górze pliku, dodaj import:

```ts
import { type AddressData } from './order-drawer/AddressFields';
```

- [ ] **Step 4: Sprawdź TypeScript**

```bash
pnpm --filter carfect tsc --noEmit
```

Oczekiwane: brak błędów.

- [ ] **Step 5: Commit**

```bash
git add apps/carfect/src/components/sales/SalesOrdersView.tsx
git commit -m "feat: map shipping_address from DB to editOrder"
```

---

## Chunk 4: Weryfikacja manualna

- [ ] Uruchom dev server: `pnpm --filter carfect dev`
- [ ] Utwórz nowe zamówienie — klient z adresem wysyłki, paczka z metodą "wysyłka" → sekcja adresu powinna się pojawić, domyślnie zwinięta, z danymi klienta
- [ ] Zmień metodę paczki na "odbiór" → sekcja znika
- [ ] Nadpisz adres, zapisz zamówienie → sprawdź w Supabase, że `shipping_address` jest zapisany
- [ ] Edytuj zamówienie → adres powinien się załadować z bazy
- [ ] Zmień klienta w formularzu → adres powinien się nadpisać danymi nowego klienta
