import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// TODO: Remove cast once integration_links is added to generated Supabase types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const integrationLinksTable = () => supabase.from('integration_links' as any);

export function useUltrafitLink(instanceId: string | null) {
  const queryClient = useQueryClient();

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

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!data?.id) throw new Error('No link to disconnect');
      const { error } = await integrationLinksTable()
        .delete()
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration_links', instanceId, 'ultrafit'] });
    },
  });

  return {
    isLinked: !!data,
    isLoading,
    linkId: data?.id ?? null,
    externalCustomerId: data?.external_customer_id ?? null,
    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
  };
}
