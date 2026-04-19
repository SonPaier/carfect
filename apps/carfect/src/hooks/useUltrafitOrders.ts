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
      const { data, error } = await supabase.functions.invoke('ultrafit-orders', {
        body: { page, pageSize, search },
      });
      if (error) throw error;
      return data as UltrafitOrdersResponse;
    },
    enabled,
  });
}
