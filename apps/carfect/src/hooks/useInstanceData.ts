import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useInstanceData = (instanceId: string | null) => {
  return useQuery({
    queryKey: ['instance_data', instanceId],
    queryFn: async () => {
      if (!instanceId) return null;
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .eq('id', instanceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!instanceId,
    staleTime: 0,
    gcTime: 14 * 24 * 60 * 60 * 1000, // 14 days
  });
};
