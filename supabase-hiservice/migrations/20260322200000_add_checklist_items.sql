ALTER TABLE public.calendar_items
  ADD COLUMN checklist_items jsonb DEFAULT '[]'::jsonb;
