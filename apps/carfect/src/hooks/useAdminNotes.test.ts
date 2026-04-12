import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminNotes } from './useAdminNotes';

vi.mock('@/integrations/supabase/client', () => {
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        update: updateMock,
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

describe('useAdminNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
