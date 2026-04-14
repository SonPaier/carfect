import { useState, useCallback } from 'react';

export interface UseBulkSelectionReturn {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (allIds: string[]) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  count: number;
  /** 'all' | 'some' | 'none' — for header checkbox state */
  selectionState: (allIds: string[]) => 'all' | 'some' | 'none';
}

export function useBulkSelection(): UseBulkSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((allIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = allIds.length > 0 && allIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(allIds);
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const count = selectedIds.size;

  const selectionState = useCallback(
    (allIds: string[]): 'all' | 'some' | 'none' => {
      if (allIds.length === 0 || selectedIds.size === 0) return 'none';
      const selectedCount = allIds.filter((id) => selectedIds.has(id)).length;
      if (selectedCount === allIds.length) return 'all';
      if (selectedCount > 0) return 'some';
      return 'none';
    },
    [selectedIds],
  );

  return { selectedIds, toggle, toggleAll, clear, isSelected, count, selectionState };
}
