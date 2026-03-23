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
      api: '/api/ai-analyst',
      headers: async () => {
        const { data } = await supabaseClient.auth.getSession();
        return {
          Authorization: `Bearer ${data.session?.access_token || ''}`,
        };
      },
      body: { instanceId, schemaContext },
    });
  }, [instanceId, schemaContext, supabaseClient]);

  return useChat({ transport });
}
