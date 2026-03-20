# Design: Adres dostawy w formularzu nowego zamówienia

**Data:** 2026-03-20
**Status:** Zatwierdzone

---

## Cel

W formularzu nowego/edytowanego zamówienia (panel sprzedaży), gdy co najmniej jedna paczka ma metodę dostawy `"shipping"`, wyświetlić rozwijany moduł z adresem dostawy. Adres domyślnie pochodzi z danych klienta, ale może być nadpisany tylko dla tego zamówienia — bez zmiany danych klienta.

---

## Decyzje projektowe

- **Przechowywanie adresu:** kolumna `shipping_address JSONB` w tabeli `sales_orders` (nullable).
- **Zmiana klienta:** adres zawsze nadpisuje się danymi nowego klienta.
- **Brak wysyłki:** gdy żadna paczka nie ma `shippingMethod === 'shipping'`, sekcja jest ukryta i `shipping_address` zapisywane jako `null`.

---

## Zakres zmian

### 1. Migracja bazy danych

Plik: `supabase/migrations/20260320200000_add_shipping_address_to_sales_orders.sql`

```sql
ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS shipping_address JSONB;
```

Struktura JSONB:

```json
{
  "country": "PL",
  "street": "ul. Przykładowa 1",
  "streetLine2": "",
  "postalCode": "00-000",
  "city": "Warszawa"
}
```

---

### 2. `AddSalesOrderDrawer.tsx`

**Nowy stan:**

```ts
const [shippingAddress, setShippingAddress] = useState<AddressData>({
  country: 'PL',
  street: '',
  streetLine2: '',
  postalCode: '',
  city: '',
});
```

**Rozszerzony fetch klienta** (istniejący `useEffect` na `selectedCustomer?.id`):

- Pobiera: `shipping_country_code`, `shipping_street`, `shipping_street_line2`, `shipping_postal_code`, `shipping_city`
- Nadpisuje `shippingAddress` przy każdej zmianie klienta

**Computed flag:**

```ts
const hasShipping = orderPackages.packages.some((p) => p.shippingMethod === 'shipping');
```

**Renderowanie** (między `PackagesSection` a `PaymentSection`):

```tsx
{
  hasShipping && <ShippingAddressSection address={shippingAddress} onChange={setShippingAddress} />;
}
```

**Payload insert/update:**

```ts
shipping_address: hasShipping ? shippingAddress : null,
```

**Reset formularza:** `setShippingAddress({ country: 'PL', street: '', streetLine2: '', postalCode: '', city: '' })`

---

### 3. `EditOrderData` (interfejs)

Dodać pole:

```ts
shippingAddress?: AddressData;
```

**Ładowanie przy edycji** (w `useEffect` na `open && editOrder`):

```ts
if (editOrder.shippingAddress) {
  setShippingAddress(editOrder.shippingAddress);
}
```

**Odczyt w `SalesOrdersView`** (gdzie budowany jest `EditOrderData`):

- Mapować `order.shipping_address` → `shippingAddress`

---

### 4. Komponenty bez zmian

- `ShippingAddressSection.tsx` — gotowy, nie wymaga modyfikacji
- `AddressFields.tsx` — gotowy, nie wymaga modyfikacji

---

## Przepływ danych

```
Wybór klienta
  → fetch sales_customers.shipping_*
  → setShippingAddress(dane klienta)

Zmiana metody dostawy paczki na "shipping"
  → hasShipping = true
  → ShippingAddressSection pojawia się (domyślnie zwinięty)

Sprzedawca rozwija sekcję
  → widzi wypełniony formularz z adresem klienta
  → może nadpisać pola

Zapis zamówienia
  → shipping_address: hasShipping ? shippingAddress : null
  → adres klienta w sales_customers NIE jest zmieniany
```

---

## Co NIE wchodzi w zakres

- Zmiana adresu klienta z poziomu tego formularza
- Walidacja adresu (wymagane pola) — opcjonalne, zgodnie z obecną konwencją
- Wielopaczkowe różne adresy dostawy
