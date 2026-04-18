import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// TODO: Remove cast once integration_links is added to generated Supabase types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const integrationLinksTable = () => supabase.from('integration_links' as any);

export function useUltrafitLink(instanceId: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ['integration_links', instanceId, 'ultrafit'],
    queryFn: async () => {
      if (!instanceId) return null;
      const { data } = await integrationLinksTable()
        .select('id, external_customer_id')
        .eq('instance_id', instanceId)
        .eq('provider', 'ultrafit')
        .maybeSingle();
      return data as { id: string; external_customer_id: string } | null;
    },
    enabled: !!instanceId,
  });

  return {
    isLinked: !!data,
    isLoading,
    externalCustomerId: data?.external_customer_id ?? null,
  };
}
