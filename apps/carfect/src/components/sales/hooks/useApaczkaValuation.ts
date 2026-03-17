import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { OrderPackage } from './useOrderPackages';

interface ValuationResult {
  price: number | null;
  loading: boolean;
  error: string | null;
}

export function useApaczkaValuation(
  instanceId: string | null,
  pkg: OrderPackage,
  customerPostalCode?: string,
  customerCity?: string,
): ValuationResult {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Only run for shipping packages with dimensions
    if (pkg.shippingMethod !== 'shipping' || !instanceId) {
      setPrice(null);
      setError(null);
      return;
    }

    const dims = pkg.dimensions;
    if (!dims) {
      setPrice(null);
      return;
    }

    // Check if dimensions are complete
    const hasCompleteDimensions =
      pkg.packagingType === 'tuba'
        ? (dims as any).length > 0 && (dims as any).diameter > 0
        : pkg.packagingType === 'koperta'
          ? true // koperta doesn't need dimensions
          : (dims as any).length > 0 && (dims as any).width > 0 && (dims as any).height > 0;

    if (!hasCompleteDimensions) {
      setPrice(null);
      return;
    }

    // Debounce the API call
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
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
          },
        });

        if (fnError) throw fnError;
        if (data?.error) {
          setError(data.error);
          setPrice(null);
        } else if (data?.valuation) {
          // Extract price from valuation response
          const val = data.valuation;
          const priceValue = val?.price?.gross?.amount || val?.price?.net?.amount || null;
          setPrice(priceValue ? Number(priceValue) : null);
        } else {
          setPrice(null);
        }
      } catch (err: any) {
        setError(null); // Don't show errors for valuation - it's informational
        setPrice(null);
      } finally {
        setLoading(false);
      }
    }, 800); // 800ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    instanceId,
    pkg.shippingMethod,
    pkg.packagingType,
    JSON.stringify(pkg.dimensions),
    customerPostalCode,
    customerCity,
  ]);

  return { price, loading, error };
}
