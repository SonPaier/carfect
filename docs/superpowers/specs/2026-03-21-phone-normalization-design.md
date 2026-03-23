# Phone Normalization & Customer Deduplication

## Problem

Customer phones are stored in inconsistent formats (`733854184`, `48733854184`, `+48733854184`). This causes:

- 13 duplicate customer pairs in armcar (same person, different phone format)
- Vehicles "disappearing" — saved under one format, queried with another
- 6 different query strategies across the codebase (exact match, OR variants, ILIKE wildcard)

## Decision: E.164 format (`+48XXXXXXXXX`)

All phone numbers stored as E.164 with `+` prefix. Reasons:

- `normalizePhone()` in `@shared/utils` already returns this format
- Works for international numbers (`+49...`, `+420...`)
- International standard, unambiguous

## Changes

### 1. DB trigger: `normalize_phone_trigger`

**Tables:** `customers`, `customer_vehicles`, `reservations`, `customer_reminders`, `offer_reminders`, `followup_events`, `followup_tasks`, `yard_vehicles`

**Logic:**

```
strip all non-digits →
if 9 digits: prepend +48 (Polish) →
if starts with 00: replace with + →
if starts with digits (no +): prepend + →
result: +CCXXXXXXXXX
```

Trigger fires `BEFORE INSERT OR UPDATE` on the phone column. This guarantees consistency regardless of input source.

### 2. Migration: normalize existing data

Single UPDATE per table — apply same normalization logic to all existing records.

### 3. Migration: merge 13 duplicate customers in armcar

Strategy per pair (already analyzed):

- **Keep** the customer that has reminders; if tie, the one with reservations; if tie, newer
- **Before delete**: update `customer_phone` in all 6 related tables from loser's phone to winner's normalized phone
- **Before delete**: reassign `customer_vehicles.customer_id` from loser to winner
- **Delete** the loser customer (CASCADE handles `customer_vehicles` rows that weren't reassigned)
- Skip PUDEL/Karolina-Tesciowa pair (test data with phone `0000000`)

Merge pairs (analyzed from DB):
| Keep | Delete | Reason |
|------|--------|--------|
| Audi Q5 (48508070107) | Pawel Grabowski (+48508070107) | has 3 reminders |
| Anna Fedorenko (+48510409755) | 510409755 | has 2 reservations |
| Skoda Superb (48531877071) | Krystian Grabinski (+48531877071) | has 1 reminder |
| Marcin Orciuch (+48534206814) | 534206814 | has 3 reservations |
| Paulina Plichacja (+48601183444) | Paulina (601183444) | has 2 reservations |
| Mercedes CLA (48601556097) | 601556097 (+48601556097) | has 3 reminders |
| Porsche Cayenne (48606885703) | LESZEK SIERDZINSKI (+48606885703) | has 2 reminders |
| Kacper Wiczlinski (+48665399795) | Kacper (665399795) | has 5 reservations |
| 668394986 (+48668394986) | MICHAL. (668394986) | has 1 reservation |
| Krzysztof Szawdynski (+48724900823) | Krzysztof Szawdynski (48724900823) | has 2 rez + 2 rem |
| BMW Seria 3 (48784590065) | Slawek Kusmiesz (+48784590065) | has 2 reminders |
| Robert (48790023609) | 790023609 (+48790023609) | newer |

After normalization trigger runs, all phones become E.164 — winner gets the canonical format.

### 4. Unique constraint on `customers`

```sql
ALTER TABLE customers ADD CONSTRAINT customers_instance_phone_unique
  UNIQUE (instance_id, phone);
```

Applied AFTER merge migration so there are no conflicts.

### 5. Frontend: simplify all vehicle queries

**Before (6 different strategies):**

- CustomersView: fetch all, match with manual strip logic
- CustomerEditDrawer: exact match with normalizePhone
- AddCustomerReminderDialog: OR two phone variants
- CustomerSection: try customer_id, fallback ILIKE phone
- AddReservationDialogV2: OR three phone formats + customer_id

**After (one strategy):**

```ts
const phone = normalizePhone(customerPhone);
supabase.from('customer_vehicles').select('...').eq('phone', phone);
```

All queries use `eq('phone', normalizedPhone)` — trigger guarantees format matches.

### 6. Frontend: phone uniqueness validation

When creating or editing a customer, before save:

```ts
const { data } = await supabase
  .from('customers')
  .select('id')
  .eq('instance_id', instanceId)
  .eq('phone', normalizePhone(phone))
  .neq('id', customerId) // exclude self when editing
  .maybeSingle();

if (data) → show error "Klient z tym numerem już istnieje"
```

### 7. RPC `upsert_customer_vehicle`

Remove the `regexp_replace(_phone, '^\+', '')` line — trigger handles normalization now.

### 8. Vehicle upsert: await instead of fire-and-forget

In `AddReservationDialogV2`, change the vehicle upsert from fire-and-forget to awaited, so the vehicle is visible immediately after adding.

### 9. CustomerEditDrawer: vehicle chips always visible

Show `VehicleChip` components (with X to delete) in both view and edit mode, not just edit mode. Load vehicles on drawer open, not only when entering edit.

### 10. Phone edit cascades to vehicles

When a customer's phone changes in `CustomerEditDrawer`, update `phone` in their `customer_vehicles` rows too:

```sql
UPDATE customer_vehicles SET phone = new_phone WHERE customer_id = ? AND instance_id = ?
```

## Out of scope

- Changing `customer_vehicles` schema (columns stay the same)
- Changing how edge functions work (they already normalize on output)
- Merging vehicles across customers (vehicles are not shared)
