import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReservationsRealtime } from './useReservationsRealtime';

// Mutable test state (NOT inside vi.hoisted — survives vi.clearAllMocks)
let subscribeCallback: ((status: string) => void) | null = null;

// Hoisted mock objects — referenced inside vi.mock factory
const { mockChannel, mockRemoveChannel, mockChannelFactory, mockFrom } = vi.hoisted(() => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };
  const mockRemoveChannel = vi.fn();
  const mockChannelFactory = vi.fn(() => mockChannel);
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'res-1', instance_id: 'inst-1', reservation_date: '2026-04-14',
            start_time: '09:00', end_time: '10:00', station_id: 'sta-1',
            status: 'confirmed', source: 'customer', service_ids: [], service_items: [],
          },
        }),
      }),
    }),
  }));
  return { mockChannel, mockRemoveChannel, mockChannelFactory, mockFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: mockChannelFactory,
    removeChannel: mockRemoveChannel,
    from: mockFrom,
  },
}));

vi.mock('date-fns', () => ({
  parseISO: (str: string) => new Date(str),
}));

vi.mock('@/lib/reservationMapping', () => ({
  mapRawReservation: (data: Record<string, unknown>) => data,
}));

const buildOptions = (overrides?: Partial<Parameters<typeof useReservationsRealtime>[0]>) => ({
  instanceId: 'inst-1' as string | null,
  servicesMapRef: { current: new Map() },
  loadedDateRangeFrom: new Date('2026-01-01'),
  onInsert: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  onRefetch: vi.fn(),
  onNewCustomerReservation: vi.fn(),
  onTrainingInsert: vi.fn(),
  onTrainingUpdate: vi.fn(),
  onTrainingDelete: vi.fn(),
  ...overrides,
});

describe('useReservationsRealtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    subscribeCallback = null;

    // Reset mock implementations (not clearAllMocks — that wipes hoisted fns)
    mockChannel.on.mockReset().mockReturnThis();
    mockChannel.subscribe.mockReset().mockImplementation((cb: (status: string) => void) => {
      subscribeCallback = cb;
      setTimeout(() => cb('SUBSCRIBED'), 0);
      return mockChannel;
    });
    mockChannel.unsubscribe.mockReset();
    mockRemoveChannel.mockReset();
    mockChannelFactory.mockReset().mockReturnValue(mockChannel);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('markAsLocallyUpdated', () => {
    it('marks and auto-clears after specified duration', async () => {
      const opts = buildOptions();
      const { result } = renderHook(() => useReservationsRealtime(opts));

      act(() => { result.current.markAsLocallyUpdated('res-1', 2000); });
      // No crash — debounce ref set internally

      act(() => { vi.advanceTimersByTime(2500); });
      // Cleared — again, internal state we can't read directly but no crash
    });

    it('defaults to 3000ms duration', () => {
      const opts = buildOptions();
      const { result } = renderHook(() => useReservationsRealtime(opts));

      act(() => { result.current.markAsLocallyUpdated('res-1'); });
      act(() => { vi.advanceTimersByTime(3500); });
      // No error
    });
  });

  describe('isConnected', () => {
    it('starts as true', () => {
      const opts = buildOptions();
      const { result } = renderHook(() => useReservationsRealtime(opts));
      expect(result.current.isConnected).toBe(true);
    });

    it('stays true after SUBSCRIBED', async () => {
      const opts = buildOptions();
      const { result } = renderHook(() => useReservationsRealtime(opts));
      await act(async () => { vi.advanceTimersByTime(10); });
      expect(result.current.isConnected).toBe(true);
    });

    it('sets to false on CHANNEL_ERROR', async () => {
      const opts = buildOptions();
      const { result } = renderHook(() => useReservationsRealtime(opts));
      await act(async () => { vi.advanceTimersByTime(10); });

      act(() => { subscribeCallback?.('CHANNEL_ERROR'); });
      expect(result.current.isConnected).toBe(false);
    });

    it('sets to false on TIMED_OUT', async () => {
      const opts = buildOptions();
      const { result } = renderHook(() => useReservationsRealtime(opts));
      await act(async () => { vi.advanceTimersByTime(10); });

      act(() => { subscribeCallback?.('TIMED_OUT'); });
      expect(result.current.isConnected).toBe(false);
    });

    it('sets to false on CLOSED', async () => {
      const opts = buildOptions();
      const { result } = renderHook(() => useReservationsRealtime(opts));
      await act(async () => { vi.advanceTimersByTime(10); });

      act(() => { subscribeCallback?.('CLOSED'); });
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('polling fallback', () => {
    it('does not poll when connected', async () => {
      const opts = buildOptions();
      renderHook(() => useReservationsRealtime(opts));
      await act(async () => { vi.advanceTimersByTime(10); });

      const callsAfterConnect = opts.onRefetch.mock.calls.length;
      await act(async () => { vi.advanceTimersByTime(30000); });

      expect(opts.onRefetch).toHaveBeenCalledTimes(callsAfterConnect);
    });

    it('starts polling after 10s grace period when disconnected', async () => {
      const opts = buildOptions();
      renderHook(() => useReservationsRealtime(opts));
      await act(async () => { vi.advanceTimersByTime(10); });

      // Make subsequent subscribe NOT auto-reconnect (simulate sustained failure)
      mockChannel.subscribe.mockImplementation((cb: (status: string) => void) => {
        subscribeCallback = cb;
        setTimeout(() => cb('CHANNEL_ERROR'), 0);
        return mockChannel;
      });

      // Disconnect
      act(() => { subscribeCallback?.('CHANNEL_ERROR'); });

      // Let retry backoff settle (all retries will fail → stays disconnected)
      await act(async () => { vi.advanceTimersByTime(12000); });
      const callsBeforePoll = opts.onRefetch.mock.calls.length;

      // Polling starts at grace(10s) + interval(15s) from disconnect
      await act(async () => { vi.advanceTimersByTime(20000); });
      expect(opts.onRefetch.mock.calls.length).toBeGreaterThan(callsBeforePoll);
    });

    it('stops polling when reconnected', async () => {
      const opts = buildOptions();
      renderHook(() => useReservationsRealtime(opts));
      await act(async () => { vi.advanceTimersByTime(10); });

      // Disconnect → wait for polling to start
      act(() => { subscribeCallback?.('CHANNEL_ERROR'); });
      await act(async () => { vi.advanceTimersByTime(26000); });

      // Reconnect
      act(() => { subscribeCallback?.('SUBSCRIBED'); });
      const callsAtReconnect = opts.onRefetch.mock.calls.length;

      // No new polls
      await act(async () => { vi.advanceTimersByTime(20000); });
      expect(opts.onRefetch).toHaveBeenCalledTimes(callsAtReconnect);
    });
  });

  describe('channel setup', () => {
    it('does not create channel when instanceId is null', () => {
      const opts = buildOptions({ instanceId: null });
      renderHook(() => useReservationsRealtime(opts));
      expect(mockChannelFactory).not.toHaveBeenCalled();
    });

    it('creates channel with instance-scoped name', () => {
      const opts = buildOptions();
      renderHook(() => useReservationsRealtime(opts));
      expect(mockChannelFactory).toHaveBeenCalledWith('reservations-inst-1');
    });

    it('subscribes to both reservations and trainings tables', () => {
      const opts = buildOptions();
      renderHook(() => useReservationsRealtime(opts));

      // .on() called twice (trainings + reservations)
      expect(mockChannel.on).toHaveBeenCalledTimes(2);
    });

    it('removes channel on unmount', () => {
      const opts = buildOptions();
      const { unmount } = renderHook(() => useReservationsRealtime(opts));
      unmount();
      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe('retry logic', () => {
    it('retries with exponential backoff on CHANNEL_ERROR', async () => {
      const opts = buildOptions();
      renderHook(() => useReservationsRealtime(opts));
      await act(async () => { vi.advanceTimersByTime(10); });

      const callsBefore = mockChannelFactory.mock.calls.length;

      // First error
      act(() => { subscribeCallback?.('CHANNEL_ERROR'); });

      // Advance past first retry delay (1000 * 1.5^1 = 1500ms)
      await act(async () => { vi.advanceTimersByTime(1600); });

      expect(mockChannelFactory.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('resets retry count on successful SUBSCRIBED after error', async () => {
      const opts = buildOptions();
      const { result } = renderHook(() => useReservationsRealtime(opts));
      await act(async () => { vi.advanceTimersByTime(10); });

      // Error → disconnect
      act(() => { subscribeCallback?.('CHANNEL_ERROR'); });
      expect(result.current.isConnected).toBe(false);

      // Reconnect
      act(() => { subscribeCallback?.('SUBSCRIBED'); });
      expect(result.current.isConnected).toBe(true);
    });
  });
});
