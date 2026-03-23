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
    // Access internal properties for URL and key
    const supabaseUrl = (supabaseClient as any).supabaseUrl as string;
    const supabaseKey = (supabaseClient as any).supabaseKey as string;

    return new DefaultChatTransport({
      api: `${supabaseUrl}/functions/v1/ai-analyst`,
      headers: async () => {
        const { data } = await supabaseClient.auth.getSession();
        return {
          Authorization: `Bearer ${data.session?.access_token || ''}`,
          apikey: supabaseKey,
        };
      },
      body: { instanceId, schemaContext },
    });
  }, [instanceId, schemaContext, supabaseClient]);

  return useChat({ transport });
}
