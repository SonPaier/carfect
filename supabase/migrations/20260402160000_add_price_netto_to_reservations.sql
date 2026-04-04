-- Add price_netto column to reservations
ALTER TABLE public.reservations ADD COLUMN price_netto numeric;

-- Backfill: existing price is brutto, calculate netto
UPDATE public.reservations SET price_netto = ROUND(price / 1.23, 2) WHERE price IS NOT NULL;

-- Backfill service_items JSONB: add custom_price_netto alongside custom_price
UPDATE public.reservations
SET service_items = (
  SELECT jsonb_agg(
    CASE
      WHEN (elem->>'custom_price') IS NOT NULL
      THEN elem || jsonb_build_object('custom_price_netto', ROUND((elem->>'custom_price')::numeric / 1.23, 2))
      ELSE elem
    END
  )
  FROM jsonb_array_elements(service_items) AS elem
)
WHERE service_items IS NOT NULL AND jsonb_array_length(service_items) > 0;
