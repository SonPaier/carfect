import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BillingData } from '../billing.types';
import type { BillingSupabaseClient } from './supabaseTypes';

export function useBillingData(supabase: BillingSupabaseClient, instanceId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['billing_data', instanceId],
    queryFn: async () => {
      if (!instanceId) throw new Error('instanceId required');
      const { data, error } = await supabase
        .from('instances')
        .select('billing_name, billing_nip, billing_street, billing_postal_code, billing_city')
        .eq('id', instanceId)
        .single() as { data: BillingData | null; error: { message: string } | null };
      if (error) throw error;
      return data as BillingData;
    },
    enabled: !!instanceId,
  });

  const mutation = useMutation({
    mutationFn: async (billingData: BillingData) => {
      if (!instanceId) throw new Error('instanceId required');
      const { error } = await supabase.rpc('update_billing_data', {
        p_instance_id: instanceId,
        p_billing_name: billingData.billing_name,
        p_billing_nip: billingData.billing_nip,
        p_billing_street: billingData.billing_street,
        p_billing_postal_code: billingData.billing_postal_code,
        p_billing_city: billingData.billing_city,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing_data', instanceId] });
    },
  });

  return {
    billingData: query.data ?? null,
    loading: query.isLoading,
    updateBillingData: mutation.mutateAsync,
  };
}
