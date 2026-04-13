import { useState, useEffect, useCallback, useMemo } from 'react';

type ViewMode = 'day' | 'week' | 'month';

interface UseCalendarVisibilityOptions {
  viewMode: ViewMode;
  stations: { id: string }[];
}

interface UseCalendarVisibilityReturn {
  /** Hidden station IDs for the current view mode */
  hiddenStationIds: Set<string>;
  /** Whether any stations are hidden in the current view mode */
  hasHiddenStations: boolean;
  /** Visible stations (filtered from input) */
  visibleStations: { id: string }[];
  /** Toggle a single station's visibility for the current view mode */
  toggleStationVisibility: (stationId: string) => void;
  /** Show all stations for the current view mode */
  showAllStations: () => void;
  /** Whether to show admin notes on swim lane bars (week/month) */
  showNotesInBars: boolean;
  /** Toggle notes display */
  toggleShowNotesInBars: () => void;
}

export function useCalendarVisibility<T extends { id: string }>({
  viewMode,
  stations,
}: UseCalendarVisibilityOptions & { stations: T[] }): UseCalendarVisibilityReturn & {
  visibleStations: T[];
} {
  // Per-view hidden stations
  const [hiddenStationsMap, setHiddenStationsMap] = useState<Record<string, Set<string>>>(() => {
    const result: Record<string, Set<string>> = {};
    for (const v of ['day', 'week', 'month'] as const) {
      const saved = localStorage.getItem(`calendar-hidden-stations-${v}`);
      result[v] = saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return result;
  });

  const hiddenStationIds = hiddenStationsMap[viewMode] || new Set<string>();

  // Persist
  useEffect(() => {
    for (const [view, ids] of Object.entries(hiddenStationsMap)) {
      localStorage.setItem(`calendar-hidden-stations-${view}`, JSON.stringify([...ids]));
    }
  }, [hiddenStationsMap]);

  const toggleStationVisibility = useCallback(
    (stationId: string) => {
      setHiddenStationsMap((prev) => {
        const current = prev[viewMode] || new Set<string>();
        const newSet = new Set(current);
        if (newSet.has(stationId)) newSet.delete(stationId);
        else newSet.add(stationId);
        return { ...prev, [viewMode]: newSet };
      });
    },
    [viewMode],
  );

  const showAllStations = useCallback(() => {
    setHiddenStationsMap((prev) => ({ ...prev, [viewMode]: new Set() }));
  }, [viewMode]);

  // Show notes in bars
  const [showNotesInBars, setShowNotesInBars] = useState(() => {
    return localStorage.getItem('calendar-show-notes-in-bars') === 'true';
  });

  const toggleShowNotesInBars = useCallback(() => {
    setShowNotesInBars((prev) => {
      const next = !prev;
      localStorage.setItem('calendar-show-notes-in-bars', String(next));
      return next;
    });
  }, []);

  const visibleStations = stations.filter((s) => !hiddenStationIds.has(s.id));
  const hasHiddenStations = hiddenStationIds.size > 0;

  return {
    hiddenStationIds,
    hasHiddenStations,
    visibleStations,
    toggleStationVisibility,
    showAllStations,
    showNotesInBars,
    toggleShowNotesInBars,
  };
}
