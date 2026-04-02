import { useInstanceData } from './useInstanceData';

export type PricingMode = 'netto' | 'brutto';

export const usePricingMode = (instanceId: string | null): PricingMode => {
  const { data: instanceData } = useInstanceData(instanceId);
  return (instanceData as any)?.pricing_mode || 'brutto';
};
