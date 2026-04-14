ALTER TABLE public.instances
  ADD COLUMN IF NOT EXISTS calendar_config jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.instances.calendar_config IS 'Per-view calendar settings: { day: {...}, week: {...}, month: {...} }';
