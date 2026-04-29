CREATE TABLE ai_analyst_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question text NOT NULL,
  tool_calls jsonb,
  final_answer text,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10, 6),
  duration_ms int,
  status text NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_analyst_logs_instance_created_idx ON ai_analyst_logs (instance_id, created_at DESC);
CREATE INDEX ai_analyst_logs_user_created_idx ON ai_analyst_logs (user_id, created_at DESC);

ALTER TABLE ai_analyst_logs ENABLE ROW LEVEL SECURITY;

-- Read: only super_admin (via user_roles check); write: service_role only.
CREATE POLICY "super_admin_read_logs" ON ai_analyst_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.instance_id = ai_analyst_logs.instance_id
        AND ur.role = 'super_admin'::public.app_role
    )
  );
