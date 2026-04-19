-- Add language column to instances for i18n support
ALTER TABLE public.instances
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pl';

-- Constraint: only supported languages
ALTER TABLE public.instances
  ADD CONSTRAINT instances_language_check
  CHECK (language IN ('pl', 'en', 'de'));
