// libs/ai/src/server/auditLog.ts
import type { SupabaseClient } from '@supabase/supabase-js';

const PRICING_USD_PER_1K = {
  'gpt-4.1': { in: 0.002, out: 0.008 },
  'gpt-4.1-mini': { in: 0.0004, out: 0.0016 },
  'gpt-5': { in: 0.01, out: 0.03 },
} as const;

export function computeCostUsd({
  tokens_in,
  tokens_out,
  model,
}: {
  tokens_in: number | null;
  tokens_out: number | null;
  model: string;
}): number {
  const rates =
    PRICING_USD_PER_1K[model as keyof typeof PRICING_USD_PER_1K] ?? PRICING_USD_PER_1K['gpt-4.1'];
  const inUsd = ((tokens_in ?? 0) / 1000) * rates.in;
  const outUsd = ((tokens_out ?? 0) / 1000) * rates.out;
  return inUsd + outUsd;
}

export interface AuditLogPayload {
  instance_id: string;
  user_id: string;
  question: string;
  tool_calls: unknown[];
  final_answer: string;
  tokens_in: number | null;
  tokens_out: number | null;
  duration_ms: number;
  status: 'success' | 'error' | 'timeout';
  error_message: string | null;
}

export async function insertAuditLog(
  supabase: SupabaseClient,
  payload: AuditLogPayload,
): Promise<void> {
  const cost_usd = computeCostUsd({
    tokens_in: payload.tokens_in,
    tokens_out: payload.tokens_out,
    model: process.env.AI_ANALYST_MODEL ?? 'gpt-4.1',
  });
  const { error } = await supabase.from('ai_analyst_logs').insert({ ...payload, cost_usd });
  if (error) console.error('[ai_analyst] audit log insert failed:', error.message);
}
