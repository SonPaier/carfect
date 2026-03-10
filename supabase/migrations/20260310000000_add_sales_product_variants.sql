-- Add has_variants flag to sales_products
ALTER TABLE "public"."sales_products"
  ADD COLUMN "has_variants" boolean NOT NULL DEFAULT false;

-- Create sales_product_variants table
CREATE TABLE "public"."sales_product_variants" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "name" text NOT NULL,
  "price_net" numeric NOT NULL DEFAULT 0,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "public"."sales_product_variants" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX sales_product_variants_pkey
  ON public.sales_product_variants USING btree (id);

ALTER TABLE "public"."sales_product_variants"
  ADD CONSTRAINT "sales_product_variants_pkey" PRIMARY KEY
  USING INDEX "sales_product_variants_pkey";

ALTER TABLE "public"."sales_product_variants"
  ADD CONSTRAINT "sales_product_variants_product_id_fkey"
  FOREIGN KEY (product_id) REFERENCES public.sales_products(id)
  ON DELETE CASCADE;

-- RLS policy: access through parent product's instance
CREATE POLICY "Users can manage sales product variants"
  ON "public"."sales_product_variants"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_products sp
      WHERE sp.id = sales_product_variants.product_id
        AND public.can_access_instance(sp.instance_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales_products sp
      WHERE sp.id = sales_product_variants.product_id
        AND public.can_access_instance(sp.instance_id)
    )
  );

-- Add variant_id to sales_order_items for traceability
ALTER TABLE "public"."sales_order_items"
  ADD COLUMN "variant_id" uuid;

ALTER TABLE "public"."sales_order_items"
  ADD CONSTRAINT "sales_order_items_variant_id_fkey"
  FOREIGN KEY (variant_id) REFERENCES public.sales_product_variants(id)
  ON DELETE SET NULL;

-- Grant permissions (matching existing table patterns)
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."sales_product_variants" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."sales_product_variants" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
  ON TABLE "public"."sales_product_variants" TO "service_role";
