import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarDragDrop } from './useCalendarDragDrop';
import type { Reservation } from '@/types/reservation';

vi.mock('@/types/reservation', () => ({}));

vi.mock('./useCalendarWorkingHours', () => ({
  parseTime: (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h + m / 60;
  },
  formatTimeSlot: (hour: number, slotIndex: number) => {
    const minutes = slotIndex * 15;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },
  SLOT_MINUTES: 15,
  HOUR_HEIGHT: 60,
}));

function fakeDragEvent(overrides?: Partial<DragEvent<HTMLDivElement>>): DragEvent<HTMLDivElement> {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue(''),
    },
    currentTarget: { contains: vi.fn().mockReturnValue(false) },
    relatedTarget: null,
    ...overrides,
  } as unknown as DragEvent<HTMLDivElement>;
}

function buildReservation(overrides?: Partial<Reservation>): Reservation {
  return {
    id: 'res-1',
    instance_id: 'inst-1',
    station_id: 'sta-1',
    reservation_date: '2026-04-14',
    start_time: '09:00',
    end_time: '10:00',
    status: 'confirmed',
    customer_name: 'Test Customer',
    vehicle_plate: 'ABC123',
    ...overrides,
  } as Reservation;
}

function defaultOptions(overrides: Record<string, unknown> = {}) {
  return {
    reservations: [] as Reservation[],
    readOnly: false,
    isMobile: false,
    displayStartTime: 8,
    getWorkingHoursForDate: (_dateStr: string) => ({
      startTime: '08:00',
      closeTime: '18:00',
    }),
    onReservationMove: vi.fn(),
    onYardVehicleDrop: vi.fn(),
    ...overrides,
  };
}

describe('useCalendarDragDrop', () => {
  describe('handleDragStart', () => {
    it('sets draggedReservation and configures dataTransfer', () => {
      const { result } = renderHook(() => useCalendarDragDrop(defaultOptions()));
      const reservation = buildReservation();
      const event = fakeDragEvent();

      act(() => {
        result.current.handleDragStart(event, reservation);
      });

      expect(result.current.draggedReservation).toEqual(reservation);
      expect((event.dataTransfer as { setData: ReturnType<typeof vi.fn> }).setData).toHaveBeenCalledWith(
        'text/plain',
        reservation.id,
      );
      expect((event.dataTransfer as { effectAllowed: string }).effectAllowed).toBe('move');
    });

    it('prevents drag in readOnly mode', () => {
      const { result } = renderHook(() =>
        useCalendarDragDrop(defaultOptions({ readOnly: true })),
      );
      const reservation = buildReservation();
      const event = fakeDragEvent();

      act(() => {
        result.current.handleDragStart(event, reservation);
      });

      expect((event.preventDefault as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
      expect(result.current.draggedReservation).toBeNull();
    });

    it('prevents drag on mobile', () => {
      const { result } = renderHook(() =>
        useCalendarDragDrop(defaultOptions({ isMobile: true })),
      );
      const reservation = buildReservation();
      const event = fakeDragEvent();

      act(() => {
        result.current.handleDragStart(event, reservation);
      });

      expect((event.preventDefault as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
      expect(result.current.draggedReservation).toBeNull();
    });
  });

  describe('handleDragEnd', () => {
    it('clears all drag state', () => {
      const { result } = renderHook(() => useCalendarDragDrop(defaultOptions()));
      const reservation = buildReservation();

      // First set some drag state
      act(() => {
        result.current.handleDragStart(fakeDragEvent(), reservation);
      });
      expect(result.current.draggedReservation).not.toBeNull();

      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedReservation).toBeNull();
      expect(result.current.dragOverStation).toBeNull();
      expect(result.current.dragOverSlot).toBeNull();
    });
  });

  describe('handleDrop — reservation move', () => {
    it('calls onReservationMove when station changes', () => {
      const onReservationMove = vi.fn();
      const { result } = renderHook(() =>
        useCalendarDragDrop(defaultOptions({ onReservationMove })),
      );
      const reservation = buildReservation({ station_id: 'sta-1' });

      act(() => {
        result.current.handleDragStart(fakeDragEvent(), reservation);
      });

      const dropEvent = fakeDragEvent();
      act(() => {
        result.current.handleDrop(dropEvent, 'sta-2', '2026-04-14');
      });

      expect(onReservationMove).toHaveBeenCalledWith('res-1', 'sta-2', '2026-04-14', undefined);
    });

    it('calls onReservationMove when time changes', () => {
      const onReservationMove = vi.fn();
      const { result } = renderHook(() =>
        useCalendarDragDrop(defaultOptions({ onReservationMove })),
      );
      const reservation = buildReservation({ station_id: 'sta-1', start_time: '09:00', end_time: '10:00' });

      act(() => {
        result.current.handleDragStart(fakeDragEvent(), reservation);
      });

      const dropEvent = fakeDragEvent();
      act(() => {
        // Drop at hour=10, slotIndex=0 → "10:00" which differs from "09:00"
        result.current.handleDrop(dropEvent, 'sta-1', '2026-04-14', 10, 0);
      });

      expect(onReservationMove).toHaveBeenCalledWith('res-1', 'sta-1', '2026-04-14', '10:00');
    });

    it('does not call onReservationMove when nothing changed', () => {
      const onReservationMove = vi.fn();
      const { result } = renderHook(() =>
        useCalendarDragDrop(defaultOptions({ onReservationMove })),
      );
      const reservation = buildReservation({
        station_id: 'sta-1',
        reservation_date: '2026-04-14',
        start_time: '09:00',
        end_time: '10:00',
      });

      act(() => {
        result.current.handleDragStart(fakeDragEvent(), reservation);
      });

      const dropEvent = fakeDragEvent();
      act(() => {
        // Drop at same station, same date, same time (hour=9, slotIndex=0 → "09:00")
        result.current.handleDrop(dropEvent, 'sta-1', '2026-04-14', 9, 0);
      });

      expect(onReservationMove).not.toHaveBeenCalled();
    });

    it('rejects drop before opening time', () => {
      const onReservationMove = vi.fn();
      const getWorkingHoursForDate = () => ({ startTime: '09:00', closeTime: '18:00' });
      const { result } = renderHook(() =>
        useCalendarDragDrop(defaultOptions({ onReservationMove, getWorkingHoursForDate })),
      );
      const reservation = buildReservation({ station_id: 'sta-1', start_time: '09:00', end_time: '10:00' });

      act(() => {
        result.current.handleDragStart(fakeDragEvent(), reservation);
      });

      const dropEvent = fakeDragEvent();
      act(() => {
        // Drop at hour=7, slotIndex=0 → "07:00", before openTime "09:00"
        result.current.handleDrop(dropEvent, 'sta-1', '2026-04-14', 7, 0);
      });

      expect(onReservationMove).not.toHaveBeenCalled();
    });

    it('rejects drop when reservation would end after closing time', () => {
      const onReservationMove = vi.fn();
      // closeTime 17:00, reservation is 1h long, drop at 16:30 → ends at 17:30
      const getWorkingHoursForDate = () => ({ startTime: '09:00', closeTime: '17:00' });
      const { result } = renderHook(() =>
        useCalendarDragDrop(defaultOptions({ onReservationMove, getWorkingHoursForDate })),
      );
      const reservation = buildReservation({
        station_id: 'sta-1',
        start_time: '09:00',
        end_time: '10:00', // 1h duration
      });

      act(() => {
        result.current.handleDragStart(fakeDragEvent(), reservation);
      });

      const dropEvent = fakeDragEvent();
      act(() => {
        // Drop at hour=16, slotIndex=2 → "16:30", ends at 17:30 which is after 17:00
        result.current.handleDrop(dropEvent, 'sta-1', '2026-04-14', 16, 2);
      });

      expect(onReservationMove).not.toHaveBeenCalled();
    });
  });

  describe('handleDrop — yard vehicle', () => {
    it('calls onYardVehicleDrop for yard vehicle data', () => {
      const onYardVehicleDrop = vi.fn();
      const vehicle = { id: 'vehicle-1', brand: 'Toyota' };
      const { result } = renderHook(() =>
        useCalendarDragDrop(defaultOptions({ onYardVehicleDrop })),
      );

      const dropEvent = fakeDragEvent({
        dataTransfer: {
          effectAllowed: '',
          dropEffect: '',
          setData: vi.fn(),
          getData: vi.fn((key: string) =>
            key === 'application/yard-vehicle' ? JSON.stringify(vehicle) : '',
          ),
        } as unknown as DataTransfer,
      });

      act(() => {
        result.current.handleDrop(dropEvent, 'sta-1', '2026-04-14', 10, 0);
      });

      expect(onYardVehicleDrop).toHaveBeenCalledWith(vehicle, 'sta-1', '2026-04-14', '10:00');
    });
  });

  describe('dragPreviewStyle', () => {
    it('returns null when no drag in progress', () => {
      const { result } = renderHook(() => useCalendarDragDrop(defaultOptions()));
      expect(result.current.dragPreviewStyle).toBeNull();
    });

    it('returns position data when dragging over a slot', () => {
      const { result } = renderHook(() =>
        useCalendarDragDrop(defaultOptions({ displayStartTime: 8 })),
      );
      const reservation = buildReservation({ start_time: '09:00', end_time: '10:00' });

      act(() => {
        result.current.handleDragStart(fakeDragEvent(), reservation);
      });

      // Simulate dragging over slot hour=10, slotIndex=0
      act(() => {
        result.current.handleSlotDragOver(fakeDragEvent(), 'sta-1', 10, 0, '2026-04-14');
      });

      const style = result.current.dragPreviewStyle;
      expect(style).not.toBeNull();
      // top: (10 - 8) * 60 = 120px
      expect(style?.top).toBe('120px');
      // height: 1h * 60 = 60px
      expect(style?.height).toBe('60px');
      // time: formatTimeSlot(10, 0) = "10:00"
      expect(style?.time).toBe('10:00');
    });
  });
});
