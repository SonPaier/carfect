import { useState, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AiAnalystResponse, AiAnalystHistoryEntry } from './types';

interface UseAiAnalystOptions {
  instanceId: string;
  schemaContext: 'carfect' | 'hiservice';
  supabaseClient: SupabaseClient;
}

export function useAiAnalyst({ instanceId, schemaContext, supabaseClient }: UseAiAnalystOptions) {
  const [history, setHistory] = useState<AiAnalystHistoryEntry[]>([]);

  const ask = useCallback(
    async (prompt: string) => {
      const entryId = crypto.randomUUID();
      const entry: AiAnalystHistoryEntry = {
        id: entryId,
        prompt,
        response: null,
        loading: true,
      };

      setHistory((prev) => [...prev, entry]);

      try {
        const { data, error } = await supabaseClient.functions.invoke('ai-analyst', {
          body: { prompt, instanceId, schemaContext },
        });

        if (error) throw error;

        setHistory((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, loading: false, response: data as AiAnalystResponse } : e,
          ),
        );
      } catch (err: any) {
        setHistory((prev) =>
          prev.map((e) =>
            e.id === entryId
              ? { ...e, loading: false, error: err?.message || 'Nie udało się przetworzyć zapytania' }
              : e,
          ),
        );
      }
    },
    [instanceId, schemaContext, supabaseClient],
  );

  const clear = useCallback(() => setHistory([]), []);

  return { history, ask, clear };
}
