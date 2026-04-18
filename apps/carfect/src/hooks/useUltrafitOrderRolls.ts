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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ultrafit-order-rolls`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ orderId }),
        },
      );
      if (!res.ok) throw new Error(`ultrafit-order-rolls error ${res.status}`);
      return res.json() as Promise<UltrafitOrderRollsResponse>;
    },
    enabled: !!orderId && enabled,
  });
}
