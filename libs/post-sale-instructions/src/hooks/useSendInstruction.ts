import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import type { InstructionSendRow } from '../types';

/**
 * Build the customer-facing URL for an instruction. Both segments are slugs,
 * not tokens — the public RPC resolves (instance_slug, instruction_slug) to
 * a row, with no per-customer state in the URL.
 */
export function buildInstructionPublicUrl(instanceSlug: string, instructionSlug: string): string {
  return `https://${instanceSlug}.carfect.pl/instrukcje/${instructionSlug}`;
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
