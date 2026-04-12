import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import type { ReservationSlot } from '../components/admin/reservation-form';

interface UseReservationSlotsOptions {
  open: boolean;
  isReservationMode: boolean;
  isEditMode: boolean;
  totalDurationMinutes: number;
  onSlotPreviewChange?: (
    preview: {
      date: string;
      startTime: string;
      endTime: string;
      stationId: string;
    } | null,
  ) => void;
}

interface UseReservationSlotsReturn {
  slots: ReservationSlot[];
  setSlots: React.Dispatch<React.SetStateAction<ReservationSlot[]>>;
  reservationType: 'single' | 'multi';
  setReservationType: React.Dispatch<React.SetStateAction<'single' | 'multi'>>;

  // Derived from slots[0]
  manualStartTime: string;
  manualEndTime: string;
  manualStationId: string | null;
  dateRange: DateRange | undefined;

  // Setters for slots[0]
  setManualStartTime: (time: string) => void;
  setManualEndTime: (time: string) => void;
  setManualStationId: (stationId: string | null) => void;
  setDateRange: (range: DateRange | undefined) => void;

  // End time tracking
  userModifiedEndTime: boolean;
  setUserModifiedEndTime: (v: boolean) => void;

  // Refs for reset logic (used by the dialog's init effect)
  originalDurationMinutesRef: React.MutableRefObject<number | null>;
  prevManualStartTimeRef: React.MutableRefObject<string>;
}

export function useReservationSlots({
  open,
  isReservationMode,
  isEditMode,
  totalDurationMinutes,
  onSlotPreviewChange,
}: UseReservationSlotsOptions): UseReservationSlotsReturn {
  // Stable ref for callback to avoid infinite re-render loops
  const onSlotPreviewChangeRef = useRef(onSlotPreviewChange);
  onSlotPreviewChangeRef.current = onSlotPreviewChange;
  const [slots, setSlots] = useState<ReservationSlot[]>([
    {
      id: crypto.randomUUID(),
      dateRange: undefined,
      startTime: '',
      endTime: '',
      stationId: null,
    },
  ]);

  const [reservationType, setReservationType] = useState<'single' | 'multi'>('single');
  const [userModifiedEndTime, setUserModifiedEndTime] = useState(false);

  const prevTotalDurationRef = useRef<number>(0);
  const originalDurationMinutesRef = useRef<number | null>(null);
  const prevManualStartTimeRef = useRef<string>('');

  // Derived from first slot
  const manualStartTime = slots[0]?.startTime || '';
  const manualEndTime = slots[0]?.endTime || '';
  const manualStationId = slots[0]?.stationId || null;
  const dateRange = slots[0]?.dateRange;

  const setManualStartTime = useCallback((time: string) => {
    setSlots((prev) => {
      const newSlots = [...prev];
      newSlots[0] = { ...newSlots[0], startTime: time };
      return newSlots;
    });
  }, []);

  const setManualEndTime = useCallback((time: string) => {
    setSlots((prev) => {
      const newSlots = [...prev];
      newSlots[0] = { ...newSlots[0], endTime: time };
      return newSlots;
    });
  }, []);

  const setManualStationId = useCallback((stationId: string | null) => {
    setSlots((prev) => {
      const newSlots = [...prev];
      newSlots[0] = { ...newSlots[0], stationId };
      return newSlots;
    });
  }, []);

  const setDateRange = useCallback((range: DateRange | undefined) => {
    setSlots((prev) => {
      const newSlots = [...prev];
      newSlots[0] = { ...newSlots[0], dateRange: range };
      return newSlots;
    });
  }, []);

  // Auto-update end time when start time or duration changes (for reservation mode)
  useEffect(() => {
    if (!isReservationMode || !open) return;

    // Skip if user manually modified end time
    if (userModifiedEndTime) return;

    // Skip if no start time
    if (!manualStartTime || !manualStartTime.includes(':')) return;

    // Calculate new end time based on total duration
    if (totalDurationMinutes > 0) {
      const [h, m] = manualStartTime.split(':').map(Number);
      const rawEndMinutes = h * 60 + m + totalDurationMinutes;
      // Round UP to nearest 15-minute slot so it matches Select options
      const roundedEndMinutes = Math.ceil(rawEndMinutes / 15) * 15;
      const newEndTime = `${Math.floor(roundedEndMinutes / 60)
        .toString()
        .padStart(2, '0')}:${(roundedEndMinutes % 60).toString().padStart(2, '0')}`;
      setManualEndTime(newEndTime);
    }

    prevTotalDurationRef.current = totalDurationMinutes;
  }, [open, isReservationMode, manualStartTime, totalDurationMinutes, userModifiedEndTime, setManualEndTime]);

  // Auto-adjust end time when start time changes in edit mode (preserve duration)
  useEffect(() => {
    if (!isReservationMode || !open || !isEditMode) return;

    // Skip if user manually modified end time
    if (userModifiedEndTime) return;

    // Skip if no original duration stored
    if (originalDurationMinutesRef.current === null) return;

    // Skip if start time hasn't actually changed
    if (manualStartTime === prevManualStartTimeRef.current) return;

    // Skip if start time is empty or invalid
    if (!manualStartTime || !manualStartTime.includes(':')) return;

    // Calculate new end time preserving original duration
    const [h, m] = manualStartTime.split(':').map(Number);
    const endMinutes = h * 60 + m + originalDurationMinutesRef.current;
    const newEndTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
    setManualEndTime(newEndTime);

    prevManualStartTimeRef.current = manualStartTime;
  }, [open, isReservationMode, isEditMode, manualStartTime, userModifiedEndTime, setManualEndTime]);

  // Emit slot preview for calendar highlighting (create mode only)
  useEffect(() => {
    const cb = onSlotPreviewChangeRef.current;
    if (!open || !isReservationMode || !cb || isEditMode) {
      cb?.(null);
      return;
    }

    if (manualStartTime && manualEndTime && manualStationId && dateRange?.from) {
      cb({
        date: format(dateRange.from, 'yyyy-MM-dd'),
        startTime: manualStartTime,
        endTime: manualEndTime,
        stationId: manualStationId,
      });
    } else {
      cb(null);
    }
  }, [
    open,
    isReservationMode,
    isEditMode,
    dateRange,
    manualStartTime,
    manualEndTime,
    manualStationId,
  ]);

  return {
    slots,
    setSlots,
    reservationType,
    setReservationType,
    manualStartTime,
    manualEndTime,
    manualStationId,
    dateRange,
    setManualStartTime,
    setManualEndTime,
    setManualStationId,
    setDateRange,
    userModifiedEndTime,
    setUserModifiedEndTime,
    originalDurationMinutesRef,
    prevManualStartTimeRef,
  };
}
