# Phone Normalization & Customer Deduplication Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all phone numbers to E.164 format (`+48XXXXXXXXX`), merge 13 duplicate customers in armcar, add unique constraint, and simplify all vehicle queries to use one format.

**Architecture:** DB trigger normalizes phones on write. Migration fixes existing data and merges duplicates. Frontend simplified to single `eq('phone', normalizePhone(x))` pattern everywhere.

**Tech Stack:** PostgreSQL triggers, Supabase migrations, React/TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-03-21-phone-normalization-design.md`

---

## Task 1: DB trigger — normalize_phone function + trigger

**Files:**

- Create: `supabase/migrations/20260324000000_normalize_phones.sql`

- [ ] **Step 1: Create migration file with normalization function**

```sql
-- Function: normalize any phone input to E.164 format
CREATE OR REPLACE FUNCTION public.normalize_phone_number(phone text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  digits text;
BEGIN
  IF phone IS NULL OR phone = '' THEN RETURN phone; END IF;

  -- Strip everything except digits
  digits := regexp_replace(phone, '[^0-9]', '', 'g');

  -- Remove leading 00 (international dialing prefix)
  digits := regexp_replace(digits, '^00', '');

  -- Polish 9-digit number: prepend 48
  IF length(digits) = 9 AND digits NOT LIKE '0%' THEN
    digits := '48' || digits;
  END IF;

  -- Return with + prefix
  RETURN '+' || digits;
END;
$$;

-- Trigger function for customers
CREATE OR REPLACE FUNCTION public.trigger_normalize_customer_phone()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone := normalize_phone_number(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for tables with customer_phone column
CREATE OR REPLACE FUNCTION public.trigger_normalize_customer_phone_col()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '' THEN
    NEW.customer_phone := normalize_phone_number(NEW.customer_phone);
  END IF;
  RETURN NEW;
END;
$$;

-- Apply triggers
CREATE TRIGGER normalize_phone_customers
  BEFORE INSERT OR UPDATE OF phone ON customers
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone();

CREATE TRIGGER normalize_phone_customer_vehicles
  BEFORE INSERT OR UPDATE OF phone ON customer_vehicles
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone();

CREATE TRIGGER normalize_phone_reservations
  BEFORE INSERT OR UPDATE OF customer_phone ON reservations
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();

CREATE TRIGGER normalize_phone_customer_reminders
  BEFORE INSERT OR UPDATE OF customer_phone ON customer_reminders
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();

CREATE TRIGGER normalize_phone_offer_reminders
  BEFORE INSERT OR UPDATE OF customer_phone ON offer_reminders
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();

CREATE TRIGGER normalize_phone_followup_events
  BEFORE INSERT OR UPDATE OF customer_phone ON followup_events
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();

CREATE TRIGGER normalize_phone_followup_tasks
  BEFORE INSERT OR UPDATE OF customer_phone ON followup_tasks
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();

CREATE TRIGGER normalize_phone_yard_vehicles
  BEFORE INSERT OR UPDATE OF customer_phone ON yard_vehicles
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();
```

- [ ] **Step 2: Push migration**

```bash
supabase db push
```

- [ ] **Step 3: Verify trigger works**

```bash
npx supabase db query "SELECT normalize_phone_number('733854184')" --linked
# Expected: +48733854184

npx supabase db query "SELECT normalize_phone_number('+48733854184')" --linked
# Expected: +48733854184

npx supabase db query "SELECT normalize_phone_number('0048733854184')" --linked
# Expected: +48733854184

npx supabase db query "SELECT normalize_phone_number('48733854184')" --linked
# Expected: +48733854184

npx supabase db query "SELECT normalize_phone_number('+49171123456')" --linked
# Expected: +49171123456
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260324000000_normalize_phones.sql
git commit -m "feat: add phone normalization trigger for E.164 format"
```

---

## Task 2: Migration — normalize existing data

**Files:**

- Create: `supabase/migrations/20260324100000_normalize_existing_phones.sql`

- [ ] **Step 1: Create migration to normalize all existing phone data**

```sql
-- Normalize all existing phone columns
UPDATE customers SET phone = normalize_phone_number(phone)
  WHERE phone IS NOT NULL AND phone != '' AND phone != normalize_phone_number(phone);

UPDATE customer_vehicles SET phone = normalize_phone_number(phone)
  WHERE phone IS NOT NULL AND phone != '' AND phone != normalize_phone_number(phone);

UPDATE reservations SET customer_phone = normalize_phone_number(customer_phone)
  WHERE customer_phone IS NOT NULL AND customer_phone != '' AND customer_phone != normalize_phone_number(customer_phone);

UPDATE customer_reminders SET customer_phone = normalize_phone_number(customer_phone)
  WHERE customer_phone IS NOT NULL AND customer_phone != '' AND customer_phone != normalize_phone_number(customer_phone);

UPDATE offer_reminders SET customer_phone = normalize_phone_number(customer_phone)
  WHERE customer_phone IS NOT NULL AND customer_phone != '' AND customer_phone != normalize_phone_number(customer_phone);

UPDATE followup_events SET customer_phone = normalize_phone_number(customer_phone)
  WHERE customer_phone IS NOT NULL AND customer_phone != '' AND customer_phone != normalize_phone_number(customer_phone);

UPDATE followup_tasks SET customer_phone = normalize_phone_number(customer_phone)
  WHERE customer_phone IS NOT NULL AND customer_phone != '' AND customer_phone != normalize_phone_number(customer_phone);

UPDATE yard_vehicles SET customer_phone = normalize_phone_number(customer_phone)
  WHERE customer_phone IS NOT NULL AND customer_phone != '' AND customer_phone != normalize_phone_number(customer_phone);
```

- [ ] **Step 2: Push migration**

```bash
supabase db push
```

- [ ] **Step 3: Verify normalization**

```bash
npx supabase db query "
  SELECT phone, count(*) FROM customers
  WHERE instance_id = '4ce15650-76c7-47e7-b5c8-32b9a2d1c321'
    AND phone NOT LIKE '+%'
  GROUP BY phone
" --linked
# Expected: 0 rows (all phones start with +)
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260324100000_normalize_existing_phones.sql
git commit -m "feat: normalize all existing phone data to E.164"
```

---

## Task 3: Migration — merge duplicate customers in armcar

**Files:**

- Create: `supabase/migrations/20260324200000_merge_duplicate_customers_armcar.sql`

- [ ] **Step 1: Create merge migration**

After Task 2 normalization, duplicates will have the same phone. Merge strategy: keep the one with more reminders, then more reservations, then newer.

```sql
DO $$
DECLARE
  _instance_id uuid := '4ce15650-76c7-47e7-b5c8-32b9a2d1c321';
  _dup RECORD;
BEGIN
  -- Find duplicates: same instance + same normalized phone, keep the one with
  -- more reminders, then reservations, then newer created_at
  FOR _dup IN
    WITH ranked AS (
      SELECT
        c.id,
        c.phone,
        c.name,
        c.created_at,
        (SELECT count(*) FROM customer_reminders cr
         WHERE cr.customer_phone = c.phone AND cr.instance_id = _instance_id) as rem_count,
        (SELECT count(*) FROM reservations r
         WHERE r.customer_phone = c.phone AND r.instance_id = _instance_id) as res_count,
        ROW_NUMBER() OVER (
          PARTITION BY c.phone
          ORDER BY
            (SELECT count(*) FROM customer_reminders cr
             WHERE cr.customer_phone = c.phone AND cr.instance_id = _instance_id) DESC,
            (SELECT count(*) FROM reservations r
             WHERE r.customer_phone = c.phone AND r.instance_id = _instance_id) DESC,
            c.created_at DESC
        ) as rn
      FROM customers c
      WHERE c.instance_id = _instance_id
    )
    SELECT
      w.id as winner_id, w.name as winner_name, w.phone,
      l.id as loser_id, l.name as loser_name
    FROM ranked w
    JOIN ranked l ON w.phone = l.phone AND w.rn = 1 AND l.rn > 1
  LOOP
    RAISE NOTICE 'Merging: keep "%" (%), delete "%" (%)',
      _dup.winner_name, _dup.winner_id, _dup.loser_name, _dup.loser_id;

    -- Reassign vehicles from loser to winner (update customer_id)
    UPDATE customer_vehicles
      SET customer_id = _dup.winner_id
      WHERE customer_id = _dup.loser_id AND instance_id = _instance_id;

    -- Copy name from winner to loser's related records is not needed:
    -- all related tables use customer_phone which is already the same after normalization.

    -- Copy useful data from loser to winner if winner is missing it
    UPDATE customers SET
      name = CASE WHEN name ~ '^\d+$' OR name = '' THEN
        (SELECT name FROM customers WHERE id = _dup.loser_id)
      ELSE name END,
      email = COALESCE(email, (SELECT email FROM customers WHERE id = _dup.loser_id))
    WHERE id = _dup.winner_id;

    -- Delete loser (CASCADE handles customer_vehicles with loser's customer_id)
    DELETE FROM customers WHERE id = _dup.loser_id;
  END LOOP;
END;
$$;
```

- [ ] **Step 2: Push migration**

```bash
supabase db push
```

- [ ] **Step 3: Verify no duplicates remain**

```bash
npx supabase db query "
  SELECT phone, count(*) as cnt
  FROM customers
  WHERE instance_id = '4ce15650-76c7-47e7-b5c8-32b9a2d1c321'
  GROUP BY phone
  HAVING count(*) > 1
" --linked
# Expected: 0 rows
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260324200000_merge_duplicate_customers_armcar.sql
git commit -m "feat: merge 13 duplicate customer pairs in armcar"
```

---

## Task 4: Migration — unique constraint + fix RPC

**Files:**

- Create: `supabase/migrations/20260324300000_unique_customer_phone.sql`

- [ ] **Step 1: Create migration with unique constraint and updated RPC**

```sql
-- Unique constraint: one phone per instance
ALTER TABLE customers
  ADD CONSTRAINT customers_instance_phone_unique UNIQUE (instance_id, phone);

-- Update RPC: remove manual + stripping (trigger handles normalization now)
CREATE OR REPLACE FUNCTION public.upsert_customer_vehicle(
  _instance_id uuid,
  _phone text,
  _model text,
  _plate text DEFAULT NULL::text,
  _customer_id uuid DEFAULT NULL::uuid,
  _car_size text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  _vehicle_id uuid;
BEGIN
  -- Trigger on customer_vehicles normalizes phone automatically
  INSERT INTO public.customer_vehicles (instance_id, phone, model, plate, customer_id, car_size, usage_count, last_used_at)
  VALUES (_instance_id, _phone, _model, _plate, _customer_id, _car_size, 1, now())
  ON CONFLICT (instance_id, phone, model) DO UPDATE SET
    usage_count = customer_vehicles.usage_count + 1,
    last_used_at = now(),
    plate = COALESCE(EXCLUDED.plate, customer_vehicles.plate),
    customer_id = COALESCE(EXCLUDED.customer_id, customer_vehicles.customer_id),
    car_size = COALESCE(EXCLUDED.car_size, customer_vehicles.car_size),
    updated_at = now()
  RETURNING id INTO _vehicle_id;

  RETURN _vehicle_id;
END;
$$;
```

- [ ] **Step 2: Push migration**

```bash
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260324300000_unique_customer_phone.sql
git commit -m "feat: add unique phone constraint and simplify vehicle upsert RPC"
```

---

## Task 5: Simplify vehicle queries — CustomersView

**Files:**

- Modify: `apps/carfect/src/components/admin/CustomersView.tsx` (lines 83-110)

- [ ] **Step 1: Simplify getVehiclesForCustomer**

Replace the triple-comparison matching with simple normalized comparison.

In `CustomersView.tsx`, replace `getVehiclesForCustomer` (lines ~105-110):

```typescript
// Before: manual strip/add + logic
// After: direct comparison — DB and frontend both use normalizePhone
const getVehiclesForCustomer = (phone: string) => {
  const normalized = normalizePhone(phone);
  return vehicles.filter((v) => v.phone === normalized);
};
```

Add import if not present:

```typescript
import { normalizePhone } from '@shared/utils';
```

- [ ] **Step 2: Add phone to vehicle query**

The vehicle query at line ~87 already fetches `phone, model, plate` — no change needed. But the stored phones are now E.164, so `getVehiclesForCustomer` just works.

- [ ] **Step 3: Commit**

```bash
git add apps/carfect/src/components/admin/CustomersView.tsx
git commit -m "fix: simplify vehicle matching to use normalized phone"
```

---

## Task 6: Simplify vehicle queries — CustomerEditDrawer

**Files:**

- Modify: `apps/carfect/src/components/admin/CustomerEditDrawer.tsx` (lines 116-137)

- [ ] **Step 1: Verify fetchCustomerVehicles already uses normalizePhone**

`fetchCustomerVehicles` at line ~116 already does:

```typescript
const normalizedPhone = normalizePhone(customer.phone);
// ...
.eq('phone', normalizedPhone)
```

DB now stores E.164, `normalizePhone` returns E.164 — this already matches. No change needed to the query itself.

- [ ] **Step 2: Show vehicle chips in view mode (not just edit)**

Currently vehicles are only shown in edit mode. Read the component to find where `editVehicles` are rendered and ensure the chips with model names are visible in the non-editing view too. The chips should be read-only in view mode (no X button) and editable in edit mode (with X to delete).

Find the section that renders vehicles (look for `editVehicles.map` or `CustomerVehiclesEditor`) and make sure it renders in both modes.

- [ ] **Step 3: Commit**

```bash
git add apps/carfect/src/components/admin/CustomerEditDrawer.tsx
git commit -m "fix: show vehicle chips in customer drawer view mode"
```

---

## Task 7: Simplify vehicle queries — AddCustomerReminderDialog

**Files:**

- Modify: `apps/carfect/src/components/admin/AddCustomerReminderDialog.tsx` (lines 118-142)

- [ ] **Step 1: Simplify loadCustomerVehicles**

Replace the OR two-format query with single exact match:

```typescript
const loadCustomerVehicles = async () => {
  setLoadingVehicles(true);
  try {
    const normalizedPhone = normalizePhone(customerPhone);
    const { data, error } = await supabase
      .from('customer_vehicles')
      .select('id, model, plate')
      .eq('instance_id', instanceId)
      .eq('phone', normalizedPhone)
      .order('last_used_at', { ascending: false });

    if (error) throw error;
    setCustomerVehicles(data || []);

    if (data && data.length > 0) {
      setSelectedVehicleId(data[0].id);
    }
  } catch (error) {
    console.error('Error loading customer vehicles:', error);
  } finally {
    setLoadingVehicles(false);
  }
};
```

Remove `strippedPhone` variable and the `.or(...)` call.

- [ ] **Step 2: Commit**

```bash
git add apps/carfect/src/components/admin/AddCustomerReminderDialog.tsx
git commit -m "fix: simplify reminder dialog vehicle query to single phone format"
```

---

## Task 8: Simplify vehicle queries — CustomerSection

**Files:**

- Modify: `apps/carfect/src/components/admin/reservation-form/CustomerSection.tsx` (lines 59-100)

- [ ] **Step 1: Simplify handleCustomerSelect**

Replace the dual-lookup (customer_id first, then ILIKE phone fallback) with single phone query:

```typescript
const handleCustomerSelect = async (customer: {
  id: string;
  name: string;
  phone: string;
  has_no_show?: boolean;
}) => {
  onCustomerSelect(customer);

  const normalizedPhone = normalizePhone(customer.phone);
  const { data: vehicleData } = await supabase
    .from('customer_vehicles')
    .select('model, car_size')
    .eq('instance_id', instanceId)
    .eq('phone', normalizedPhone)
    .order('last_used_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (vehicleData) {
    setCarModel(vehicleData.model);
    if (vehicleData.car_size === 'S') setCarSize('small');
    else if (vehicleData.car_size === 'L') setCarSize('large');
    else setCarSize('medium');
  }
};
```

Replace the local `normalizePhone` function (lines 53-57) with the import from `@shared/utils` — it's already imported at line 7.

- [ ] **Step 2: Remove local normalizePhone function**

Delete lines 52-57 (the local `normalizePhone` that only strips spaces/parens/+48).

- [ ] **Step 3: Commit**

```bash
git add apps/carfect/src/components/admin/reservation-form/CustomerSection.tsx
git commit -m "fix: simplify vehicle lookup in reservation form to single phone query"
```

---

## Task 9: Simplify vehicle queries — AddReservationDialogV2

**Files:**

- Modify: `apps/carfect/src/components/admin/AddReservationDialogV2.tsx` (lines 869-1019, 1333-1435)

- [ ] **Step 1: Simplify searchByPhone (lines ~875-921)**

Replace `ilike` wildcard with `eq` on normalized phone:

```typescript
const searchByPhone = useCallback(
  async (searchPhone: string) => {
    const normalized = normalizePhone(searchPhone);
    if (normalized.length < 5) {
      setFoundVehicles([]);
      setShowPhoneDropdown(false);
      return;
    }

    const { data, error } = await supabase
      .from('customer_vehicles')
      .select('id, phone, model, plate, customer_id')
      .eq('instance_id', instanceId)
      .eq('phone', normalized)
      .order('last_used_at', { ascending: false })
      .limit(5);
    // ... rest stays the same (customer name lookup)
  },
  [instanceId],
);
```

Use the shared `normalizePhone` from `@shared/utils` instead of the local one at lines 869-872. Remove the local `normalizePhone` function.

- [ ] **Step 2: Simplify loadCustomerVehicles (lines ~972-1019)**

Replace the multi-format OR query with single `eq`:

```typescript
const loadCustomerVehicles = useCallback(
  async (phoneNumber: string, customerId?: string | null) => {
    const normalized = normalizePhone(phoneNumber);
    if (normalized.length < 5 && !customerId) {
      setCustomerVehicles([]);
      setSelectedVehicleId(null);
      return;
    }

    try {
      let query = supabase
        .from('customer_vehicles')
        .select('id, phone, model, plate, customer_id, car_size, last_used_at')
        .eq('instance_id', instanceId)
        .eq('phone', normalized)
        .order('last_used_at', { ascending: false });

      const { data } = await query;
      // ... rest of deduplication and state setting stays the same
    } catch (err) {
      console.error('Failed to load customer vehicles:', err);
    }
  },
  [instanceId],
);
```

- [ ] **Step 3: Await vehicle upsert instead of fire-and-forget**

At lines ~1333-1351 and ~1417-1435, change the async fire-and-forget blocks to `await`:

```typescript
// Before: (async () => { await supabase.rpc(...) })();
// After:
await supabase.rpc('upsert_customer_vehicle', {
  _instance_id: instanceId,
  _phone: normalizePhone(phone),
  _model: carModel.trim(),
  _plate: null,
  _customer_id: customerId || null,
  _car_size: carSizeCode,
});
```

This ensures the vehicle is saved before the dialog closes, so it's visible immediately.

- [ ] **Step 4: Commit**

```bash
git add apps/carfect/src/components/admin/AddReservationDialogV2.tsx
git commit -m "fix: simplify vehicle queries and await upsert in reservation dialog"
```

---

## Task 10: Phone uniqueness validation in CustomerEditDrawer

**Files:**

- Modify: `apps/carfect/src/components/admin/CustomerEditDrawer.tsx`

- [ ] **Step 1: Add uniqueness check before saving customer**

In the customer save handler, before the INSERT/UPDATE, check if phone is already taken:

```typescript
const normalizedPhone = normalizePhone(editPhone);

const { data: existing } = await supabase
  .from('customers')
  .select('id')
  .eq('instance_id', instanceId)
  .eq('phone', normalizedPhone)
  .neq('id', customer?.id ?? '')
  .maybeSingle();

if (existing) {
  toast.error(t('customers.phoneAlreadyExists'));
  return;
}
```

Add translation key `customers.phoneAlreadyExists` = `"Klient z tym numerem telefonu już istnieje"` to `src/i18n/locales/pl.json`.

- [ ] **Step 2: Cascade phone change to vehicles**

When phone changes, update customer_vehicles:

```typescript
// After successful customer update, if phone changed:
if (normalizePhone(customer.phone) !== normalizedPhone) {
  await supabase
    .from('customer_vehicles')
    .update({ phone: normalizedPhone })
    .eq('customer_id', customer.id)
    .eq('instance_id', instanceId);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/carfect/src/components/admin/CustomerEditDrawer.tsx apps/carfect/src/i18n/locales/pl.json
git commit -m "feat: add phone uniqueness validation and cascade phone changes to vehicles"
```

---

## Task 11: Tests

**Files:**

- Create: `apps/carfect/src/utils/normalizePhone.test.ts`

- [ ] **Step 1: Write test for phone normalization consistency**

```typescript
import { describe, it, expect } from 'vitest';
import { normalizePhone } from '@shared/utils';

describe('normalizePhone E.164 consistency', () => {
  it('normalizes 9-digit Polish number', () => {
    expect(normalizePhone('733854184')).toBe('+48733854184');
  });

  it('normalizes number with +48 prefix', () => {
    expect(normalizePhone('+48733854184')).toBe('+48733854184');
  });

  it('normalizes number with 48 prefix (no +)', () => {
    expect(normalizePhone('48733854184')).toBe('+48733854184');
  });

  it('normalizes number with 0048 prefix', () => {
    expect(normalizePhone('0048733854184')).toBe('+48733854184');
  });

  it('normalizes number with spaces', () => {
    expect(normalizePhone('733 854 184')).toBe('+48733854184');
  });

  it('normalizes number with dashes', () => {
    expect(normalizePhone('733-854-184')).toBe('+48733854184');
  });

  it('preserves international number', () => {
    const result = normalizePhone('+49171123456');
    expect(result).toContain('+49');
  });

  it('all formats produce same output', () => {
    const formats = ['733854184', '+48733854184', '48733854184', '0048733854184', '733 854 184'];
    const results = formats.map(normalizePhone);
    expect(new Set(results).size).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd apps/carfect && npx vitest run src/utils/normalizePhone.test.ts
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add apps/carfect/src/utils/normalizePhone.test.ts
git commit -m "test: verify phone normalization produces consistent E.164 format"
```
