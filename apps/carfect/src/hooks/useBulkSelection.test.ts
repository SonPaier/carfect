import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useBulkSelection } from './useBulkSelection';

const ALL_IDS = ['a', 'b', 'c'];

describe('useBulkSelection', () => {
  describe('initial state', () => {
    it('starts with empty selectedIds set', () => {
      const { result } = renderHook(() => useBulkSelection());
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('starts with count 0', () => {
      const { result } = renderHook(() => useBulkSelection());
      expect(result.current.count).toBe(0);
    });
  });

  describe('toggle', () => {
    it('adds ID when not selected', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      expect(result.current.selectedIds.has('a')).toBe(true);
    });

    it('removes ID when already selected', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      act(() => result.current.toggle('a'));
      expect(result.current.selectedIds.has('a')).toBe(false);
    });

    it('keeps other IDs when toggling one', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      act(() => result.current.toggle('b'));
      act(() => result.current.toggle('a'));
      expect(result.current.selectedIds.has('b')).toBe(true);
      expect(result.current.selectedIds.has('a')).toBe(false);
    });
  });

  describe('toggleAll', () => {
    it('selects all IDs when none are selected', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggleAll(ALL_IDS));
      expect([...result.current.selectedIds].sort()).toEqual([...ALL_IDS].sort());
    });

    it('deselects all IDs when all are selected', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggleAll(ALL_IDS));
      act(() => result.current.toggleAll(ALL_IDS));
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('selects all when only some are selected (partial selection)', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      act(() => result.current.toggleAll(ALL_IDS));
      expect([...result.current.selectedIds].sort()).toEqual([...ALL_IDS].sort());
    });
  });

  describe('clear', () => {
    it('resets selectedIds to empty', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      act(() => result.current.toggle('b'));
      act(() => result.current.clear());
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('resets count to 0', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      act(() => result.current.clear());
      expect(result.current.count).toBe(0);
    });
  });

  describe('isSelected', () => {
    it('returns true for a selected ID', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      expect(result.current.isSelected('a')).toBe(true);
    });

    it('returns false for an unselected ID', () => {
      const { result } = renderHook(() => useBulkSelection());
      expect(result.current.isSelected('a')).toBe(false);
    });

    it('returns false after toggling an ID off', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      act(() => result.current.toggle('a'));
      expect(result.current.isSelected('a')).toBe(false);
    });
  });

  describe('count', () => {
    it('increments when IDs are added', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      expect(result.current.count).toBe(1);
      act(() => result.current.toggle('b'));
      expect(result.current.count).toBe(2);
    });

    it('decrements when an ID is removed', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      act(() => result.current.toggle('b'));
      act(() => result.current.toggle('a'));
      expect(result.current.count).toBe(1);
    });
  });

  describe('selectionState', () => {
    it('returns "none" when nothing is selected', () => {
      const { result } = renderHook(() => useBulkSelection());
      expect(result.current.selectionState(ALL_IDS)).toBe('none');
    });

    it('returns "none" when allIds is empty', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      expect(result.current.selectionState([])).toBe('none');
    });

    it('returns "all" when all IDs in the list are selected', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggleAll(ALL_IDS));
      expect(result.current.selectionState(ALL_IDS)).toBe('all');
    });

    it('returns "some" when only a subset of IDs are selected', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('a'));
      expect(result.current.selectionState(ALL_IDS)).toBe('some');
    });

    it('returns "none" when selected IDs do not overlap with allIds', () => {
      const { result } = renderHook(() => useBulkSelection());
      act(() => result.current.toggle('z'));
      expect(result.current.selectionState(ALL_IDS)).toBe('none');
    });
  });
});
