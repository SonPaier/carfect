-- Two hardening fixes for the slug column:
--   1. CHECK (slug <> '') so a future bug that writes an empty string can't
--      land — NOT NULL alone permits ''.
--   2. Wrap the trigger's collision-check loop in an advisory lock keyed on
--      instance_id so two concurrent INSERTs with the same title don't both
--      see the same candidate as available and then collide on the unique
--      index (currently surfaces as a unique-violation thrown to the caller).

ALTER TABLE post_sale_instructions
  ADD CONSTRAINT post_sale_instructions_slug_not_empty CHECK (slug <> '');

CREATE OR REPLACE FUNCTION set_post_sale_instruction_slug() RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  counter INT := 0;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.slug IS NOT NULL
     AND NEW.slug = OLD.slug
     AND NEW.title = OLD.title THEN
    RETURN NEW;
  END IF;

  base_slug := slugify_pl(NEW.title);
  IF base_slug = '' THEN base_slug := 'instrukcja'; END IF;
  candidate := base_slug;

  -- Serialize concurrent INSERT/UPDATE within the same instance so the
  -- collision loop sees a consistent view of existing slugs.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.instance_id::text));

  WHILE EXISTS (
    SELECT 1 FROM post_sale_instructions
    WHERE instance_id = NEW.instance_id
      AND slug = candidate
      AND id <> NEW.id
  ) LOOP
    counter := counter + 1;
    candidate := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
