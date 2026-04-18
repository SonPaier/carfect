-- Allow scrap/offcut usages (roll_id IS NULL) for authenticated users
-- The existing policy only works when roll_id references a sales_roll
CREATE POLICY "Users can manage scrap roll usages"
  ON "public"."sales_roll_usages"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    roll_id IS NULL
  )
  WITH CHECK (
    roll_id IS NULL
  );
