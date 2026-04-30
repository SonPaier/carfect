// libs/ai/src/server/resolveInstanceId.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AiAnalystAuthErrorObject extends Error {
  status: 401 | 403 | 429;
  isAiAnalystAuthError: true;
}

export function AiAnalystAuthError(
  status: 401 | 403 | 429,
  message: string,
): AiAnalystAuthErrorObject {
  const err = new Error(message) as AiAnalystAuthErrorObject;
  err.name = 'AiAnalystAuthError';
  err.status = status;
  err.isAiAnalystAuthError = true;
  return err;
}

export function isAiAnalystAuthError(e: unknown): e is AiAnalystAuthErrorObject {
  return Boolean(e && typeof e === 'object' && (e as { isAiAnalystAuthError?: boolean }).isAiAnalystAuthError);
}

export async function resolveInstanceId(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ user_id: string; instance_id: string }> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) throw AiAnalystAuthError(401, 'Missing Authorization');
  const token = auth.slice('Bearer '.length);

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) throw AiAnalystAuthError(401, 'Invalid token');
  const userId = userData.user.id;

  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('instance_id')
    .eq('user_id', userId);
  if (rolesErr) throw AiAnalystAuthError(403, 'Could not load roles');
  if (!roles || roles.length === 0) throw AiAnalystAuthError(403, 'No instance access');

  const allowedIds = roles.map((r: { instance_id: string }) => r.instance_id);

  if (allowedIds.length === 1) {
    return { user_id: userId, instance_id: allowedIds[0] };
  }

  const requested = req.headers.get('X-Carfect-Instance');
  if (!requested || !allowedIds.includes(requested)) {
    throw AiAnalystAuthError(403, 'Invalid or missing instance selection');
  }
  return { user_id: userId, instance_id: requested };
}
