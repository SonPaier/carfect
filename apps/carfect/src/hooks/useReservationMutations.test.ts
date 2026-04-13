import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================
// Module mocks — must be hoisted before any imports
// ============================================================

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/pushNotifications', () => ({
  sendPushNotification: vi.fn(),
}));

// ============================================================
// Imports after mocks
// ============================================================

import { useReservationMutations } from './useReservationMutations';
import type { Reservation } from '@/types/reservation';
import { mockSupabase, resetSupabaseMocks } from '@/test/mocks/supabase';
import { toast } from 'sonner';

// ============================================================
// Helpers
// ============================================================

function buildReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'res-1',
    instance_id: 'inst-1',
    customer_name: 'Jan Kowalski',
    customer_phone: '600100200',
    customer_email: 'jan@example.com',
    vehicle_plate: 'KR12345',
    car_size: 'medium',
    reservation_date: '2026-04-15',
    start_time: '09:00',
    end_time: '10:00',
    station_id: 'sta-1',
    status: 'pending',
    confirmation_code: 'ABC123',
    price: 100,
    ...overrides,
  };
}

interface HookOptions {
  reservations?: Reservation[];
  instanceId?: string | null;
  userId?: string | null;
}

function renderMutationsHook(opts: HookOptions = {}) {
  const {
    reservations = [buildReservation()],
    instanceId = 'inst-1',
    userId = 'user-1',
  } = opts;

  const mockUpdateCache = vi.fn();
  const mockSetSelected = vi.fn();
  const mockMarkAsLocallyUpdated = vi.fn();
  const mockInvalidateReservations = vi.fn();

  const { result } = renderHook(() =>
    useReservationMutations({
      instanceId,
      reservations,
      updateReservationsCache: mockUpdateCache,
      invalidateReservations: mockInvalidateReservations,
      setSelectedReservation: mockSetSelected,
      markAsLocallyUpdated: mockMarkAsLocallyUpdated,
      instanceData: { name: 'Test Car Wash', short_name: 'TCW', slug: 'test' },
      userId,
    }),
  );

  return { result, mockUpdateCache, mockSetSelected, mockMarkAsLocallyUpdated };
}

// Helper to make the supabase builder chain resolve with specific data per method
function mockFromChain(
  table: string,
  { updateResult = { error: null }, upsertResult = { error: null } }: {
    updateResult?: { error: { message: string } | null };
    upsertResult?: { error: { message: string } | null };
  } = {},
) {
  const updateBuilder = {
    eq: vi.fn().mockResolvedValue(updateResult),
    update: vi.fn(),
    upsert: vi.fn(),
  };
  updateBuilder.update = vi.fn().mockReturnValue(updateBuilder);

  const upsertBuilder = {
    eq: vi.fn().mockResolvedValue(upsertResult),
  };

  mockSupabase.from.mockImplementation((t: string) => {
    if (t === 'reservations') return updateBuilder;
    if (t === 'customers') return { upsert: vi.fn().mockResolvedValue(upsertResult) };
    return { upsert: vi.fn().mockResolvedValue({ error: null }) };
  });

  return { updateBuilder, upsertBuilder };
}

// ============================================================
// handleDeleteReservation
// ============================================================

describe('handleDeleteReservation', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('updates reservation status to cancelled in DB and filters it from cache on success', async () => {
    const reservation = buildReservation({ id: 'res-42', status: 'confirmed' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    // Mock the from chain: customers upsert + reservations update
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const reservationsUpdate = vi.fn().mockReturnValue({ eq: updateEq });
    const customersUpsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'reservations') return { update: reservationsUpdate };
      if (table === 'customers') return { upsert: customersUpsert };
      return {};
    });

    await act(async () => {
      await result.current.handleDeleteReservation('res-42', {
        name: reservation.customer_name,
        phone: reservation.customer_phone!,
        instance_id: 'inst-1',
      });
    });

    expect(reservationsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelled' }),
    );
    expect(updateEq).toHaveBeenCalledWith('id', 'res-42');
    expect(mockUpdateCache).toHaveBeenCalled();

    // Verify the updater function filters out the reservation
    const updater: (prev: Reservation[]) => Reservation[] = mockUpdateCache.mock.calls[0][0];
    const result2 = updater([reservation]);
    expect(result2).toHaveLength(0);
  });

  it('shows toast.error and does not call updateCache on DB error', async () => {
    const reservation = buildReservation({ id: 'res-fail' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: { message: 'DB error' } });
    const reservationsUpdate = vi.fn().mockReturnValue({ eq: updateEq });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'reservations') return { update: reservationsUpdate };
      if (table === 'customers') return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      return {};
    });

    await act(async () => {
      await result.current.handleDeleteReservation('res-fail', {
        name: 'Jan Kowalski',
        phone: '600100200',
        instance_id: 'inst-1',
      });
    });

    expect(toast.error).toHaveBeenCalledWith('errors.generic');
    expect(mockUpdateCache).not.toHaveBeenCalled();
  });

  it('does not crash when reservationId does not exist in cache', async () => {
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [buildReservation({ id: 'res-other' })],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const reservationsUpdate = vi.fn().mockReturnValue({ eq: updateEq });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'reservations') return { update: reservationsUpdate };
      if (table === 'customers') return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      return {};
    });

    await act(async () => {
      await result.current.handleDeleteReservation('non-existent-id', {
        name: 'Ghost',
        phone: '000000000',
        instance_id: 'inst-1',
      });
    });

    // DB still called, cache updater called (filter returns same array)
    expect(mockUpdateCache).toHaveBeenCalled();
  });
});

// ============================================================
// handleRejectReservation
// ============================================================

describe('handleRejectReservation', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('removes reservation from cache immediately (optimistic)', async () => {
    const reservation = buildReservation({ id: 'res-1', status: 'pending' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    await act(async () => {
      await result.current.handleRejectReservation('res-1');
    });

    // First call should filter out the reservation
    const firstUpdater: (prev: Reservation[]) => Reservation[] = mockUpdateCache.mock.calls[0][0];
    const firstResult = firstUpdater([reservation]);
    expect(firstResult).toHaveLength(0);
  });

  it('shows toast with undo action after optimistic removal', async () => {
    const reservation = buildReservation({ id: 'res-1' });
    const { result } = renderMutationsHook({ reservations: [reservation] });

    await act(async () => {
      await result.current.handleRejectReservation('res-1');
    });

    expect(toast).toHaveBeenCalledWith(
      'reservations.reservationRejected',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'common.undo' }),
        duration: 5000,
      }),
    );
  });

  it('executes DB delete when onAutoClose fires (no undo)', async () => {
    const reservation = buildReservation({ id: 'res-1' });
    const { result } = renderMutationsHook({ reservations: [reservation] });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const reservationsUpdate = vi.fn().mockReturnValue({ eq: updateEq });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'reservations') return { update: reservationsUpdate };
      if (table === 'customers') return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      return {};
    });

    let capturedOnAutoClose: (() => void) | undefined;
    (toast as ReturnType<typeof vi.fn>).mockImplementation(
      (_msg: string, opts: { onAutoClose?: () => void }) => {
        capturedOnAutoClose = opts?.onAutoClose;
      },
    );

    await act(async () => {
      await result.current.handleRejectReservation('res-1');
    });

    // Simulate toast auto-close (no undo clicked)
    await act(async () => {
      capturedOnAutoClose?.();
    });

    expect(reservationsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelled' }),
    );
  });

  it('does not execute DB delete when undo is clicked (deleteExecuted flag)', async () => {
    const reservation = buildReservation({ id: 'res-1' });
    const { result } = renderMutationsHook({ reservations: [reservation] });

    const reservationsUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'reservations') return { update: reservationsUpdate };
      if (table === 'customers') return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      return {};
    });

    let capturedUndoClick: (() => void) | undefined;
    let capturedOnAutoClose: (() => void) | undefined;
    (toast as ReturnType<typeof vi.fn>).mockImplementation(
      (_msg: string, opts: { action?: { onClick?: () => void }; onAutoClose?: () => void }) => {
        capturedUndoClick = opts?.action?.onClick;
        capturedOnAutoClose = opts?.onAutoClose;
      },
    );

    await act(async () => {
      await result.current.handleRejectReservation('res-1');
    });

    // Click undo first
    act(() => { capturedUndoClick?.(); });

    // Then auto-close fires — DB should NOT be called
    await act(async () => { capturedOnAutoClose?.(); });

    expect(reservationsUpdate).not.toHaveBeenCalled();
  });

  it('returns early when instanceId is null', async () => {
    const reservation = buildReservation({ id: 'res-1' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
      instanceId: null,
    });

    await act(async () => {
      await result.current.handleRejectReservation('res-1');
    });

    expect(mockUpdateCache).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it('restores reservation in cache on DB error', async () => {
    const reservation = buildReservation({ id: 'res-1' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: { message: 'fail' } });
    const reservationsUpdate = vi.fn().mockReturnValue({ eq: updateEq });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'reservations') return { update: reservationsUpdate };
      if (table === 'customers') return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      return {};
    });

    let capturedOnAutoClose: (() => void) | undefined;
    (toast as ReturnType<typeof vi.fn>).mockImplementation(
      (_msg: string, opts: { onAutoClose?: () => void }) => {
        capturedOnAutoClose = opts?.onAutoClose;
      },
    );

    await act(async () => {
      await result.current.handleRejectReservation('res-1');
    });

    await act(async () => { capturedOnAutoClose?.(); });

    // cache should be restored (re-add reservation)
    const restoreUpdater: (prev: Reservation[]) => Reservation[] =
      mockUpdateCache.mock.calls[mockUpdateCache.mock.calls.length - 1][0];
    const restored = restoreUpdater([]);
    expect(restored).toContainEqual(expect.objectContaining({ id: 'res-1' }));
    expect(toast.error).toHaveBeenCalledWith('errors.generic');
  });
});

// ============================================================
// handleConfirmReservation
// ============================================================

describe('handleConfirmReservation', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('optimistically sets status to confirmed before DB call', async () => {
    const reservation = buildReservation({ id: 'res-1', status: 'pending' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const reservationsUpdate = vi.fn().mockReturnValue({ eq: updateEq });
    mockSupabase.from.mockImplementation(() => ({ update: reservationsUpdate }));
    mockSupabase.functions.invoke = vi.fn().mockResolvedValue({ data: null, error: null });

    await act(async () => {
      await result.current.handleConfirmReservation('res-1');
    });

    // First updateCache call is the optimistic one — maps to confirmed
    const optimisticUpdater: (prev: Reservation[]) => Reservation[] =
      mockUpdateCache.mock.calls[0][0];
    const optimisticResult = optimisticUpdater([reservation]);
    expect(optimisticResult[0].status).toBe('confirmed');
  });

  it('rolls back to previous status on DB error', async () => {
    const reservation = buildReservation({ id: 'res-1', status: 'pending' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: { message: 'DB fail' } });
    const reservationsUpdate = vi.fn().mockReturnValue({ eq: updateEq });
    mockSupabase.from.mockImplementation(() => ({ update: reservationsUpdate }));

    await act(async () => {
      await result.current.handleConfirmReservation('res-1');
    });

    expect(toast.error).toHaveBeenCalledWith('errors.generic');

    // Rollback updater restores previous status
    const rollbackUpdater: (prev: Reservation[]) => Reservation[] =
      mockUpdateCache.mock.calls[mockUpdateCache.mock.calls.length - 1][0];
    const rolledBack = rollbackUpdater([{ ...reservation, status: 'confirmed' }]);
    expect(rolledBack[0].status).toBe('pending');
  });

  it('returns early when reservation is not found', async () => {
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [],
    });

    await act(async () => {
      await result.current.handleConfirmReservation('non-existent');
    });

    expect(mockUpdateCache).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows success toast after DB confirm', async () => {
    const reservation = buildReservation({ id: 'res-1', status: 'pending' });
    const { result } = renderMutationsHook({ reservations: [reservation] });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const reservationsUpdate = vi.fn().mockReturnValue({ eq: updateEq });
    mockSupabase.from.mockImplementation(() => ({ update: reservationsUpdate }));
    mockSupabase.functions.invoke = vi.fn().mockResolvedValue({ data: null, error: null });

    await act(async () => {
      await result.current.handleConfirmReservation('res-1');
    });

    expect(toast.success).toHaveBeenCalledWith('reservations.reservationConfirmed');
  });
});

// ============================================================
// handleStartWork
// ============================================================

describe('handleStartWork', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('calls DB update with status in_progress and updates cache', async () => {
    const reservation = buildReservation({ id: 'res-1', status: 'confirmed' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const reservationsUpdate = vi.fn().mockReturnValue({ eq: updateEq });
    mockSupabase.from.mockImplementation(() => ({ update: reservationsUpdate }));

    await act(async () => {
      await result.current.handleStartWork('res-1');
    });

    expect(reservationsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'in_progress' }),
    );
    expect(mockUpdateCache).toHaveBeenCalled();

    const updater: (prev: Reservation[]) => Reservation[] = mockUpdateCache.mock.calls[0][0];
    const updated = updater([reservation]);
    expect(updated[0].status).toBe('in_progress');
  });

  it('shows success toast after work started', async () => {
    const reservation = buildReservation({ id: 'res-1', status: 'confirmed' });
    const { result } = renderMutationsHook({ reservations: [reservation] });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnValue({ eq: updateEq }),
    }));

    await act(async () => {
      await result.current.handleStartWork('res-1');
    });

    expect(toast.success).toHaveBeenCalledWith(
      'reservations.workStarted',
      expect.anything(),
    );
  });

  it('shows error toast and does not update cache on DB error', async () => {
    const reservation = buildReservation({ id: 'res-1', status: 'confirmed' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: { message: 'fail' } });
    mockSupabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnValue({ eq: updateEq }),
    }));

    await act(async () => {
      await result.current.handleStartWork('res-1');
    });

    expect(toast.error).toHaveBeenCalledWith('errors.generic');
    // optimisticMutation: first call = optimistic update, second call = rollback
    expect(mockUpdateCache).toHaveBeenCalledTimes(2);
  });

  it('returns early when reservation is not in the array', async () => {
    const { result, mockUpdateCache } = renderMutationsHook({ reservations: [] });

    await act(async () => {
      await result.current.handleStartWork('non-existent');
    });

    expect(mockUpdateCache).not.toHaveBeenCalled();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});

// ============================================================
// handleReservationSave
// ============================================================

describe('handleReservationSave', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('merges partial data into existing reservation in cache', () => {
    const reservation = buildReservation({ id: 'res-1', admin_notes: null });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    act(() => {
      result.current.handleReservationSave('res-1', { admin_notes: 'VIP client' });
    });

    expect(mockUpdateCache).toHaveBeenCalled();

    const updater: (prev: Reservation[]) => Reservation[] = mockUpdateCache.mock.calls[0][0];
    const updated = updater([reservation]);
    expect(updated[0].admin_notes).toBe('VIP client');
    expect(updated[0].id).toBe('res-1');
  });

  it('leaves non-matching reservations untouched', () => {
    const res1 = buildReservation({ id: 'res-1', status: 'pending' });
    const res2 = buildReservation({ id: 'res-2', status: 'confirmed' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [res1, res2],
    });

    act(() => {
      result.current.handleReservationSave('res-1', { status: 'completed' });
    });

    const updater: (prev: Reservation[]) => Reservation[] = mockUpdateCache.mock.calls[0][0];
    const updated = updater([res1, res2]);
    expect(updated.find((r) => r.id === 'res-2')?.status).toBe('confirmed');
  });

  it('shows success toast after save', () => {
    const reservation = buildReservation({ id: 'res-1' });
    const { result } = renderMutationsHook({ reservations: [reservation] });

    act(() => {
      result.current.handleReservationSave('res-1', { status: 'confirmed' });
    });

    expect(toast.success).toHaveBeenCalledWith('reservations.reservationUpdated');
  });

  it('calls setSelectedReservation(null) after save', () => {
    const reservation = buildReservation({ id: 'res-1' });
    const { result, mockSetSelected } = renderMutationsHook({ reservations: [reservation] });

    act(() => {
      result.current.handleReservationSave('res-1', { status: 'completed' });
    });

    expect(mockSetSelected).toHaveBeenCalledWith(null);
  });
});

// ============================================================
// handleReservationMove
// ============================================================

describe('handleReservationMove', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('updates station_id and reservation_date in DB and cache', async () => {
    const reservation = buildReservation({
      id: 'res-1',
      station_id: 'sta-1',
      reservation_date: '2026-04-15',
      start_time: '09:00',
      end_time: '10:00',
    });
    const { result, mockUpdateCache, mockMarkAsLocallyUpdated } = renderMutationsHook({
      reservations: [reservation],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const reservationsUpdate = vi.fn().mockReturnValue({ eq: updateEq });
    mockSupabase.from.mockImplementation(() => ({ update: reservationsUpdate }));

    await act(async () => {
      await result.current.handleReservationMove('res-1', 'sta-2', '2026-04-16');
    });

    expect(mockMarkAsLocallyUpdated).toHaveBeenCalledWith('res-1');
    expect(reservationsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ station_id: 'sta-2', reservation_date: '2026-04-16' }),
    );
    expect(mockUpdateCache).toHaveBeenCalled();

    const updater: (prev: Reservation[]) => Reservation[] = mockUpdateCache.mock.calls[0][0];
    const updated = updater([reservation]);
    expect(updated[0].station_id).toBe('sta-2');
    expect(updated[0].reservation_date).toBe('2026-04-16');
  });

  it('calculates new end_time preserving duration when newTime is provided', async () => {
    // duration = 60 min (09:00 -> 10:00), moved to 11:00 => end should be 12:00
    const reservation = buildReservation({
      id: 'res-1',
      start_time: '09:00',
      end_time: '10:00',
    });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnValue({ eq: updateEq }),
    }));

    await act(async () => {
      await result.current.handleReservationMove('res-1', 'sta-1', '2026-04-16', '11:00');
    });

    const updater: (prev: Reservation[]) => Reservation[] = mockUpdateCache.mock.calls[0][0];
    const updated = updater([reservation]);
    expect(updated[0].start_time).toBe('11:00');
    expect(updated[0].end_time).toBe('12:00');
  });

  it('shows error toast and does not update cache when DB fails', async () => {
    const reservation = buildReservation({ id: 'res-1' });
    const { result, mockUpdateCache } = renderMutationsHook({
      reservations: [reservation],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: { message: 'move failed' } });
    mockSupabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnValue({ eq: updateEq }),
    }));

    await act(async () => {
      await result.current.handleReservationMove('res-1', 'sta-2', '2026-04-20');
    });

    expect(toast.error).toHaveBeenCalledWith('errors.generic');
    expect(mockUpdateCache).not.toHaveBeenCalled();
  });

  it('returns early when reservation is not found in cache', async () => {
    const { result, mockUpdateCache } = renderMutationsHook({ reservations: [] });

    await act(async () => {
      await result.current.handleReservationMove('non-existent', 'sta-2', '2026-04-20');
    });

    expect(mockUpdateCache).not.toHaveBeenCalled();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('includes undo action in success toast', async () => {
    const reservation = buildReservation({ id: 'res-1' });
    const { result } = renderMutationsHook({ reservations: [reservation] });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnValue({ eq: updateEq }),
    }));

    await act(async () => {
      await result.current.handleReservationMove('res-1', 'sta-2', '2026-04-20');
    });

    expect(toast.success).toHaveBeenCalledWith(
      'reservations.reservationMoved',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'common.undo' }),
        duration: 5000,
      }),
    );
  });
});
