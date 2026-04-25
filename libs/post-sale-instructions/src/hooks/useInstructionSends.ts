import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import type { InstructionSendRow } from '../types';

interface InstructionSendWithInstruction extends InstructionSendRow {
  post_sale_instructions: {
    id: string;
    title: string;
    slug: string;
    hardcoded_key: string | null;
  } | null;
}

export function useInstructionSends(
  reservationId: string,
  supabase: SupabaseClient<Database>,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['instruction-sends', reservationId],
    enabled: Boolean(reservationId) && options?.enabled !== false,
    queryFn: async (): Promise<InstructionSendWithInstruction[]> => {
      const { data, error } = await supabase
        .from('post_sale_instruction_sends')
        .select('*, post_sale_instructions(id, title, slug, hardcoded_key)')
        .eq('reservation_id', reservationId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as InstructionSendWithInstruction[];
    },
  });
}
