-- Slug-based public URLs for post-sale instructions.
--
-- The current public URL is /instrukcje/<public_token> where public_token is
-- a UUID stored on a per-customer post_sale_instruction_sends row. The user
-- wants URLs that look like /instrukcje/<title-slug> instead — independent of
-- a specific customer/reservation.
--
-- This migration:
--   1. Adds a `slug` column to post_sale_instructions, unique per instance.
--   2. Auto-generates the slug from `title` on INSERT and on UPDATE OF title,
--      with a numeric suffix when a collision would occur.
--   3. Backfills existing rows.
--   4. Adds a public RPC `get_public_instruction_by_slug` for the new URL.

-- ── Slugify helper ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION slugify_pl(input TEXT) RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  IF input IS NULL THEN RETURN ''; END IF;
  result := lower(input);
  -- Polish diacritics → ASCII
  result := translate(result, 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ');
  -- Anything not [a-z0-9] becomes a hyphen
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  -- Strip leading / trailing hyphens
  result := regexp_replace(result, '^-+|-+$', '', 'g');
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── Column ─────────────────────────────────────────────────────────────────
ALTER TABLE post_sale_instructions
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- ── Trigger that derives slug from title ───────────────────────────────────
CREATE OR REPLACE FUNCTION set_post_sale_instruction_slug() RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  counter INT := 0;
BEGIN
  -- Only regenerate when slug is missing or the title changed.
  IF TG_OP = 'UPDATE'
     AND NEW.slug IS NOT NULL
     AND NEW.slug = OLD.slug
     AND NEW.title = OLD.title THEN
    RETURN NEW;
  END IF;

  base_slug := slugify_pl(NEW.title);
  IF base_slug = '' THEN base_slug := 'instrukcja'; END IF;
  candidate := base_slug;

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

DROP TRIGGER IF EXISTS set_post_sale_instruction_slug_trg ON post_sale_instructions;
CREATE TRIGGER set_post_sale_instruction_slug_trg
  BEFORE INSERT OR UPDATE OF title ON post_sale_instructions
  FOR EACH ROW EXECUTE FUNCTION set_post_sale_instruction_slug();

-- ── Backfill existing rows so the NOT NULL + UNIQUE constraints succeed ────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM post_sale_instructions WHERE slug IS NULL LOOP
    UPDATE post_sale_instructions SET title = title WHERE id = r.id;
  END LOOP;
END $$;

-- ── Constraints ────────────────────────────────────────────────────────────
ALTER TABLE post_sale_instructions
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS post_sale_instructions_instance_slug_unique
  ON post_sale_instructions (instance_id, slug);

-- ── Public RPC: fetch instruction by (instance slug, instruction slug) ─────
-- The instance is identified by its public subdomain slug
-- (instances.slug). No token needed — the URL is intentionally non-personal.
CREATE OR REPLACE FUNCTION get_public_instruction_by_slug(
  p_instance_slug TEXT,
  p_instruction_slug TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instance_id UUID;
  v_row post_sale_instructions%ROWTYPE;
  v_instance instances%ROWTYPE;
BEGIN
  SELECT id INTO v_instance_id FROM instances WHERE slug = p_instance_slug;
  IF v_instance_id IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO v_row
  FROM post_sale_instructions
  WHERE instance_id = v_instance_id AND slug = p_instruction_slug;
  IF v_row.id IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO v_instance FROM instances WHERE id = v_instance_id;

  RETURN jsonb_build_object(
    'title', v_row.title,
    'content', v_row.content,
    'instance', jsonb_build_object(
      'name', v_instance.name,
      'logo_url', v_instance.logo_url,
      'phone', v_instance.phone,
      'email', v_instance.email,
      'address', v_instance.address,
      'website', v_instance.website,
      'contact_person', v_instance.contact_person
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_instruction_by_slug(TEXT, TEXT) TO anon, authenticated;
