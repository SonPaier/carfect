import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import type { PostSaleInstructionRow, TiptapDocument } from '../types';

interface UpdateInstructionInput {
  id: string;
  instanceId: string;
  title: string;
  content: TiptapDocument;
}

export function useUpdateInstruction(supabase: SupabaseClient<Database>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateInstructionInput): Promise<PostSaleInstructionRow> => {
      const { data, error } = await supabase
        .from('post_sale_instructions')
        .update({
          title: input.title,
          content: input.content,
        })
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) throw error;
      return data as PostSaleInstructionRow;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['post-sale-instructions', variables.instanceId],
      });
    },
  });
}
