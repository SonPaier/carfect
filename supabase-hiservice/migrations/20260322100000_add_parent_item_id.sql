-- Add parent_item_id for follow-up visit linking (flat: always points to root original)
ALTER TABLE public.calendar_items
  ADD COLUMN parent_item_id uuid REFERENCES public.calendar_items(id) ON DELETE SET NULL;

-- Index for querying follow-ups by parent
CREATE INDEX idx_calendar_items_parent_item_id ON public.calendar_items(parent_item_id)
  WHERE parent_item_id IS NOT NULL;
