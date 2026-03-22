-- Step 1: Merge duplicate customers BEFORE normalizing
-- (because normalization + existing unique constraint would conflict)
-- Temporarily disable the normalize trigger on customers to avoid constraint violations during merge
ALTER TABLE customers DISABLE TRIGGER normalize_phone_customers;

DO $$
DECLARE
  _dup RECORD;
BEGIN
  -- Find duplicates across ALL instances using normalized phone comparison
  FOR _dup IN
    WITH normalized AS (
      SELECT
        c.id, c.instance_id, c.phone, c.name, c.email, c.created_at,
        normalize_phone_number(c.phone) as norm_phone,
        (SELECT count(*) FROM customer_reminders cr
         WHERE cr.customer_phone = c.phone AND cr.instance_id = c.instance_id) as rem_count,
        (SELECT count(*) FROM reservations r
         WHERE r.customer_phone = c.phone AND r.instance_id = c.instance_id) as res_count
      FROM customers c
    ),
    ranked AS (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY instance_id, norm_phone
          ORDER BY rem_count DESC, res_count DESC, created_at DESC
        ) as rn
      FROM normalized
    )
    SELECT
      w.id as winner_id, w.name as winner_name, w.email as winner_email, w.phone as winner_phone,
      w.instance_id,
      l.id as loser_id, l.name as loser_name, l.email as loser_email, l.phone as loser_phone
    FROM ranked w
    JOIN ranked l ON w.instance_id = l.instance_id AND w.norm_phone = l.norm_phone
      AND w.rn = 1 AND l.rn > 1
  LOOP
    RAISE NOTICE 'Merging in instance %: keep "%" (%), delete "%" (%)',
      _dup.instance_id, _dup.winner_name, _dup.winner_phone, _dup.loser_name, _dup.loser_phone;

    -- Reassign vehicles from loser to winner
    UPDATE customer_vehicles
      SET customer_id = _dup.winner_id
      WHERE customer_id = _dup.loser_id AND instance_id = _dup.instance_id;

    -- Move related data: update customer_phone in all related tables from loser's phone to winner's phone
    -- (After normalization they'll be the same, but during merge they might differ)
    UPDATE reservations SET customer_phone = _dup.winner_phone
      WHERE customer_phone = _dup.loser_phone AND instance_id = _dup.instance_id;
    UPDATE customer_reminders SET customer_phone = _dup.winner_phone
      WHERE customer_phone = _dup.loser_phone AND instance_id = _dup.instance_id;
    UPDATE offer_reminders SET customer_phone = _dup.winner_phone
      WHERE customer_phone = _dup.loser_phone AND instance_id = _dup.instance_id;
    UPDATE followup_events SET customer_phone = _dup.winner_phone
      WHERE customer_phone = _dup.loser_phone AND instance_id = _dup.instance_id;
    UPDATE followup_tasks SET customer_phone = _dup.winner_phone
      WHERE customer_phone = _dup.loser_phone AND instance_id = _dup.instance_id;
    UPDATE yard_vehicles SET customer_phone = _dup.winner_phone
      WHERE customer_phone = _dup.loser_phone AND instance_id = _dup.instance_id;

    -- Copy useful data from loser if winner is missing it
    UPDATE customers SET
      name = CASE
        WHEN name ~ '^\d+$' OR name = '' THEN _dup.loser_name
        ELSE name
      END,
      email = COALESCE(email, _dup.loser_email)
    WHERE id = _dup.winner_id;

    -- Delete loser
    DELETE FROM customers WHERE id = _dup.loser_id;
  END LOOP;
END;
$$;

-- Re-enable the trigger
ALTER TABLE customers ENABLE TRIGGER normalize_phone_customers;

-- Step 2: Deduplicate customer_reminders that would conflict after phone normalization
DELETE FROM customer_reminders a
USING customer_reminders b
WHERE a.id < b.id
  AND normalize_phone_number(a.customer_phone) = normalize_phone_number(b.customer_phone)
  AND a.instance_id = b.instance_id
  AND a.vehicle_plate = b.vehicle_plate
  AND a.reminder_template_id = b.reminder_template_id
  AND a.months_after = b.months_after;

-- Step 3: Now normalize all existing phone data (no more duplicates to conflict)
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
