import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format, isSameDay, isBefore, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Label } from '@shared/ui';
import { Button } from '@shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui';
import { Calendar } from '@shared/ui';
import { cn } from '@/lib/utils';
import { Station, WorkingHours, ReservationSlot } from './types';

interface ReservationSlotsSectionProps {
  slots: ReservationSlot[];
  onSlotsChange: (slots: ReservationSlot[]) => void;
  stations: Station[];
  workingHours?: Record<string, WorkingHours | null> | null;
  startTimeOptions: string[];
  endTimeOptions: string[];
  errors?: { dateRange?: string; time?: string; station?: string };
  isMobile: boolean;
  showStationSelector: boolean;
  /** Hide add/remove slot controls (e.g. in edit mode) */
  isEditMode?: boolean;
  onUserModifiedEndTime?: () => void;
}

function formatSlotSummary(slot: ReservationSlot, stations: Station[]): string {
  const parts: string[] = [];
  if (slot.dateRange?.from) {
    if (slot.dateRange.to && !isSameDay(slot.dateRange.from, slot.dateRange.to)) {
      parts.push(
        `${format(slot.dateRange.from, 'd.MM')} – ${format(slot.dateRange.to, 'd.MM')}`
      );
    } else {
      parts.push(format(slot.dateRange.from, 'd.MM'));
    }
  }
  if (slot.startTime && slot.endTime) {
    parts.push(`${slot.startTime}–${slot.endTime}`);
  }
  if (slot.stationId) {
    const station = stations.find((s) => s.id === slot.stationId);
    if (station) parts.push(station.name);
  }
  return parts.join(' · ') || '';
}

interface SlotCardProps {
  slot: ReservationSlot;
  index: number;
  totalSlots: number;
  stations: Station[];
  workingHours?: Record<string, WorkingHours | null> | null;
  startTimeOptions: string[];
  endTimeOptions: string[];
  error?: string;
  isMobile: boolean;
  showStationSelector: boolean;
  onUpdate: (updated: ReservationSlot) => void;
  onRemove: () => void;
  onUserModifiedEndTime?: () => void;
}

const SlotCard = ({
  slot,
  index,
  totalSlots,
  stations,
  workingHours,
  startTimeOptions,
  endTimeOptions,
  error,
  isMobile,
  showStationSelector,
  onUpdate,
  onRemove,
  onUserModifiedEndTime,
}: SlotCardProps) => {
  const { t } = useTranslation();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const dateFromRef = useRef<HTMLDivElement>(null);
  const dateToRef = useRef<HTMLDivElement>(null);
  const isMultiSlot = totalSlots > 1;


  // Close calendar when clicking outside the date section
  useEffect(() => {
    if (!dateFromOpen && !dateToOpen) return;
    const handler = (e: MouseEvent) => {
      if (dateFromRef.current && !dateFromRef.current.contains(e.target as Node)) {
        setDateFromOpen(false);
        setDateToOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dateFromOpen, dateToOpen]);

  const handleDateFromSelect = (date: Date | undefined) => {
    if (!date) return;
    const newFrom = date;
    // If "to" is before new "from", sync to = from
    const newTo = slot.dateRange?.to && !isBefore(slot.dateRange.to, newFrom)
      ? slot.dateRange.to
      : newFrom;
    const newRange = { from: newFrom, to: newTo };
    // Prefill times from working hours when selecting date
    if (!slot.startTime && !slot.endTime && workingHours) {
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][newFrom.getDay()];
      const dayHours = workingHours[dayName];
      if (dayHours) {
        onUpdate({
          ...slot,
          dateRange: newRange,
          startTime: dayHours.open.substring(0, 5),
          endTime: dayHours.close.substring(0, 5),
        });
        setDateFromOpen(false);
        return;
      }
    }
    onUpdate({ ...slot, dateRange: newRange });
    setDateFromOpen(false);
  };

  const handleDateToSelect = (date: Date | undefined) => {
    if (!date) return;
    const from = slot.dateRange?.from || date;
    onUpdate({ ...slot, dateRange: { from, to: date } });
    setDateToOpen(false);
  };

  const disabledDate = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    if (workingHours) {
      const dayName = format(date, 'EEEE').toLowerCase();
      const dayHours = workingHours[dayName];
      if (!dayHours || !dayHours.open || !dayHours.close) return true;
    }
    return false;
  };

  const disabledDateTo = (date: Date) => {
    if (disabledDate(date)) return true;
    // "To" date must be >= "from" date
    if (slot.dateRange?.from && isBefore(date, startOfDay(slot.dateRange.from))) return true;
    return false;
  };

  return (
    <div className={cn(
      'space-y-3',
      isMultiSlot && 'rounded-lg border border-border p-3 bg-white dark:bg-card'
    )}>
      {/* Header for multi-slot mode */}
      {isMultiSlot && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Slot {index + 1}
            {formatSlotSummary(slot, stations) && (
              <span className="ml-2 font-normal text-muted-foreground">
                — {formatSlotSummary(slot, stations)}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Date pickers: Dzień od | Dzień do */}
      <div ref={dateFromRef}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              Dzień od <span className="text-destructive">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setDateFromOpen(!dateFromOpen); setDateToOpen(false); }}
              className={cn(
                'w-full justify-start text-left font-normal bg-white dark:bg-card border-foreground/60',
                !slot.dateRange?.from && 'text-muted-foreground',
                error && !slot.dateRange?.from && 'border-destructive'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {slot.dateRange?.from
                ? format(slot.dateRange.from, 'd MMM yyyy', { locale: pl })
                : 'Wybierz datę'}
            </Button>
          </div>
          <div className="space-y-2" ref={dateToRef}>
            <Label className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              Dzień do <span className="text-destructive">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setDateToOpen(!dateToOpen); setDateFromOpen(false); }}
              className={cn(
                'w-full justify-start text-left font-normal bg-white dark:bg-card border-foreground/60',
                !slot.dateRange?.to && 'text-muted-foreground',
                error && !slot.dateRange?.to && 'border-destructive'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {slot.dateRange?.to
                ? format(slot.dateRange.to, 'd MMM yyyy', { locale: pl })
                : 'Wybierz datę'}
            </Button>
          </div>
        </div>
        {/* Calendar renders below both date buttons, full width */}
        {dateFromOpen && (
          <div className="mt-2 w-fit rounded-md border border-foreground/60 bg-input shadow-md">
            <Calendar
              mode="single"
              defaultMonth={slot.dateRange?.from || new Date()}
              selected={slot.dateRange?.from}
              onSelect={handleDateFromSelect}
              disabled={disabledDate}
              numberOfMonths={1}
              locale={pl}
            />
          </div>
        )}
        {dateToOpen && (
          <div className="mt-2 w-fit rounded-md border border-foreground/60 bg-input shadow-md">
            <Calendar
              mode="single"
              defaultMonth={slot.dateRange?.to || slot.dateRange?.from || new Date()}
              selected={slot.dateRange?.to}
              onSelect={handleDateToSelect}
              disabled={disabledDateTo}
              numberOfMonths={1}
              locale={pl}
            />
          </div>
        )}
      </div>

      {/* Time selection: Godzina rozpoczęcia | Godzina zakończenia */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('addReservation.manualStartTime')}</Label>
          <Select
            value={slot.startTime}
            onValueChange={(val) => onUpdate({ ...slot, startTime: val })}
          >
            <SelectTrigger className="bg-white border-foreground/60">
              <SelectValue placeholder="--:--" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-60 z-[60]">
              {startTimeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('addReservation.manualEndTime')}</Label>
          <Select
            value={slot.endTime}
            onValueChange={(val) => {
              onUpdate({ ...slot, endTime: val });
              onUserModifiedEndTime?.();
            }}
          >
            <SelectTrigger className="bg-white border-foreground/60">
              <SelectValue placeholder="--:--" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-60 z-[60]">
              {endTimeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Station selector */}
      {showStationSelector && (
        <div className="space-y-2">
          <Label>
            {t('addReservation.selectStation')} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={slot.stationId || ''}
            onValueChange={(val) => onUpdate({ ...slot, stationId: val })}
          >
            <SelectTrigger className={cn(
              'bg-white dark:bg-card border-foreground/60',
              !slot.stationId && error && 'border-destructive'
            )}>
              <SelectValue placeholder={t('addReservation.selectStation')} />
            </SelectTrigger>
            <SelectContent className="bg-white z-[60]">
              {stations.map((station) => (
                <SelectItem key={station.id} value={station.id}>
                  {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export const ReservationSlotsSection = ({
  slots,
  onSlotsChange,
  stations,
  workingHours,
  startTimeOptions,
  endTimeOptions,
  errors,
  isMobile,
  showStationSelector,
  isEditMode = false,
  onUserModifiedEndTime,
}: ReservationSlotsSectionProps) => {
  const handleUpdateSlot = (index: number, updated: ReservationSlot) => {
    const newSlots = [...slots];
    newSlots[index] = updated;
    onSlotsChange(newSlots);
  };

  const handleRemoveSlot = (index: number) => {
    if (slots.length <= 1) return;
    onSlotsChange(slots.filter((_, i) => i !== index));
  };

  const handleAddSlot = () => {
    onSlotsChange([
      ...slots,
      {
        id: crypto.randomUUID(),
        dateRange: undefined,
        startTime: '',
        endTime: '',
        stationId: null,
      },
    ]);
  };

  return (
    <div className="space-y-3">
      {slots.map((slot, index) => (
        <SlotCard
          key={slot.id}
          slot={slot}
          index={index}
          totalSlots={slots.length}
          stations={stations}
          workingHours={workingHours}
          startTimeOptions={startTimeOptions}
          endTimeOptions={endTimeOptions}
          error={index === 0 ? (errors?.dateRange || errors?.time || errors?.station) : undefined}
          isMobile={isMobile}
          showStationSelector={showStationSelector}
          onUpdate={(updated) => handleUpdateSlot(index, updated)}
          onRemove={() => handleRemoveSlot(index)}
          onUserModifiedEndTime={onUserModifiedEndTime}
        />
      ))}

      {/* Add slot button - only in create mode with station selector visible */}
      {showStationSelector && !isEditMode && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSlot}
          className="w-full border-dashed text-muted-foreground"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Dodaj slot na innym stanowisku
        </Button>
      )}

      {errors?.dateRange && <p className="text-sm text-destructive">{errors.dateRange}</p>}
      {errors?.time && <p className="text-sm text-destructive">{errors.time}</p>}
    </div>
  );
};

export default ReservationSlotsSection;
