import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ViewMode = 'day' | 'week' | 'month';
type GroupBy = 'station' | 'employee' | 'none';

interface ViewConfig {
  grouping_mode: GroupBy;
  compact_mode: boolean;
  show_notes_in_bars: boolean;
  hidden_stations: string[];
}

type CalendarConfig = Partial<Record<ViewMode, Partial<ViewConfig>>>;

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  grouping_mode: 'station',
  compact_mode: false,
  show_notes_in_bars: false,
  hidden_stations: [],
};

export function getViewConfig(config: CalendarConfig, view: ViewMode): ViewConfig {
  return { ...DEFAULT_VIEW_CONFIG, ...config[view] };
}

export function mergeViewConfig(
  config: CalendarConfig,
  view: ViewMode,
  partial: Partial<ViewConfig>,
): CalendarConfig {
  return {
    ...config,
    [view]: { ...getViewConfig(config, view), ...partial },
  };
}

export function toggleInSet(arr: string[], item: string): string[] {
  const set = new Set(arr);
  if (set.has(item)) set.delete(item);
  else set.add(item);
  return [...set];
}

const QUERY_KEY_PREFIX = 'calendar-config';

export function useCalendarConfig(instanceId: string | null | undefined) {
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch config from DB
  const { data: dbConfig = {} } = useQuery<CalendarConfig>({
    queryKey: [QUERY_KEY_PREFIX, instanceId],
    enabled: !!instanceId,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instances')
        .select('calendar_config')
        .eq('id', instanceId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.calendar_config as CalendarConfig) || {};
    },
  });

  // Local state mirrors DB — allows instant UI updates before save
  const [localConfig, setLocalConfig] = useState<CalendarConfig>(dbConfig);

  // Sync local state when DB data arrives
  useEffect(() => {
    setLocalConfig(dbConfig);
  }, [dbConfig]);

  // Save mutation — debounced
  const mutation = useMutation({
    mutationFn: async (config: CalendarConfig) => {
      if (!instanceId) return;
      const { error } = await supabase
        .from('instances')
        .update({ calendar_config: config } as Record<string, unknown>)
        .eq('id', instanceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData([QUERY_KEY_PREFIX, instanceId], localConfig);
    },
  });

  const saveConfig = useCallback(
    (config: CalendarConfig) => {
      setLocalConfig(config);
      // Debounce DB writes — 500ms
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        mutation.mutate(config);
      }, 500);
    },
    [mutation],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateViewConfig = useCallback(
    (view: ViewMode, partial: Partial<ViewConfig>) => {
      const newConfig = mergeViewConfig(localConfig, view, partial);
      saveConfig(newConfig);
    },
    [localConfig, saveConfig],
  );

  // Convenience getters for a specific view
  const getGroupingMode = useCallback(
    (view: ViewMode): GroupBy => getViewConfig(localConfig, view).grouping_mode,
    [localConfig],
  );

  const getCompactMode = useCallback(
    (view: ViewMode): boolean => getViewConfig(localConfig, view).compact_mode,
    [localConfig],
  );

  const getShowNotesInBars = useCallback(
    (view: ViewMode): boolean => getViewConfig(localConfig, view).show_notes_in_bars,
    [localConfig],
  );

  const getHiddenStations = useCallback(
    (view: ViewMode): Set<string> => new Set(getViewConfig(localConfig, view).hidden_stations),
    [localConfig],
  );

  // Convenience setters
  const setGroupingMode = useCallback(
    (view: ViewMode, mode: GroupBy) => updateViewConfig(view, { grouping_mode: mode }),
    [updateViewConfig],
  );

  const toggleCompactMode = useCallback(
    (view: ViewMode) => {
      const current = getViewConfig(localConfig, view).compact_mode;
      updateViewConfig(view, { compact_mode: !current });
    },
    [localConfig, updateViewConfig],
  );

  const toggleShowNotesInBars = useCallback(
    (view: ViewMode) => {
      const current = getViewConfig(localConfig, view).show_notes_in_bars;
      updateViewConfig(view, { show_notes_in_bars: !current });
    },
    [localConfig, updateViewConfig],
  );

  const toggleStationVisibility = useCallback(
    (view: ViewMode, stationId: string) => {
      const current = getViewConfig(localConfig, view).hidden_stations;
      updateViewConfig(view, { hidden_stations: toggleInSet(current, stationId) });
    },
    [localConfig, updateViewConfig],
  );

  const showAllStations = useCallback(
    (view: ViewMode) => updateViewConfig(view, { hidden_stations: [] }),
    [updateViewConfig],
  );

  return {
    getGroupingMode,
    getCompactMode,
    getShowNotesInBars,
    getHiddenStations,
    setGroupingMode,
    toggleCompactMode,
    toggleShowNotesInBars,
    toggleStationVisibility,
    showAllStations,
  };
}
