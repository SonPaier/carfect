import { supabase } from '@/integrations/supabase/client';
import { useBillingData as useSharedBillingData } from '@shared/billing';

export function useBillingData(instanceId: string | undefined) {
  return useSharedBillingData(supabase, instanceId);
}
