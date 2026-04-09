import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type CalendarView = 'day' | 'week' | 'month';
const QUERY_KEY = ['calendar-view-preference'];

export function useCalendarViewPreference() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: defaultView = 'day' } = useQuery<CalendarView>({
    queryKey: QUERY_KEY,
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('calendar_default_view')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      const value = data?.calendar_default_view;
      if (value === 'week' || value === 'month') return value;
      return 'day';
    },
  });

  const mutation = useMutation({
    mutationFn: async (view: CalendarView) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('profiles')
        .update({ calendar_default_view: view } as Record<string, unknown>)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: (_data, view) => {
      queryClient.setQueryData(QUERY_KEY, view);
    },
  });

  return {
    defaultView,
    saveDefaultView: (view: CalendarView) => mutation.mutate(view),
  };
}
