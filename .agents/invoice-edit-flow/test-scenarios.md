# Invoice Edit Flow — Test Scenarios

Smoke tests via Playwright in demo (`http://localhost:8080/sales-crm`, admin/admin123).
Fakturownia config: `bielawyhouse.fakturownia.pl`.

Status legend: ⏳ pending · 🧪 running · ✅ passed · ❌ failed · ⏭ skipped

---

## Bugs found (running list)

| #     | Severity  | Status   | Description                                                                                                                                                                               |
| ----- | --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BUG-1 | Krytyczny | ✅ FIXED | Round-trip price ×1.23 — `mapFakturowniaToInternal` zapisywał `price_gross` jako `unit_price_gross` przy mode='netto'. Każdy save mnożył cenę. Fix: dzielenie przez `(1+vat)` w mapperze. |
| BUG-2 | Średni    | ✅ FIXED | `buyerKind` radio nie reaguje na load (zostaje "Osoba prywatna" mimo NIP). Fix: useEffect synchronizujący po `buyerTaxNo`.                                                                |
| BUG-3 | Średni    | ✅ FIXED | Sprzedawca pola puste po edit reload — reverse mapper nie czytał `seller_*` z Fakturowni. Fix: dodane mapowanie + populate w `useInvoiceForm`.                                            |

## Z. CREATE ORDER → INVOICE (full flow)

| #   | Scenariusz                                                                                        | Status |
| --- | ------------------------------------------------------------------------------------------------- | ------ |
| Z1  | Stwórz nowe zamówienie → wystaw FV z tego zamówienia → sprawdź że pozycje przeszły 1:1 do faktury | ✅     |
| Z2  | Manual brutto shipping cost (zamiast Apaczka) → wystaw FV → "Wysyłka" jako pozycja na FV          | ✅     |
| Z3  | Uber cost (manual brutto) → wystaw FV → "Uber" jako pozycja                                       | ⏳     |
| Z4  | Mix: produkty + manualna wysyłka + Uber → wszystko na FV jako osobne pozycje                      | ⏳     |

## R. RABATY — pełne pokrycie

| #   | Scenariusz                                                                                                         | Status |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------ |
| R1  | Pozycja bez rabatu (0%) → faktura nie ma kolumny "Cena netto po rabacie", `discount_percent` nie wysyłane          | ⏳     |
| R2  | Pozycja z rabatem 10% → `discount_percent: 10`, `show_discount: '1'`, `discount_kind: 'percent_unit'` w Fakturowni | ⏳     |
| R3  | Mix: pozycja z rabatem 10% + pozycja bez → tylko z-rabatowa ma `discount_percent`                                  | ⏳     |
| R4  | Rabat 100% (gratis) → wartość netto/brutto pozycji = 0                                                             | ⏳     |
| R5  | Rabat ujemny / >100 → walidacja albo Fakturownia odrzuca                                                           | ⏳     |
| R6  | Edit pozycji z rabatem (10% → 20%) → discount_percent zaktualizowany                                               | ⏳     |
| R7  | Usunięcie rabatu (10% → 0%) → discount_percent znika z payload                                                     | ⏳     |
| R8  | Toggle "ukryj/dodaj Rabat" — pokazuje/ukrywa kolumnę                                                               | ⏳     |
| R9  | Rabat w trybie netto vs brutto — przeliczenie zachowuje sens                                                       | ⏳     |
| R10 | Round-trip rabat: utwórz z 10% → edytuj → sprawdź że nadal 10% w Fakturowni (po BUG-1 fix)                         | ⏳     |
| R11 | Rabat na pozycję ze stawką VAT zw → poprawne wyliczenie (rate=0)                                                   | ⏳     |
| R12 | Edit + dodaj rabat do pozycji bez rabatu → `show_discount` aktywuje się                                            | ⏳     |

## U. JEDNOSTKI

| #   | Scenariusz                                                                                | Status |
| --- | ----------------------------------------------------------------------------------------- | ------ |
| U1  | Pozycja z `szt.` → wysłane `quantity_unit: 'szt.'`, na fakturze pokazuje "(szt.)"         | ⏳     |
| U2  | Pozycja z `m²` (m2) — sprawdza wstrzyknięcie polskiego znaku                              | ⏳     |
| U3  | Pozycja z `kg`, `l`, `h` — różne jednostki                                                | ⏳     |
| U4  | Brak jednostki → mapper wstawia default `szt.` (zamiast `(brak)`)                         | ⏳     |
| U5  | Edit pozycji — zmiana jednostki (szt. → m²) → update_invoice z nową jednostką             | ⏳     |
| U6  | Round-trip jednostki: utwórz z m², edytuj, sprawdź że nadal m² po reload (reverse mapper) | ⏳     |

## A. CREATE — różne typy faktur

| #   | Scenariusz                                                                          | Status |
| --- | ----------------------------------------------------------------------------------- | ------ |
| A1  | Faktura podstawowa: 1 pozycja, VAT 23%, szt., bez rabatu (happy path)               | ✅     |
| A2  | Mix VAT: pozycje 23% + 8% + zw — sprawdza tax mapping (`'zw'` zamiast `'disabled'`) | ⏳     |
| A3  | Różne jednostki: szt. + m² + kg — sprawdza `quantity_unit` w Fakturowni             | ⏳     |
| A4  | Rabat per pozycja: 10% + 5% — `discount_percent` + `show_discount: '1'`             | ⏳     |
| A5  | Osoba prywatna (radio "Osoba prywatna", bez NIP) — `buyer_company: '0'`             | ⏳     |
| A6  | Firma z NIP — `buyer_company: '1'` + GUS lookup                                     | ⏳     |
| A7  | Częściowo opłacona: `paid` > 0                                                      | ⏳     |
| A8  | Termin płatności "natychmiast" — `payment_to_kind: '0'`                             | ⏳     |
| A9  | Termin "1 miesiąc" — `addMonths(issueDate, 1)` zamiast `addDays(30)`                | ⏳     |
| A10 | Mechanizm podzielonej płatności (split_payment)                                     | ⏳     |
| A11 | Tryb cen brutto (toggle Netto/Brutto) — odwrotne przeliczenie                       | ⏳     |
| A12 | Dziesiętna ilość (7.62 m²) — zachowanie precyzji                                    | ⏳     |

## B. GET — wczytanie istniejącej

| #   | Scenariusz                                                                                                           | Status |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------ |
| B1  | Edycja świeżo utworzonej (z A1) — pre-load: nagłówek "Edytuj fakturę {nr}", pola wypełnione, pozycje z `external_id` | ✅     |
| B2  | KSeF badge widoczny gdy `gov_status === 'ok' \| 'processing' \| 'send_error'`                                        | ⏳     |
| B3  | 404 — faktura usunięta poza nami → graceful error w UI (toast)                                                       | ⏳     |
| B4  | Loading overlay "Wczytuję fakturę z Fakturowni…" widoczny przez < 1s                                                 | ⏳     |

## C. UPDATE — edycja

| #   | Scenariusz                                                                                        | Status |
| --- | ------------------------------------------------------------------------------------------------- | ------ |
| C1  | Zmiana `buyer_name` → save → numer faktury bez zmian, nazwa nowa                                  | ⏳     |
| C2  | Edycja ceny istniejącej pozycji (po `external_id`) → ten sam ID w Fakturowni                      | ⏳     |
| C3  | Dodanie nowej pozycji (bez `external_id`) → nowy ID w Fakturowni                                  | ⏳     |
| C4  | Usunięcie pozycji (była w `originalPositions`, brak w current) → `_destroy: 1` → pozycja zniknęła | ⏳     |
| C5  | Mix: edit istniejącą + add + remove w jednym save                                                 | ✅     |
| C6  | Zmiana ilości (z 2 na 5)                                                                          | ⏳     |
| C7  | Zmiana stawki VAT (23 → 8)                                                                        | ⏳     |
| C8  | Zmiana terminu płatności (14 → 30 dni)                                                            | ⏳     |
| C9  | Zmiana paid amount                                                                                | ⏳     |

## D. CANCEL

| #   | Scenariusz                                                                                                            | Status                         |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| D1  | Cancel issued faktury — Fakturownia odpowiada 422 "Zaleca się usunąć ostatnio wystawioną fakturę" — graceful error UX | ⚠️ działa per Fakturownia rule |
| D2  | Cancel z powodem (textarea) → `cancel_reason` zapisany                                                                | ⏳                             |
| D3  | Cancel bez powodu (puste textarea)                                                                                    | ⏳                             |
| D4  | Po cancel — dropdown pokazuje tylko "Pobierz PDF" (gating)                                                            | ⏳                             |
| D5  | Confirm dialog ma warning "Tej operacji nie można cofnąć"                                                             | ✅                             |

## E. DELETE

| #   | Scenariusz                                                                  | Status |
| --- | --------------------------------------------------------------------------- | ------ |
| E1  | Delete issued faktury — confirm → hard delete w Fakturowni i naszej DB      | ✅     |
| E2  | Confirm dialog ma warning "Tej operacji nie można cofnąć"                   | ✅     |
| E3  | Po delete — lista się odświeża, faktura znika                               | ✅     |
| E4  | Delete sent faktury → Fakturownia może odrzucić (422) → toast "zablokowana" | ⏳     |

## F. PERMISSIONS (RLS + requireAdminRole)

| #   | Scenariusz                                                            | Status                                     |
| --- | --------------------------------------------------------------------- | ------------------------------------------ |
| F1  | Admin może cancel/delete (testowane jako admin/admin123)              | ⏳                                         |
| F2  | Sales (employee) próbuje cancel/delete → 403 + toast "Brak uprawnień" | ⏳ — pomijam jeśli brak konta sales w demo |

## G. PROVIDER GATING

| #   | Scenariusz                                                             | Status                                         |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| G1  | Fakturownia → 5 akcji widocznych w dropdown                            | ⏳                                             |
| G2  | iFirma → tylko Pobierz PDF + Wyślij mailem (Edit/Cancel/Delete ukryte) | ⏭ — pomijam jeśli demo nie ma iFirma instance |

## H. STATUS GATING (per faktura)

| #   | Status      | Oczekiwane akcje                             |
| --- | ----------- | -------------------------------------------- |
| H1  | `draft`     | Edytuj, Usuń                                 |
| H2  | `issued`    | Pobierz PDF, Wyślij, Edytuj, Anuluj, Usuń    |
| H3  | `sent`      | Pobierz PDF, Wyślij ponownie, Edytuj, Anuluj |
| H4  | `paid`      | tylko Pobierz PDF                            |
| H5  | `cancelled` | tylko Pobierz PDF                            |

## I. EDGE CASES

| #   | Scenariusz                                                           | Status                                |
| --- | -------------------------------------------------------------------- | ------------------------------------- |
| I1  | Walidacje: ujemna cena, 0 ilość, brak nazwy → toast                  | ⏳                                    |
| I2  | Update faktury wysłanej — Fakturownia 422 → toast "zablokowana"      | ⏳                                    |
| I3  | Pobranie PDF — proxy działa, plik się ściąga                         | ⏳                                    |
| I4  | Stale data: faktura z innego konta Fakturowni → 404 → graceful error | ✅ (potwierdzone przy starcie testów) |

## J. SUMS / FORMATY

| #   | Scenariusz                                                 | Status |
| --- | ---------------------------------------------------------- | ------ |
| J1  | Sumy zgadzają się 1:1 z Fakturownia preview po wystawieniu | ⏳     |
| J2  | Wszystkie kwoty: spacje + przecinek (`10 000,00`)          | ⏳     |
| J3  | Słownie "osiem tysięcy…" w `InvoiceSummaryTable`           | ⏳     |

## K. UX

| #   | Scenariusz                                       | Status                      |
| --- | ------------------------------------------------ | --------------------------- |
| K1  | Drawer 1400px width                              | ✅ (potwierdzone wcześniej) |
| K2  | Gap 100px Sprzedawca/Nabywca                     | ✅                          |
| K3  | Header "Edytuj fakturę {nr}" w trybie edit       | ⏳                          |
| K4  | Loading overlay "Wczytuję fakturę z Fakturowni…" | ⏳                          |
| K5  | Submit button disabled podczas `loadingExisting` | ⏳                          |

---

## Plan wykonania

Idę przez priorytety:

**Round 1 — happy paths (creates):**

1. A1 (podstawowa) — utwórz, sprawdź sumy, sprawdź list
2. A4 + A12 (rabat + dziesiętna ilość) — w jednej fakturze
3. A2 (różne VAT) — w jednej fakturze
4. A8 + A9 (terminy: natychmiast i 1 miesiąc) — w 2 fakturach lub 1
5. A10 (split payment)

**Round 2 — edit:** 6. C5 (mix edit/add/remove na fakturze z A1) → C2 + C3 + C4 razem

**Round 3 — destrukcyjne:** 7. D1 + D2 + D5 (cancel z powodem + warning) 8. E1 + E2 + E3 (delete)

**Round 4 — gating:** 9. H1-H5 (po D i E mam faktury w różnych statusach) 10. G1 (full set fakturownia)

**Round 5 — pomocnicze:** 11. K3, K4, K5 (UX overlay/header) 12. I3 (PDF proxy)

Pomijam:

- F2 (sales role) — brak konta w demo, F1 pokryte przez admin
- G2 (iFirma) — wymaga osobnego konta
- I2 (update sent) — destruktywne dla wysłanej faktury, pominę chyba że jest osobna testowa

---

## Cleanup po testach

Po wszystkich testach usuwam testowe faktury z Fakturowni (delete via UI) żeby nie zaśmiecać konta `bielawyhouse`. Te które zostały skasowane testem D/E już zniknęły.
