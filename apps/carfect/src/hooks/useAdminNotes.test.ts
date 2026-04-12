import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminNotes } from './useAdminNotes';
import { toast } from 'sonner';

const eqMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
const fromMock = vi.fn().mockReturnValue({ update: updateMock });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useAdminNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });
  });

  it('initializes with provided notes', () => {
    const { result } = renderHook(() =>
      useAdminNotes({
        reservationId: 'res-1',
        initialAdminNotes: 'test note',
        initialCustomerNotes: 'customer note',
      }),
    );

    expect(result.current.adminNotes).toBe('test note');
    expect(result.current.customerNotes).toBe('customer note');
    expect(result.current.editingNotes).toBe(false);
    expect(result.current.savingNotes).toBe(false);
  });

  it('syncs when initial notes change', () => {
    const { result, rerender } = renderHook((props) => useAdminNotes(props), {
      initialProps: {
        reservationId: 'res-1',
        initialAdminNotes: 'old',
        initialCustomerNotes: '',
      },
    });

    expect(result.current.adminNotes).toBe('old');

    rerender({
      reservationId: 'res-1',
      initialAdminNotes: 'new',
      initialCustomerNotes: '',
    });

    expect(result.current.adminNotes).toBe('new');
  });

  it('startEditingNotes sets editingNotes to true', () => {
    const { result } = renderHook(() =>
      useAdminNotes({
        reservationId: 'res-1',
        initialAdminNotes: '',
        initialCustomerNotes: '',
      }),
    );

    act(() => {
      result.current.startEditingNotes();
    });

    expect(result.current.editingNotes).toBe(true);
  });

  it('setAdminNotes updates the value', () => {
    const { result } = renderHook(() =>
      useAdminNotes({
        reservationId: 'res-1',
        initialAdminNotes: '',
        initialCustomerNotes: '',
      }),
    );

    act(() => {
      result.current.setAdminNotes('updated note');
    });

    expect(result.current.adminNotes).toBe('updated note');
  });

  describe('handleSaveAdminNotes', () => {
    it('calls supabase update with current notes and shows success toast', async () => {
      const { result } = renderHook(() =>
        useAdminNotes({
          reservationId: 'res-1',
          initialAdminNotes: 'initial note',
          initialCustomerNotes: '',
        }),
      );

      act(() => {
        result.current.setAdminNotes('updated note');
        result.current.startEditingNotes();
      });

      await act(async () => {
        await result.current.handleSaveAdminNotes();
      });

      expect(fromMock).toHaveBeenCalledWith('reservations');
      expect(updateMock).toHaveBeenCalledWith({ admin_notes: 'updated note' });
      expect(eqMock).toHaveBeenCalledWith('id', 'res-1');
      expect(toast.success).toHaveBeenCalledWith('common.saved');
      expect(result.current.editingNotes).toBe(false);
    });

    it('returns early when reservationId is null', async () => {
      const { result } = renderHook(() =>
        useAdminNotes({
          reservationId: null,
          initialAdminNotes: 'some note',
          initialCustomerNotes: '',
        }),
      );

      await act(async () => {
        await result.current.handleSaveAdminNotes();
      });

      expect(fromMock).not.toHaveBeenCalled();
    });

    it('shows error toast when supabase returns error', async () => {
      eqMock.mockResolvedValueOnce({ error: new Error('DB error') });

      const { result } = renderHook(() =>
        useAdminNotes({
          reservationId: 'res-1',
          initialAdminNotes: '',
          initialCustomerNotes: '',
        }),
      );

      await act(async () => {
        await result.current.handleSaveAdminNotes();
      });

      expect(toast.error).toHaveBeenCalledWith('common.error');
      expect(result.current.savingNotes).toBe(false);
    });

    it('sets savingNotes to true during save and false after', async () => {
      let resolveSave!: (value: { error: null }) => void;
      eqMock.mockReturnValueOnce(
        new Promise<{ error: null }>((resolve) => {
          resolveSave = resolve;
        }),
      );

      const { result } = renderHook(() =>
        useAdminNotes({
          reservationId: 'res-1',
          initialAdminNotes: '',
          initialCustomerNotes: '',
        }),
      );

      let savePromise!: Promise<void>;
      act(() => {
        savePromise = result.current.handleSaveAdminNotes();
      });

      expect(result.current.savingNotes).toBe(true);

      await act(async () => {
        resolveSave({ error: null });
        await savePromise;
      });

      expect(result.current.savingNotes).toBe(false);
    });
  });

  describe('handleNotesBlur', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('auto-saves when notes changed from initial value', async () => {
      const { result } = renderHook(() =>
        useAdminNotes({
          reservationId: 'res-1',
          initialAdminNotes: 'original',
          initialCustomerNotes: '',
        }),
      );

      act(() => {
        result.current.startEditingNotes();
        result.current.setAdminNotes('modified');
      });

      act(() => {
        result.current.handleNotesBlur();
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(fromMock).toHaveBeenCalledWith('reservations');
      expect(updateMock).toHaveBeenCalledWith({ admin_notes: 'modified' });
    });

    it('does not save when notes unchanged', async () => {
      const { result } = renderHook(() =>
        useAdminNotes({
          reservationId: 'res-1',
          initialAdminNotes: 'original',
          initialCustomerNotes: '',
        }),
      );

      act(() => {
        result.current.startEditingNotes();
        // notes remain 'original' — same as initialAdminNotes
      });

      act(() => {
        result.current.handleNotesBlur();
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(fromMock).not.toHaveBeenCalled();
    });

    it('resets editingNotes to false when notes unchanged', async () => {
      const { result } = renderHook(() =>
        useAdminNotes({
          reservationId: 'res-1',
          initialAdminNotes: 'original',
          initialCustomerNotes: '',
        }),
      );

      act(() => {
        result.current.startEditingNotes();
      });

      expect(result.current.editingNotes).toBe(true);

      act(() => {
        result.current.handleNotesBlur();
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.editingNotes).toBe(false);
    });
  });
});
