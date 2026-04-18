import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UltrafitOrdersResponse } from '@/types/ultrafit';

interface UseUltrafitOrdersParams {
  page: number;
  pageSize: number;
  search: string;
  enabled?: boolean;
}

export function useUltrafitOrders({ page, pageSize, search, enabled = true }: UseUltrafitOrdersParams) {
  return useQuery<UltrafitOrdersResponse>({
    queryKey: ['ultrafit_orders', page, pageSize, search],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ultrafit-orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ page, pageSize, search }),
        },
      );
      if (!res.ok) throw new Error(`ultrafit-orders error ${res.status}`);
      return res.json() as Promise<UltrafitOrdersResponse>;
    },
    enabled,
  });
}
