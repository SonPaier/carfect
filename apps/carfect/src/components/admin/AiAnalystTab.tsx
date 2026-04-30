import { useMemo } from 'react';
import { AiAnalystView, type AiAnalystSuggestion } from '@shared/ai';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const SUGGESTION_KEYS = [
  'revenue',
  'revenueYear',
  'revenueByMonth',
  'popularServices',
  'servicesRanking',
  'topClients',
  'offersConversion',
  'noShowRate',
  'avgRevenue',
] as const;

interface AiAnalystTabProps {
  instanceId: string;
}

const AiAnalystTab = ({ instanceId }: AiAnalystTabProps) => {
  const { t } = useTranslation();
  const suggestions = useMemo<AiAnalystSuggestion[]>(
    () =>
      SUGGESTION_KEYS.map((key) => ({
        label: t(`aiAnalyst.suggestions.${key}`),
        prompt: t(`aiAnalyst.prompts.${key}`),
      })),
    [t],
  );
  return (
    <AiAnalystView
      instanceId={instanceId}
      suggestions={suggestions}
      schemaContext="carfect"
      supabaseClient={supabase}
    />
  );
};

export default AiAnalystTab;
