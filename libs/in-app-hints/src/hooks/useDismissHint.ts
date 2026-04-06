import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClientLike } from '../types';

interface UseDismissHintParams {
  supabaseClient: SupabaseClientLike;
  userId: string;
}

export function useDismissHint({ supabaseClient, userId }: UseDismissHintParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hintId: string) => {
      const client = supabaseClient as {
        from: (table: string) => {
          insert: (data: unknown) => Promise<{ error: { message: string } | null }>;
        };
      };

      const { error } = await client.from('app_hint_dismissals').insert({
        hint_id: hintId,
        user_id: userId,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_hints', userId] });
    },
  });
}
