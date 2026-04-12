import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmployeeAssignment } from './useEmployeeAssignment';

vi.mock('@/integrations/supabase/client', () => {
  const eqMock = vi.fn().mockResolvedValue({ error: null });
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: eqMock }),
      }),
    },
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useEmployeeAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with provided employee IDs', () => {
    const { result } = renderHook(() =>
      useEmployeeAssignment({
        reservationId: 'res-1',
        initialEmployeeIds: ['emp-1', 'emp-2'],
      }),
    );

    expect(result.current.localAssignedEmployeeIds).toEqual(['emp-1', 'emp-2']);
    expect(result.current.savingEmployees).toBe(false);
    expect(result.current.employeeDrawerOpen).toBe(false);
  });

  it('syncs when initial employee IDs change', () => {
    const { result, rerender } = renderHook((props) => useEmployeeAssignment(props), {
      initialProps: {
        reservationId: 'res-1',
        initialEmployeeIds: ['emp-1'],
      },
    });

    expect(result.current.localAssignedEmployeeIds).toEqual(['emp-1']);

    rerender({
      reservationId: 'res-1',
      initialEmployeeIds: ['emp-1', 'emp-3'],
    });

    expect(result.current.localAssignedEmployeeIds).toEqual(['emp-1', 'emp-3']);
  });

  it('setEmployeeDrawerOpen toggles drawer', () => {
    const { result } = renderHook(() =>
      useEmployeeAssignment({
        reservationId: 'res-1',
        initialEmployeeIds: [],
      }),
    );

    act(() => {
      result.current.setEmployeeDrawerOpen(true);
    });

    expect(result.current.employeeDrawerOpen).toBe(true);
  });
});
