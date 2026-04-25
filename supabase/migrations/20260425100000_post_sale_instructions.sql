-- ============================================================================
-- Post-sale care instructions
-- Tables: post_sale_instructions, post_sale_instruction_sends
-- Token trigger, updated_at trigger, RLS, indexes, RPCs
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Table: post_sale_instructions
-- ---------------------------------------------------------------------------
CREATE TABLE public.post_sale_instructions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  title         text NOT NULL,
  content       jsonb NOT NULL,
  hardcoded_key text,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_sale_instructions_instance
  ON public.post_sale_instructions (instance_id);

-- Maintain updated_at automatically (uses the existing update_updated_at_column function)
CREATE TRIGGER update_post_sale_instructions_updated_at
  BEFORE UPDATE ON public.post_sale_instructions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Table: post_sale_instruction_sends
-- ---------------------------------------------------------------------------
CREATE TABLE public.post_sale_instruction_sends (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  instruction_id uuid NOT NULL REFERENCES public.post_sale_instructions(id) ON DELETE RESTRICT,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  customer_id    uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  public_token   text NOT NULL UNIQUE,
  sent_at        timestamptz NOT NULL DEFAULT now(),
  viewed_at      timestamptz,
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_reservation_instruction UNIQUE (reservation_id, instruction_id)
);

CREATE INDEX idx_instruction_sends_token
  ON public.post_sale_instruction_sends (public_token);

CREATE INDEX idx_instruction_sends_reservation
  ON public.post_sale_instruction_sends (reservation_id);

-- ---------------------------------------------------------------------------
-- Trigger: auto-generate public_token on insert (mirrors set_offers_public_token)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_post_sale_instruction_send_public_token()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.public_token IS NULL OR NEW.public_token = '' THEN
    NEW.public_token := gen_random_uuid()::text;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_instruction_send_token
  BEFORE INSERT ON public.post_sale_instruction_sends
  FOR EACH ROW EXECUTE FUNCTION public.set_post_sale_instruction_send_public_token();

-- ---------------------------------------------------------------------------
-- RLS: post_sale_instructions
-- ---------------------------------------------------------------------------
ALTER TABLE public.post_sale_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_sale_instructions_select_policy"
  ON public.post_sale_instructions
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
    OR public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id)
  );

CREATE POLICY "post_sale_instructions_insert_policy"
  ON public.post_sale_instructions
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
  );

CREATE POLICY "post_sale_instructions_update_policy"
  ON public.post_sale_instructions
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
  );

CREATE POLICY "post_sale_instructions_delete_policy"
  ON public.post_sale_instructions
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
  );

-- ---------------------------------------------------------------------------
-- RLS: post_sale_instruction_sends
-- ---------------------------------------------------------------------------
ALTER TABLE public.post_sale_instruction_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_sale_instruction_sends_select_policy"
  ON public.post_sale_instruction_sends
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
    OR public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id)
  );

CREATE POLICY "post_sale_instruction_sends_insert_policy"
  ON public.post_sale_instruction_sends
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
  );

CREATE POLICY "post_sale_instruction_sends_update_policy"
  ON public.post_sale_instruction_sends
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
  );

CREATE POLICY "post_sale_instruction_sends_delete_policy"
  ON public.post_sale_instruction_sends
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
  );

-- ---------------------------------------------------------------------------
-- RPC: mark_instruction_viewed (mirrors mark_offer_viewed)
-- Called by get_public_instruction; also grantable standalone for idempotent re-calls.
-- WHERE viewed_at IS NULL prevents overwriting the first-view timestamp.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_instruction_viewed(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.post_sale_instruction_sends
  SET viewed_at = now()
  WHERE public_token = p_token
    AND viewed_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_instruction_viewed(text) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_instruction_viewed(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: get_public_instruction (mirrors get_public_offer)
-- SECURITY DEFINER bypasses RLS so anon users can read via token.
-- Calls mark_instruction_viewed inside the same transaction.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_instruction(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result         jsonb;
  send_row       record;
  instruction_row record;
  instance_data  jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 4 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  SELECT * INTO send_row
  FROM public.post_sale_instruction_sends
  WHERE public_token = p_token;

  IF send_row IS NULL THEN
    RAISE EXCEPTION 'Instruction not found';
  END IF;

  SELECT * INTO instruction_row
  FROM public.post_sale_instructions
  WHERE id = send_row.instruction_id;

  SELECT jsonb_build_object(
    'name',           i.name,
    'logo_url',       i.logo_url,
    'phone',          i.phone,
    'email',          i.email,
    'address',        i.address,
    'website',        i.website,
    'contact_person', i.contact_person
  ) INTO instance_data
  FROM public.instances i
  WHERE i.id = send_row.instance_id;

  result := jsonb_build_object(
    'title',   instruction_row.title,
    'content', instruction_row.content,
    'instance', instance_data
  );

  PERFORM public.mark_instruction_viewed(p_token);

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_instruction(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_instruction(text) TO authenticated;
