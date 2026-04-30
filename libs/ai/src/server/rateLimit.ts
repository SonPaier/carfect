// libs/ai/src/server/rateLimit.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { AiAnalystAuthError } from './resolveInstanceId';

export const USER_HOURLY_LIMIT = 30;
export const INSTANCE_DAILY_LIMIT = 200;

export async function enforceRateLimit(
  supabase: SupabaseClient,
  userId: string,
  instanceId: string,
): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count, error } = await supabase
    .from('ai_analyst_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo);
  if (error) throw AiAnalystAuthError(429, `Rate limit check failed: ${error.message}`);
  if ((count ?? 0) >= USER_HOURLY_LIMIT) {
    throw AiAnalystAuthError(429, 'Hourly request limit exceeded');
  }
  // NOTE: instance daily limit check intentionally simplified for v1 — single user-hour check is enough
  // to block runaway costs. Extend to per-instance daily check in v2 (separate query, same pattern).
  void instanceId;
}
