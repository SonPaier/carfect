# Fakturownia API — szybka referencja

Source: https://github.com/fakturownia/api#invoices (oficjalna dokumentacja).

**Kanonicznym źródłem prawdy jest GitHub repo Fakturowni.** Ten plik to wyciąg z polami,
których faktycznie używamy w `supabase/functions/invoicing-api/index.ts`. Przy
422 / "Nieprawidłowy atrybut" — zawsze najpierw sprawdź docs, nie zgaduj.

## Endpoint

`POST https://{domain}.fakturownia.pl/invoices.json`

Body: `{ api_token, invoice: {...} }` (api_token w body lub jako query param).

## Pola faktury (te, które używamy lub mogą się przydać)

### Meta

- `kind` — `vat | proforma | bill | receipt | advance | correction | vat_mp | invoice_other | vat_margin | kp | kw | final | estimate`
- `number` — numer faktury (null = auto)
- `income` — `1` przychodowa, `0` kosztowa
- `issue_date`, `sell_date`, `payment_to` (YYYY-MM-DD)
- `payment_to_kind` — liczba dni, `"off"`, lub `"other_date"` (wtedy `payment_to` ustawia datę)
- `payment_type` — `transfer | card | cash | cod | ...`
- `place` — miejsce wystawienia
- `currency` — domyślnie `PLN`
- `lang` — domyślnie `pl`
- `oid` — numer zamówienia z zewn. systemu
- `oid_unique: "yes"` — blokuje duplikaty po OID

### Sprzedawca (seller\_\*)

- `seller_name`, `seller_tax_no`, `seller_email`
- `seller_post_code`, `seller_city`, `seller_street`, `seller_country` (ISO 3166)
- **`seller_bank_account`** — numer konta sprzedawcy (string IBAN). **NIE** `bank_account`, **NIE** `account_number`.
- `seller_bank` — nazwa banku
- `seller_person` — imię i nazwisko wystawcy
- `department_id` — id działu firmy (alternatywnie do `seller_*`); jeśli brak `department_id` i `seller_name` — wstawione zostaną domyślne dane firmy z konta

### Nabywca (buyer\_\*)

- `buyer_name`, `buyer_tax_no`, `buyer_email`
- `buyer_post_code`, `buyer_city`, `buyer_street`, `buyer_country` (ISO 3166)
- `buyer_company` — `1` jeśli firma
- `buyer_person` — imię i nazwisko odbiorcy (pusty string = brak podpisu)
- `client_id` — id klienta w Fakturowni (`-1` = utwórz nowego)

### Pozycje (`positions[]`)

- `name` (wymagane)
- `quantity`, `quantity_unit` (np. `"szt"`)
- `price_net` lub `price_gross` lub `total_price_net` lub `total_price_gross` (jedno wystarczy, reszta wyliczona)
- **`tax`** — stawka VAT jako string: `"23"`, `"8"`, `"5"`, `"0"`, `"zw"` (zwolnione), `"np"` (nie podlega), `"oo"` (odwrotne obciążenie), `"disabled"` (nie wyświetlaj VAT na pozycji)
- `discount_percent` lub `discount` (kwotowo) — wymaga `show_discount: 1` na fakturze i odpowiedniego ustawienia w koncie ("Jak obliczać rabat")
- `code`, `gtu_code`, `additional_info`, `description`

### Rabaty

- `show_discount: "1"` — włącz wyświetlanie rabatu
- `discount_kind: "percent_unit"` (procentowo na pozycję) lub `"amount"` itd.

### Inne przydatne

- `split_payment: "1"` — split payment
- `use_oss: "1"` — sprzedaż OSS (zastępuje `use_moss`)
- `exchange_currency`, `exchange_kind` (`ecb | nbp | own | ...`), `exchange_currency_rate`
- `description` (uwagi), `description_footer` (stopka), `description_long` (odwrót)
- `internal_note` — notatka prywatna (nie na wydruku)
- `reverse_charge: true` — odwrotne obciążenie (wymusza `tax: "oo"` lub `"np"` w pozycjach zależnie od `buyer_country`)

## Powiązane endpointy (server-side, nie z przeglądarki — CORS!)

- `POST /invoices/{id}/send_by_email.json` — wyślij fakturę mailem
- `GET /invoices/{id}.pdf?api_token=...` — PDF
- `GET /invoices.json?period=last_5&page=1&per_page=1&api_token=...` — test połączenia
- `POST /webhooks.json` — rejestracja webhooka (wymaga `api_token` w body)

## Konwencja błędów

`422 Unprocessable Entity` z body:

```json
{ "code": "error", "message": "Nieprawidłowy atrybut: 'nazwa_pola'" }
```

→ pole nie istnieje albo zła nazwa. **Sprawdź docs, nie zgaduj.**

## Pułapki, na które się już naciąłem

1. **Browser → fakturownia.pl = CORS zawsze.** Wszystko przez edge function `invoicing-api`. Direct fetch z `FakturowniaConfigForm` nie działa, nawet jak ktoś tak commituje "matching HiService pattern" (commit 87bb8362).
2. **`bank_account` ≠ `seller_bank_account`.** Pierwsze nie istnieje na invoice, jest tylko na client. Drugie — działa.

## Endpoint Products (`POST /products.json`)

Pola produktu (do tworzenia/edycji w katalogu produktów Fakturowni):

### Identyfikacja

- `name` — nazwa
- `code` — kod produktu (SKU)
- `ean_code` — kod EAN
- `description` — opis
- `additional_info` — PKWiU
- `supplier_code` — kod u dostawcy
- `accounting_id` — kod księgowy (sprzedaż)
- `category_id` — id kategorii
- `tag_list` — `["tag1", "tag2"]`

### Cena & VAT

- `price_net`, `price_gross`, `currency` (np. `"PLN"`)
- `tax` — `"23"`, `"5"`, `"17"`, `"np"`, `"zw"`, `"disabled"` (nie wyświetlaj)
- `purchase_price_net`, `purchase_price_gross`, `purchase_tax` — ceny zakupu

### Magazyn

- `quantity_unit` — np. `"szt"`
- `quantity` — domyślnie sprzedawana ilość
- `limited` — `"1" | "0"` ograniczenie magazynowe
- `stock_level` — dostępna ilość
- `package` — `"1" | "0"` zestaw
- `use_product_warehouses` — `"1" | "0"` osobne ceny dla magazynów

### Klasyfikacja

- `service` — `"1" | "0"` usługa
- `electronic_service` — `"1" | "0"` usługa elektroniczna
- `gtu_codes` — `["GTU_01"]`
- `use_moss` — `"1" | "0"` OSS

### Wymiary i waga

- `size`, `size_width`, `size_height`, `size_unit` (`"m" | "cm"`)
- `weight`, `weight_unit` (`"kg" | "g"`)

### Inne

- `disabled` — `"1" | "0"` nieaktywny

## Wartości stawki `tax` (wspólne dla pozycji faktury i produktu)

| Wartość                          | Znaczenie                     |
| -------------------------------- | ----------------------------- |
| `"23"`, `"8"`, `"5"`, `"0"` itd. | konkretna stawka procentowa   |
| `"zw"`                           | zwolnione z VAT               |
| `"np"`                           | nie podlega                   |
| `"oo"`                           | odwrotne obciążenie           |
| `"disabled"`                     | nie wyświetlaj VAT na pozycji |
