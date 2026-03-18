ALTER TABLE public.instances
  ADD COLUMN IF NOT EXISTS widget_branding_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS widget_bg_color text,
  ADD COLUMN IF NOT EXISTS widget_section_bg_color text,
  ADD COLUMN IF NOT EXISTS widget_section_text_color text,
  ADD COLUMN IF NOT EXISTS widget_primary_color text;
