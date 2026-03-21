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

-- Trigger function for customers (phone column)
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

-- Apply triggers (DROP IF EXISTS for idempotency)
DROP TRIGGER IF EXISTS normalize_phone_customers ON customers;
CREATE TRIGGER normalize_phone_customers
  BEFORE INSERT OR UPDATE OF phone ON customers
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone();

DROP TRIGGER IF EXISTS normalize_phone_customer_vehicles ON customer_vehicles;
CREATE TRIGGER normalize_phone_customer_vehicles
  BEFORE INSERT OR UPDATE OF phone ON customer_vehicles
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone();

DROP TRIGGER IF EXISTS normalize_phone_reservations ON reservations;
CREATE TRIGGER normalize_phone_reservations
  BEFORE INSERT OR UPDATE OF customer_phone ON reservations
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();

DROP TRIGGER IF EXISTS normalize_phone_customer_reminders ON customer_reminders;
CREATE TRIGGER normalize_phone_customer_reminders
  BEFORE INSERT OR UPDATE OF customer_phone ON customer_reminders
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();

DROP TRIGGER IF EXISTS normalize_phone_offer_reminders ON offer_reminders;
CREATE TRIGGER normalize_phone_offer_reminders
  BEFORE INSERT OR UPDATE OF customer_phone ON offer_reminders
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();

DROP TRIGGER IF EXISTS normalize_phone_followup_events ON followup_events;
CREATE TRIGGER normalize_phone_followup_events
  BEFORE INSERT OR UPDATE OF customer_phone ON followup_events
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();

DROP TRIGGER IF EXISTS normalize_phone_followup_tasks ON followup_tasks;
CREATE TRIGGER normalize_phone_followup_tasks
  BEFORE INSERT OR UPDATE OF customer_phone ON followup_tasks
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();

DROP TRIGGER IF EXISTS normalize_phone_yard_vehicles ON yard_vehicles;
CREATE TRIGGER normalize_phone_yard_vehicles
  BEFORE INSERT OR UPDATE OF customer_phone ON yard_vehicles
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_customer_phone_col();
