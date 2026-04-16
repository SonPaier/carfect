import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomFieldDefinition, CustomFieldType } from './types';

function queryKey(instanceId: string, context: string) {
  return ['custom_field_definitions', instanceId, context] as const;
}

export function useCustomFields(
  instanceId: string,
  context: string,
  supabase: SupabaseClient
) {
  const queryClient = useQueryClient();
  const key = queryKey(instanceId, context);

  const { data: definitions = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('context', context)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as CustomFieldDefinition[];
    },
    enabled: !!instanceId && !!context,
  });

  const addFieldMutation = useMutation({
    mutationFn: async (def: {
      field_type: CustomFieldType;
      label: string;
      required: boolean;
      sort_order: number;
      config: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from('custom_field_definitions')
        .insert({ ...def, instance_id: instanceId, context });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CustomFieldDefinition> }) => {
      const { error } = await supabase
        .from('custom_field_definitions')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('instance_id', instanceId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const removeFieldMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_field_definitions')
        .delete()
        .eq('id', id)
        .eq('instance_id', instanceId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const reorderFieldsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const updates = ids.map((id, index) =>
        supabase
          .from('custom_field_definitions')
          .update({ sort_order: index })
          .eq('id', id)
          .eq('instance_id', instanceId)
      );
      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.error);
      if (firstError?.error) throw firstError.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return {
    definitions,
    isLoading,
    addField: addFieldMutation.mutate,
    updateField: (id: string, patch: Partial<CustomFieldDefinition>) =>
      updateFieldMutation.mutate({ id, patch }),
    removeField: removeFieldMutation.mutate,
    reorderFields: reorderFieldsMutation.mutate,
  };
}
