import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useBulkSelection } from './useBulkSelection';

describe('useBulkSelection', () => {
  it('starts with empty selection', () => {
    const { result } = renderHook(() => useBulkSelection());
    expect(result.current.count).toBe(0);
    expect(result.current.isSelected('a')).toBe(false);
  });

  it('toggles individual item', () => {
    const { result } = renderHook(() => useBulkSelection());
    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.count).toBe(1);

    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it('toggleAll selects all when none selected', () => {
    const { result } = renderHook(() => useBulkSelection());
    act(() => result.current.toggleAll(['a', 'b', 'c']));
    expect(result.current.count).toBe(3);
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.isSelected('b')).toBe(true);
    expect(result.current.isSelected('c')).toBe(true);
  });

  it('toggleAll deselects all when all selected', () => {
    const { result } = renderHook(() => useBulkSelection());
    act(() => result.current.toggleAll(['a', 'b']));
    act(() => result.current.toggleAll(['a', 'b']));
    expect(result.current.count).toBe(0);
  });

  it('toggleAll selects all when some selected (indeterminate)', () => {
    const { result } = renderHook(() => useBulkSelection());
    act(() => result.current.toggle('a'));
    act(() => result.current.toggleAll(['a', 'b', 'c']));
    expect(result.current.count).toBe(3);
  });

  it('clear resets selection', () => {
    const { result } = renderHook(() => useBulkSelection());
    act(() => result.current.toggleAll(['a', 'b']));
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });

  it('selectionState returns correct state', () => {
    const { result } = renderHook(() => useBulkSelection());
    const allIds = ['a', 'b', 'c'];

    expect(result.current.selectionState(allIds)).toBe('none');

    act(() => result.current.toggle('a'));
    expect(result.current.selectionState(allIds)).toBe('some');

    act(() => result.current.toggle('b'));
    act(() => result.current.toggle('c'));
    expect(result.current.selectionState(allIds)).toBe('all');
  });
});
