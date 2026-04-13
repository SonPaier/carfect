import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useServiceManagement } from './useServiceManagement';

const { eqMock, updateMock, fromMock } = vi.hoisted(() => {
  const eqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
  const fromMock = vi.fn().mockReturnValue({ update: updateMock });
  return { eqMock, updateMock, fromMock };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: fromMock },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

const defaultProps = {
  reservationId: 'res-1',
  currentServiceIds: ['svc-1'],
  currentServiceItems: [{ service_id: 'svc-1', name: 'Mycie', custom_price: null }],
};

describe('useServiceManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });
  });

  it('initializes with savingService false and drawer closed', () => {
    const { result } = renderHook(() => useServiceManagement(defaultProps));

    expect(result.current.savingService).toBe(false);
    expect(result.current.serviceDrawerOpen).toBe(false);
  });

  it('setServiceDrawerOpen toggles drawer', () => {
    const { result } = renderHook(() => useServiceManagement(defaultProps));

    act(() => {
      result.current.setServiceDrawerOpen(true);
    });

    expect(result.current.serviceDrawerOpen).toBe(true);
  });

  it('handleAddServices merges new services with existing ones', async () => {
    const { result } = renderHook(() => useServiceManagement(defaultProps));

    await act(async () => {
      await result.current.handleAddServices(
        ['svc-2'],
        [
          {
            id: 'svc-2',
            name: 'Polerowanie',
            price_small: 100,
            price_medium: 150,
            price_large: 200,
            price_from: null,
          },
        ],
      );
    });

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        service_ids: ['svc-1', 'svc-2'],
      }),
    );
    expect(eqMock).toHaveBeenCalledWith('id', 'res-1');
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('handleAddServices deduplicates already existing service IDs', async () => {
    const { result } = renderHook(() => useServiceManagement(defaultProps));

    await act(async () => {
      await result.current.handleAddServices(
        ['svc-1', 'svc-3'],
        [
          {
            id: 'svc-3',
            name: 'Woskowanie',
            price_small: null,
            price_medium: null,
            price_large: null,
            price_from: 50,
          },
        ],
      );
    });

    const updateCall = updateMock.mock.calls[0][0];
    expect(updateCall.service_ids).toEqual(['svc-1', 'svc-3']);
    expect(updateCall.service_items).toHaveLength(2);
  });

  it('handleRemoveService removes a service and updates DB', async () => {
    const { result } = renderHook(() => useServiceManagement(defaultProps));

    await act(async () => {
      await result.current.handleRemoveService('svc-1');
    });

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        service_ids: [],
        service_items: null,
      }),
    );
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('handleRemoveService keeps remaining services', async () => {
    const props = {
      reservationId: 'res-1',
      currentServiceIds: ['svc-1', 'svc-2'],
      currentServiceItems: [
        { service_id: 'svc-1', name: 'Mycie', custom_price: null },
        { service_id: 'svc-2', name: 'Polerowanie', custom_price: null },
      ],
    };
    const { result } = renderHook(() => useServiceManagement(props));

    await act(async () => {
      await result.current.handleRemoveService('svc-1');
    });

    const updateCall = updateMock.mock.calls[0][0];
    expect(updateCall.service_ids).toEqual(['svc-2']);
    expect(updateCall.service_items).toEqual([
      { service_id: 'svc-2', name: 'Polerowanie', custom_price: null },
    ]);
  });

  it('does nothing when reservationId is null', async () => {
    const { result } = renderHook(() =>
      useServiceManagement({ ...defaultProps, reservationId: null }),
    );

    await act(async () => {
      await result.current.handleAddServices(
        ['svc-2'],
        [
          {
            id: 'svc-2',
            name: 'X',
            price_small: null,
            price_medium: null,
            price_large: null,
            price_from: null,
          },
        ],
      );
    });

    expect(updateMock).not.toHaveBeenCalled();
  });

  it('shows error toast on DB failure', async () => {
    eqMock.mockResolvedValueOnce({ error: { message: 'DB error' } });
    const { result } = renderHook(() => useServiceManagement(defaultProps));

    await act(async () => {
      await result.current.handleAddServices(
        ['svc-2'],
        [
          {
            id: 'svc-2',
            name: 'X',
            price_small: null,
            price_medium: null,
            price_large: null,
            price_from: null,
          },
        ],
      );
    });

    expect(mockToast.error).toHaveBeenCalled();
  });

  it('handleConfirmServices filters only new IDs and closes drawer', async () => {
    const { result } = renderHook(() => useServiceManagement(defaultProps));

    act(() => {
      result.current.setServiceDrawerOpen(true);
    });

    await act(async () => {
      result.current.handleConfirmServices(['svc-1', 'svc-4'], 60, [
        {
          id: 'svc-4',
          name: 'Detailing',
          price_small: null,
          price_medium: null,
          price_large: null,
          price_from: 200,
        },
      ]);
    });

    const updateCall = updateMock.mock.calls[0][0];
    expect(updateCall.service_ids).toEqual(['svc-1', 'svc-4']);
    expect(result.current.serviceDrawerOpen).toBe(false);
  });

  it('handleConfirmServices does not call DB when no new services', async () => {
    const { result } = renderHook(() => useServiceManagement(defaultProps));

    await act(async () => {
      result.current.handleConfirmServices(['svc-1'], 30, []);
    });

    expect(updateMock).not.toHaveBeenCalled();
    expect(result.current.serviceDrawerOpen).toBe(false);
  });
});
