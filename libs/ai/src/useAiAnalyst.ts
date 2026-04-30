import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

interface UseAiAnalystOptions {
  instanceId: string;
  schemaContext: 'carfect' | 'hiservice';
  supabaseClient: SupabaseClient;
}

export function useAiAnalyst({ instanceId, schemaContext, supabaseClient }: UseAiAnalystOptions) {
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/ai-analyst-v2',
      headers: async () => {
        const { data } = await supabaseClient.auth.getSession();
        return {
          Authorization: `Bearer ${data.session?.access_token ?? ''}`,
          'X-Carfect-Instance': instanceId,
        };
      },
    });
  }, [instanceId, supabaseClient]);
  void schemaContext; // Server resolves this from instance config; kept in signature for v1 compat.
  return useChat({ transport });
}
