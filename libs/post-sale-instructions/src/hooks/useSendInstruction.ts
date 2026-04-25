import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import type { InstructionSendRow } from '../types';

export function buildInstructionPublicUrl(slug: string, token: string): string {
  return `https://${slug}.carfect.pl/instrukcje/${token}`;
}

interface SendInstructionInput {
  instructionId: string;
  reservationId: string;
  customerId: string | null;
  instanceId: string;
}

export function useSendInstruction(supabase: SupabaseClient<Database>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendInstructionInput): Promise<InstructionSendRow> => {
      const { data, error } = await supabase
        .from('post_sale_instruction_sends')
        .upsert(
          {
            instruction_id: input.instructionId,
            reservation_id: input.reservationId,
            customer_id: input.customerId,
            instance_id: input.instanceId,
            sent_at: new Date().toISOString(),
          },
          { onConflict: 'reservation_id,instruction_id' },
        )
        .select('*')
        .single();

      if (error) throw error;
      return data as InstructionSendRow;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['instruction-sends', variables.reservationId],
      });
    },
  });
}
