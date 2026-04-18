import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UltrafitRoll } from '@/types/ultrafit';

interface UltrafitOrderRollsResponse {
  rolls: UltrafitRoll[];
}

interface UseUltrafitOrderRollsParams {
  orderId: string | null;
  enabled?: boolean;
}

export function useUltrafitOrderRolls({ orderId, enabled = false }: UseUltrafitOrderRollsParams) {
  return useQuery<UltrafitOrderRollsResponse>({
    queryKey: ['ultrafit_order_rolls', orderId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ultrafit-order-rolls', {
        body: { orderId },
      });
      if (error) throw error;
      return data as UltrafitOrderRollsResponse;
    },
    enabled: !!orderId && enabled,
  });
}
