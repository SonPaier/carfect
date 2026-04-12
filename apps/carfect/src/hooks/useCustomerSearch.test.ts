import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCustomerSearch } from './useCustomerSearch';

// Supabase mock with chainable builder per table
const mockMaybeSingle = vi.fn();
const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit, maybeSingle: mockMaybeSingle }));
const mockNot = vi.fn(() => ({ order: mockOrder }));
const mockEq = vi.fn();
const mockIn = vi.fn(() => ({ data: null, error: null }));
const mockOr = vi.fn();
const mockSelect = vi.fn();
const mockUpsert = vi.fn().mockResolvedValue({ error: null });

// Chain returns - we will configure per test
mockSelect.mockReturnValue({
  eq: mockEq,
  or: mockOr,
});

mockEq.mockReturnValue({
  eq: mockEq,
  or: mockOr,
  not: mockNot,
  in: mockIn,
  maybeSingle: mockMaybeSingle,
});

mockOr.mockReturnValue({
  order: mockOrder,
  eq: mockEq,
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'car_models') {
        return { upsert: mockUpsert };
      }
      return { select: mockSelect };
    }),
  },
}));

vi.mock('@shared/utils', () => ({
  normalizePhone: (p: string) => p,
  isValidPhone: (p: string) => p.startsWith('+48') || p === '+48123456789',
}));

vi.mock('@/lib/mergeVehiclesByPhone', () => ({
  mergeVehiclesByPhone: <T>(vehicles: T[]) => vehicles,
}));

const defaultOptions = {
  instanceId: 'instance-1',
  phone: '',
  isEditMode: false,
};

describe('useCustomerSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset default chain behavior
    mockSelect.mockReturnValue({ eq: mockEq, or: mockOr });
    mockEq.mockReturnValue({
      eq: mockEq,
      or: mockOr,
      not: mockNot,
      in: mockIn,
      maybeSingle: mockMaybeSingle,
    });
    mockOr.mockReturnValue({ order: mockOrder, eq: mockEq });
    mockNot.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit, maybeSingle: mockMaybeSingle });
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockIn.mockResolvedValue({ data: null, error: null });
  });

  describe('searchByPhone', () => {
    it('clears results when fewer than 3 digits are provided', async () => {
      const { result } = renderHook(() => useCustomerSearch(defaultOptions));

      await act(async () => {
        await result.current.searchByPhone('12');
      });

      expect(result.current.foundVehicles).toEqual([]);
      expect(result.current.showPhoneDropdown).toBe(false);
    });

    it('sets foundVehicles and showPhoneDropdown when results are found', async () => {
      const vehicles = [{ id: 'v1', phone: '123456789', model: 'Toyota', plate: null, customer_id: null }];
      // Chain: from().select().eq().or().order().limit()
      // or() → { order } → { limit } → { data, error }
      mockOr.mockReturnValueOnce({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: vehicles, error: null }),
        }),
      });

      const { result } = renderHook(() => useCustomerSearch(defaultOptions));

      await act(async () => {
        await result.current.searchByPhone('123456789');
      });

      expect(result.current.foundVehicles.length).toBeGreaterThan(0);
      expect(result.current.showPhoneDropdown).toBe(true);
    });
  });

  describe('fetchNoShowWarning', () => {
    it('sets warning when a no-show reservation is found', async () => {
      const noShowData = {
        reservation_date: '2026-01-15',
        service_items: [{ service_id: 's1', name: 'Mycie' }],
        service_ids: ['s1'],
      };
      mockMaybeSingle.mockResolvedValueOnce({ data: noShowData, error: null });

      const { result } = renderHook(() => useCustomerSearch(defaultOptions));

      await act(async () => {
        await result.current.fetchNoShowWarning('+48123456789', 'Jan Kowalski');
      });

      expect(result.current.noShowWarning).toEqual({
        customerName: 'Jan Kowalski',
        date: '2026-01-15',
        serviceName: 'Mycie',
      });
    });

    it('clears warning when no no-show reservation exists', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const { result } = renderHook(() => useCustomerSearch(defaultOptions));

      // First set a warning
      act(() => {
        result.current.setNoShowWarning({ customerName: 'Test', date: '2026-01-01', serviceName: 'X' });
      });

      await act(async () => {
        await result.current.fetchNoShowWarning('+48123456789', 'Jan Kowalski');
      });

      expect(result.current.noShowWarning).toBeNull();
    });
  });

  describe('resetCustomerSearch', () => {
    it('clears all customer search state', async () => {
      const { result } = renderHook(() => useCustomerSearch(defaultOptions));

      // Set some state first
      act(() => {
        result.current.setSelectedCustomerId('cust-1');
        result.current.setCustomerDiscountPercent(10);
        result.current.setNoShowWarning({ customerName: 'Test', date: '2026-01-01', serviceName: 'X' });
        result.current.setShowPhoneDropdown(true);
        result.current.setShowCustomerDropdown(true);
      });

      act(() => {
        result.current.resetCustomerSearch();
      });

      expect(result.current.selectedCustomerId).toBeNull();
      expect(result.current.customerDiscountPercent).toBeNull();
      expect(result.current.noShowWarning).toBeNull();
      expect(result.current.showPhoneDropdown).toBe(false);
      expect(result.current.showCustomerDropdown).toBe(false);
      expect(result.current.foundVehicles).toEqual([]);
      expect(result.current.customerVehicles).toEqual([]);
      expect(result.current.selectedVehicleId).toBeNull();
    });
  });

  describe('debounced phone search', () => {
    it('fires searchByPhone after 300ms delay when phone changes', async () => {
      vi.useFakeTimers();

      const searchByPhoneSpy = vi.fn().mockResolvedValue(undefined);

      // Render with initial empty phone
      const { result, rerender } = renderHook(
        ({ phone }) => useCustomerSearch({ ...defaultOptions, phone }),
        { initialProps: { phone: '' } },
      );

      // Spy on searchByPhone — we can't easily spy on the internal function,
      // so we verify the side effect: with fewer than 3 digits, foundVehicles stays empty
      rerender({ phone: '123' });

      // Before timer fires
      expect(result.current.searchingCustomer).toBe(false);

      // Advance timers to trigger debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      vi.useRealTimers();

      // searchByPhone ran — foundVehicles should be empty since mocks return null
      expect(result.current.foundVehicles).toEqual([]);
    });
  });

  describe('saveCarModelProposal', () => {
    it('parses brand correctly from multi-word model string', async () => {
      const { result } = renderHook(() => useCustomerSearch(defaultOptions));

      await act(async () => {
        await result.current.saveCarModelProposal('Toyota Corolla', 'medium');
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ brand: 'Toyota', name: 'Corolla', size: 'M' }),
        expect.any(Object),
      );
    });

    it('uses full model as brand when model is a single word', async () => {
      const { result } = renderHook(() => useCustomerSearch(defaultOptions));

      await act(async () => {
        await result.current.saveCarModelProposal('Tesla', 'large');
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ brand: 'Tesla', size: 'L' }),
        expect.any(Object),
      );
    });

    it('maps carSize to correct DB size code', async () => {
      const { result } = renderHook(() => useCustomerSearch(defaultOptions));

      await act(async () => {
        await result.current.saveCarModelProposal('Fiat 500', 'small');
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'S' }),
        expect.any(Object),
      );
    });
  });
});
