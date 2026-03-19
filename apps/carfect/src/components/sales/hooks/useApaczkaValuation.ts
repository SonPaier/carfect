import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { OrderPackage } from './useOrderPackages';

interface ValuationResult {
  loading: boolean;
  error: string | null;
  fetchValuation: () => Promise<number | null>;
}

export function useApaczkaValuation(
  instanceId: string | null,
  pkg: OrderPackage,
  customerPostalCode?: string,
  customerCity?: string,
  paymentMethod?: string,
  totalGross?: number,
  bankAccountNumber?: string,
): ValuationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchValuation = useCallback(async (): Promise<number | null> => {
    if (pkg.shippingMethod !== 'shipping' || !instanceId) return null;

    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('apaczka-valuation', {
        body: {
          instanceId,
          packages: [pkg],
          customerAddress: {
            postal_code: customerPostalCode || '00-001',
            city: customerCity || 'Warszawa',
          },
          paymentMethod: paymentMethod || 'transfer',
          totalGross: totalGross || 0,
          bankAccountNumber: bankAccountNumber || '',
        },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
        return null;
      }
      if (data?.valuation) {
        const val = data.valuation;
        // Try price_table format: { "serviceId": { price_gross: 2134 } } (value in grosze)
        if (val?.price_table) {
          const firstEntry = Object.values(val.price_table)[0] as any;
          const grossGrosze = firstEntry?.price_gross ?? firstEntry?.price ?? null;
          return grossGrosze != null ? Number(grossGrosze) / 100 : null;
        }
        // Fallback: price.gross.amount format
        const priceValue = val?.price?.gross?.amount || val?.price?.net?.amount || null;
        return priceValue ? Number(priceValue) : null;
      }
      return null;
    } catch {
      setError('Nie udało się pobrać wyceny');
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    instanceId,
    pkg,
    customerPostalCode,
    customerCity,
    paymentMethod,
    totalGross,
    bankAccountNumber,
  ]);

  return { loading, error, fetchValuation };
}
