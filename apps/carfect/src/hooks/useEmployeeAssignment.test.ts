import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmployeeAssignment } from './useEmployeeAssignment';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const { eqMock, updateMock, fromMock } = vi.hoisted(() => {
  const eqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
  const fromMock = vi.fn().mockReturnValue({ update: updateMock });
  return { eqMock, updateMock, fromMock };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useEmployeeAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });
    eqMock.mockResolvedValue({ error: null });
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

  describe('handleEmployeeSelect', () => {
    it('calls supabase update with employee IDs and shows success toast', async () => {
      const { result } = renderHook(() =>
        useEmployeeAssignment({
          reservationId: 'res-1',
          initialEmployeeIds: [],
        }),
      );

      await act(async () => {
        await result.current.handleEmployeeSelect(['emp-1', 'emp-2']);
      });

      expect(supabase.from).toHaveBeenCalledWith('reservations');
      expect(updateMock).toHaveBeenCalledWith({ assigned_employee_ids: ['emp-1', 'emp-2'] });
      expect(eqMock).toHaveBeenCalledWith('id', 'res-1');
      expect(toast.success).toHaveBeenCalledWith('common.saved');
      expect(result.current.localAssignedEmployeeIds).toEqual(['emp-1', 'emp-2']);
    });

    it('returns early when reservationId is null', async () => {
      const { result } = renderHook(() =>
        useEmployeeAssignment({
          reservationId: null,
          initialEmployeeIds: [],
        }),
      );

      await act(async () => {
        await result.current.handleEmployeeSelect(['emp-1']);
      });

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('shows error toast on DB failure', async () => {
      eqMock.mockResolvedValue({ error: new Error('DB error') });

      const { result } = renderHook(() =>
        useEmployeeAssignment({
          reservationId: 'res-1',
          initialEmployeeIds: [],
        }),
      );

      await act(async () => {
        await result.current.handleEmployeeSelect(['emp-1']);
      });

      expect(toast.error).toHaveBeenCalledWith('common.error');
      expect(result.current.savingEmployees).toBe(false);
    });

    it('sets savingEmployees to true during save and false after', async () => {
      let resolveSave!: (value: { error: null }) => void;
      eqMock.mockReturnValue(
        new Promise<{ error: null }>((resolve) => {
          resolveSave = resolve;
        }),
      );

      const { result } = renderHook(() =>
        useEmployeeAssignment({
          reservationId: 'res-1',
          initialEmployeeIds: [],
        }),
      );

      let savePromise!: Promise<void>;
      act(() => {
        savePromise = result.current.handleEmployeeSelect(['emp-1']);
      });

      expect(result.current.savingEmployees).toBe(true);

      await act(async () => {
        resolveSave({ error: null });
        await savePromise;
      });

      expect(result.current.savingEmployees).toBe(false);
    });
  });

  describe('handleRemoveEmployee', () => {
    it('removes employee from list and saves to DB', async () => {
      const { result } = renderHook(() =>
        useEmployeeAssignment({
          reservationId: 'res-1',
          initialEmployeeIds: ['emp-1', 'emp-2'],
        }),
      );

      await act(async () => {
        await result.current.handleRemoveEmployee('emp-1');
      });

      expect(updateMock).toHaveBeenCalledWith({ assigned_employee_ids: ['emp-2'] });
      expect(eqMock).toHaveBeenCalledWith('id', 'res-1');
      expect(result.current.localAssignedEmployeeIds).toEqual(['emp-2']);
    });

    it('handles removing last employee (empty array)', async () => {
      const { result } = renderHook(() =>
        useEmployeeAssignment({
          reservationId: 'res-1',
          initialEmployeeIds: ['emp-1'],
        }),
      );

      await act(async () => {
        await result.current.handleRemoveEmployee('emp-1');
      });

      expect(updateMock).toHaveBeenCalledWith({ assigned_employee_ids: [] });
      expect(eqMock).toHaveBeenCalledWith('id', 'res-1');
      expect(result.current.localAssignedEmployeeIds).toEqual([]);
    });
  });
});
