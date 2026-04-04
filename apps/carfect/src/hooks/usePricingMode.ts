import { useInstanceData } from './useInstanceData';

export type PricingMode = 'netto' | 'brutto';

export const usePricingMode = (instanceId: string | null): PricingMode => {
  const { data: instanceData } = useInstanceData(instanceId);
  return (instanceData as { pricing_mode?: string } | null)?.pricing_mode as PricingMode || 'brutto';
};
