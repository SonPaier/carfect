-- Make slug optional in INSERT statements — the BEFORE INSERT trigger fills
-- it from the title, so callers should not need to pass it. Default '' lets
-- Supabase's generated TS types mark the column as optional in Insert.

ALTER TABLE post_sale_instructions ALTER COLUMN slug SET DEFAULT '';
