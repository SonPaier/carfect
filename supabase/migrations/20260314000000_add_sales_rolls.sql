-- ============================================================
-- Sales Rolls (Ewidencja Rolek)
-- ============================================================

-- Main rolls table
CREATE TABLE "public"."sales_rolls" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "instance_id" uuid NOT NULL,
  "brand" text NOT NULL,
  "product_name" text NOT NULL,
  "description" text,
  "product_code" text,
  "barcode" text,
  "width_mm" numeric NOT NULL,
  "length_m" numeric NOT NULL,
  "initial_length_m" numeric NOT NULL,
  "delivery_date" date,
  "photo_url" text,
  "status" text NOT NULL DEFAULT 'active',
  "extraction_confidence" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."sales_rolls" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX sales_rolls_pkey
  ON public.sales_rolls USING btree (id);

ALTER TABLE "public"."sales_rolls"
  ADD CONSTRAINT "sales_rolls_pkey" PRIMARY KEY
  USING INDEX "sales_rolls_pkey";

ALTER TABLE "public"."sales_rolls"
  ADD CONSTRAINT "sales_rolls_instance_id_fkey"
  FOREIGN KEY (instance_id) REFERENCES public.instances(id)
  ON DELETE CASCADE;

-- Index for listing rolls by status per instance
CREATE INDEX sales_rolls_instance_status_idx
  ON public.sales_rolls (instance_id, status);

-- Index for autocomplete: active rolls matching a product_name
CREATE INDEX sales_rolls_product_name_idx
  ON public.sales_rolls (instance_id, product_name, status);

-- RLS
CREATE POLICY "Users can manage sales rolls"
  ON "public"."sales_rolls"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.can_access_instance(instance_id))
  WITH CHECK (public.can_access_instance(instance_id));

-- Grants
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."sales_rolls" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."sales_rolls" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."sales_rolls" TO "service_role";


-- ============================================================
-- Roll Usage Tracking
-- ============================================================

CREATE TABLE "public"."sales_roll_usages" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "roll_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "order_item_id" uuid NOT NULL,
  "used_m2" numeric NOT NULL,
  "used_mb" numeric NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."sales_roll_usages" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX sales_roll_usages_pkey
  ON public.sales_roll_usages USING btree (id);

ALTER TABLE "public"."sales_roll_usages"
  ADD CONSTRAINT "sales_roll_usages_pkey" PRIMARY KEY
  USING INDEX "sales_roll_usages_pkey";

ALTER TABLE "public"."sales_roll_usages"
  ADD CONSTRAINT "sales_roll_usages_roll_id_fkey"
  FOREIGN KEY (roll_id) REFERENCES public.sales_rolls(id)
  ON DELETE CASCADE;

ALTER TABLE "public"."sales_roll_usages"
  ADD CONSTRAINT "sales_roll_usages_order_id_fkey"
  FOREIGN KEY (order_id) REFERENCES public.sales_orders(id)
  ON DELETE CASCADE;

ALTER TABLE "public"."sales_roll_usages"
  ADD CONSTRAINT "sales_roll_usages_order_item_id_fkey"
  FOREIGN KEY (order_item_id) REFERENCES public.sales_order_items(id)
  ON DELETE CASCADE;

-- Index for computing remaining length per roll
CREATE INDEX sales_roll_usages_roll_id_idx
  ON public.sales_roll_usages (roll_id);

-- RLS: access through parent roll's instance
CREATE POLICY "Users can manage sales roll usages"
  ON "public"."sales_roll_usages"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_rolls sr
      WHERE sr.id = sales_roll_usages.roll_id
        AND public.can_access_instance(sr.instance_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales_rolls sr
      WHERE sr.id = sales_roll_usages.roll_id
        AND public.can_access_instance(sr.instance_id)
    )
  );

-- Grants
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."sales_roll_usages" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."sales_roll_usages" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."sales_roll_usages" TO "service_role";


-- ============================================================
-- Auto-archive trigger: archive roll when fully consumed
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_archive_depleted_roll()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  roll_length numeric;
  total_used numeric;
BEGIN
  SELECT length_m INTO roll_length
    FROM public.sales_rolls
    WHERE id = NEW.roll_id;

  SELECT COALESCE(SUM(used_mb), 0) INTO total_used
    FROM public.sales_roll_usages
    WHERE roll_id = NEW.roll_id;

  IF total_used >= roll_length THEN
    UPDATE public.sales_rolls
      SET status = 'archived', updated_at = now()
      WHERE id = NEW.roll_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_archive_roll
  AFTER INSERT ON public.sales_roll_usages
  FOR EACH ROW EXECUTE FUNCTION public.auto_archive_depleted_roll();


-- ============================================================
-- Storage bucket for roll label photos
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('roll-photos', 'roll-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload roll photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'roll-photos');

CREATE POLICY "Authenticated users can read roll photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'roll-photos');

CREATE POLICY "Anyone can read roll photos"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'roll-photos');

CREATE POLICY "Authenticated users can delete roll photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'roll-photos');
