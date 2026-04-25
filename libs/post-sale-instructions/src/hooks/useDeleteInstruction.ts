import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';

interface DeleteInstructionInput {
  id: string;
  instanceId: string;
}

export function useDeleteInstruction(supabase: SupabaseClient<Database>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteInstructionInput): Promise<void> => {
      const { error } = await supabase
        .from('post_sale_instructions')
        .delete()
        .eq('id', input.id);

      if (error) {
        if (error.code === '23503') throw new Error('INSTRUCTION_RESTRICT_FK');
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['post-sale-instructions', variables.instanceId],
      });
    },
  });
}
