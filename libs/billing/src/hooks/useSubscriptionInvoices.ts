import { useQuery } from '@tanstack/react-query';
import type { SubscriptionInvoice } from '../billing.types';
import type { BillingSupabaseClient } from './supabaseTypes';

export function useSubscriptionInvoices(
  supabase: BillingSupabaseClient,
  instanceId: string | undefined,
  page: number,
  pageSize: number,
) {
  return useQuery({
    queryKey: ['subscription_invoices', instanceId, page, pageSize],
    queryFn: async () => {
      if (!instanceId) throw new Error('instanceId required');
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const result = await supabase
        .from('subscription_invoices')
        .select('*', { count: 'exact' })
        .eq('instance_id', instanceId)
        .order('invoice_issue_date', { ascending: false })
        .range(from, to) as unknown as { data: SubscriptionInvoice[] | null; count: number | null; error: { message: string } | null };
      if (result.error) throw result.error;
      return { invoices: result.data ?? [], totalCount: result.count ?? 0 };
    },
    enabled: !!instanceId,
  });
}
