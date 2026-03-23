import { AiAnalystView, type AiAnalystSuggestion } from '@shared/ai';
import { supabase } from '@/integrations/supabase/client';

const SUGGESTIONS: AiAnalystSuggestion[] = [
  {
    label: 'Przychód w tym miesiącu',
    prompt: 'Jaki był mój łączny przychód w bieżącym miesiącu? Podaj sumę i liczbę rezerwacji.',
  },
  {
    label: 'Najpopularniejsze usługi',
    prompt: 'Jakie usługi były najczęściej rezerwowane w ostatnich 30 dniach? Pokaż ranking.',
  },
  {
    label: 'Top klienci',
    prompt:
      'Którzy klienci mieli najwięcej rezerwacji w ostatnich 3 miesiącach? Pokaż top 10 z liczbą wizyt i łączną kwotą.',
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
