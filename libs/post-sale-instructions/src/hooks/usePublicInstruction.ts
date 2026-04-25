import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import type { TiptapDocument } from '../types';

export interface PublicInstructionData {
  title: string;
  content: TiptapDocument;
  instance: {
    name?: string;
    logo_url?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    contact_person?: string;
  };
}

export function usePublicInstruction(
  token: string | undefined,
  supabase: SupabaseClient<Database>,
) {
  return useQuery({
    queryKey: ['public-instruction', token],
    enabled: Boolean(token),
    queryFn: async (): Promise<PublicInstructionData> => {
      const { data, error } = await supabase.rpc('get_public_instruction', {
        p_token: token!,
      });

      if (error) throw error;
      return data as unknown as PublicInstructionData;
    },
  });
}
