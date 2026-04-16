import { useGusLookup as useGusLookupBase } from '@shared/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useGusLookup() {
  return useGusLookupBase({
    supabase,
    onSuccess: () => toast.success('Dane pobrane z GUS'),
    onError: (msg) => toast.error(msg),
  });
}
