import { useGusLookup as useGusLookupBase } from '@shared/utils';
import { toast } from 'sonner';

export function useGusLookup() {
  return useGusLookupBase({
    onSuccess: () => toast.success('Dane pobrane z GUS'),
    onError: (msg) => toast.error(msg),
  });
}
