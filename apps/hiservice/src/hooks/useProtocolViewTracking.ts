import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useProtocolViewTracking(
  protocolId: string | undefined,
  instanceId: string | undefined,
  token: string | undefined
) {
  const viewIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!protocolId || !instanceId || !token) return;

    const clientId = crypto.randomUUID();

    const init = async () => {
      const { error } = await supabase
        .from('protocol_views')
        .insert({
          id: clientId,
          protocol_id: protocolId,
          instance_id: instanceId,
        });

      if (!error) {
        viewIdRef.current = clientId;
        startTimeRef.current = Date.now();
      } else {
        console.error('protocol_views insert failed:', error.message);
      }

      await supabase.rpc('mark_protocol_viewed', { p_token: token });
    };

    init();

    const updateDuration = () => {
      if (!viewIdRef.current) return;
      const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      supabase
        .from('protocol_views')
        .update({ duration_seconds: seconds })
        .eq('id', viewIdRef.current)
        .then(() => {});
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') updateDuration();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', updateDuration);

    return () => {
      updateDuration();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', updateDuration);
    };
  }, [protocolId, instanceId, token]);
}
