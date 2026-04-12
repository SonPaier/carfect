import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionInvoices as useSharedSubscriptionInvoices } from '@shared/billing';

export function useSubscriptionInvoices(instanceId: string | undefined, page: number, pageSize: number) {
  return useSharedSubscriptionInvoices(supabase, instanceId, page, pageSize);
}
