import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProtocolConfig, ProtocolType } from './types';
import { mergeWithDefaults, DEFAULT_PROTOCOL_CONFIG } from './defaults';
import { protocolConfigSchema } from './schema';

function queryKey(instanceId: string, protocolType: ProtocolType) {
  return ['protocol_settings', instanceId, protocolType] as const;
}

export function useProtocolConfig(
  instanceId: string,
  protocolType: ProtocolType,
  supabase: SupabaseClient
) {
  const queryClient = useQueryClient();
  const key = queryKey(instanceId, protocolType);

  const { data: config = DEFAULT_PROTOCOL_CONFIG, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocol_settings')
        .select('config')
        .eq('instance_id', instanceId)
        .eq('protocol_type', protocolType)
        .maybeSingle();

      if (error) throw error;
      if (!data) return DEFAULT_PROTOCOL_CONFIG;

      const parsed = protocolConfigSchema.safeParse(data.config);
      return parsed.success
        ? mergeWithDefaults(parsed.data as Partial<ProtocolConfig>)
        : DEFAULT_PROTOCOL_CONFIG;
    },
    enabled: !!instanceId,
  });

  const saveMutation = useMutation({
    mutationFn: async (newConfig: ProtocolConfig) => {
      const { error } = await supabase
        .from('protocol_settings')
        .upsert(
          {
            instance_id: instanceId,
            protocol_type: protocolType,
            config: newConfig,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'instance_id,protocol_type' }
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return {
    config,
    isLoading,
    saveConfig: saveMutation.mutate,
    saveConfigAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
