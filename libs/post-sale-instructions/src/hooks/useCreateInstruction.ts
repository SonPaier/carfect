import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import type { PostSaleInstructionRow, TiptapDocument, HardcodedKey } from '../types';

interface CreateInstructionInput {
  instanceId: string;
  title: string;
  content: TiptapDocument;
  hardcodedKey?: HardcodedKey | null;
}

export function useCreateInstruction(supabase: SupabaseClient<Database>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInstructionInput): Promise<PostSaleInstructionRow> => {
      const { data, error } = await supabase
        .from('post_sale_instructions')
        .insert({
          instance_id: input.instanceId,
          title: input.title,
          content: input.content,
          hardcoded_key: input.hardcodedKey ?? null,
        })
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
