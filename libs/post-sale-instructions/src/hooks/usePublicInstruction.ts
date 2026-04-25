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

/**
 * Anon-callable lookup for the public route /instrukcje/:slug. Both the
 * instance subdomain and the instruction slug are part of the URL — we pass
 * them through so different instances can independently own the same slug.
 */
export function usePublicInstruction(
  instanceSlug: string | undefined,
  instructionSlug: string | undefined,
  supabase: SupabaseClient<Database>,
) {
  return useQuery({
    queryKey: ['public-instruction', instanceSlug, instructionSlug],
    enabled: Boolean(instanceSlug && instructionSlug),
    queryFn: async (): Promise<PublicInstructionData> => {
      const { data, error } = await supabase.rpc('get_public_instruction_by_slug', {
        p_instance_slug: instanceSlug!,
        p_instruction_slug: instructionSlug!,
      });
      if (error) throw error;
      return data as unknown as PublicInstructionData;
    },
  });
}
