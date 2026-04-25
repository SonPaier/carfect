import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import { BUILTIN_TEMPLATES } from '../builtinTemplates';
import type { InstructionListItem, PostSaleInstructionRow } from '../types';

export function useInstructions(instanceId: string, supabase: SupabaseClient<Database>) {
  return useQuery({
    queryKey: ['post-sale-instructions', instanceId],
    enabled: Boolean(instanceId),
    queryFn: async (): Promise<InstructionListItem[]> => {
      const { data, error } = await supabase
        .from('post_sale_instructions')
        .select('*')
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as PostSaleInstructionRow[];

      const builtinItems: InstructionListItem[] = BUILTIN_TEMPLATES.map((template) => ({
        kind: 'builtin' as const,
        template,
      }));

      const customItems: InstructionListItem[] = rows.map((row) => ({
        kind: 'custom' as const,
        row,
      }));

      return [...builtinItems, ...customItems];
    },
  });
}
