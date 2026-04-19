import { AiAnalystView, type AiAnalystSuggestion } from '@shared/ai';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const SUGGESTIONS: AiAnalystSuggestion[] = [
  {
    label: t('ai.revenueThisMonth'),
    prompt: t('ai.revenuePrompt'),
  },
  {
    label: t('ai.popularServices'),
    prompt: t('ai.popularServicesPrompt'),
  },
  {
    label: 'Top klienci',
    prompt:
      t('ai.topCustomersPrompt'),
  },
];

interface AiAnalystTabProps {
  instanceId: string;
}

const AiAnalystTab = ({ instanceId }: AiAnalystTabProps) => {
  return (
    <AiAnalystView
      instanceId={instanceId}
      suggestions={SUGGESTIONS}
      schemaContext="carfect"
      supabaseClient={supabase}
    />
  );
};

export default AiAnalystTab;
