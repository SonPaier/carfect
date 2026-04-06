import { useQuery } from '@tanstack/react-query';
import type { AppHint, SupabaseClientLike } from '../types';

interface UseAppHintsParams {
  supabaseClient: SupabaseClientLike;
  userId: string;
}

// Fetches all active, non-dismissed hints for the user.
// Route and role filtering is done in HintsRenderer so it's reactive to route changes
// without triggering a network request.
export function useAppHints({ supabaseClient, userId }: UseAppHintsParams) {
  return useQuery({
    queryKey: ['app_hints', userId],
    queryFn: async () => {
      const client = supabaseClient as {
        from: (table: string) => {
          select: (
            cols: string,
          ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
        };
      };

      const [hintsResult, dismissalsResult] = await Promise.all([
        client.from('app_hints').select('*') as Promise<{
          data: AppHint[] | null;
          error: { message: string } | null;
        }>,
        client.from('app_hint_dismissals').select('hint_id') as Promise<{
          data: Array<{ hint_id: string }> | null;
          error: { message: string } | null;
        }>,
      ]);

      if (hintsResult.error) throw new Error(hintsResult.error.message);
      if (dismissalsResult.error) throw new Error(dismissalsResult.error.message);

      const dismissedIds = new Set((dismissalsResult.data ?? []).map((d) => d.hint_id));

      return (hintsResult.data ?? []).filter((hint) => hint.active && !dismissedIds.has(hint.id));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
