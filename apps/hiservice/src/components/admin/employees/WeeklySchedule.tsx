import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, ChevronLeft, ChevronRight, Loader2, Palmtree, Trash2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useTimeEntries, useCreateTimeEntry, useUpdateTimeEntry, getEffectiveMinutes, TimeEntry } from '@/hooks/useTimeEntries';
import { useEmployeeDaysOff, useCreateEmployeeDayOff, useDeleteEmployeeDayOff } from '@/hooks/useEmployeeDaysOff';
import { useWorkersSettings } from '@/hooks/useWorkersSettings';
import { Employee } from '@/hooks/useEmployees';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WeeklyScheduleProps {
  employee: Employee;
  instanceId: string;
}

interface EditingCell {
  date: string;
  hours: string;
  minutes: string;
  startTime: string;
  endTime: string;
}

const SAVE_DEBOUNCE_MS = 400;

const WeeklySchedule = ({ employee, instanceId }: WeeklyScheduleProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [manualSaving, setManualSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  const dateFrom = format(currentWeekStart, 'yyyy-MM-dd');
  const dateTo = format(weekEnd, 'yyyy-MM-dd');
  const monthStartDate = startOfMonth(currentWeekStart);
  const monthEndDate = endOfMonth(currentWeekStart);
  // Query range must cover both the month (for totals) AND the full week (which may cross month boundary)
  const queryFrom = format(currentWeekStart < monthStartDate ? currentWeekStart : monthStartDate, 'yyyy-MM-dd');
  const queryTo = format(weekEnd > monthEndDate ? weekEnd : monthEndDate, 'yyyy-MM-dd');
  const monthFrom = format(monthStartDate, 'yyyy-MM-dd');
  const monthTo = format(monthEndDate, 'yyyy-MM-dd');

  // Single query covering month + week boundary
  const { data: allTimeEntries = [] } = useTimeEntries(instanceId, employee.id, queryFrom, queryTo);
  const monthTimeEntries = useMemo(
    () => allTimeEntries.filter(e => e.entry_date >= monthFrom && e.entry_date <= monthTo),
    [allTimeEntries, monthFrom, monthTo],
  );
  const timeEntries = useMemo(
    () => allTimeEntries.filter(e => e.entry_date >= dateFrom && e.entry_date <= dateTo),
    [allTimeEntries, dateFrom, dateTo],
  );
  const { data: daysOff = [] } = useEmployeeDaysOff(instanceId, employee.id);
  const { data: workersSettings } = useWorkersSettings(instanceId);
  const timeInputMode = workersSettings?.time_input_mode ?? 'total';
  const createTimeEntry = useCreateTimeEntry(instanceId);
  const updateTimeEntry = useUpdateTimeEntry(instanceId);
  const createDayOff = useCreateEmployeeDayOff(instanceId);
  const deleteDayOff = useDeleteEmployeeDayOff(instanceId);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef<{ date: string; hours: string; minutes: string; startTime: string; endTime: string } | null>(null);
  const executeSaveRef = useRef<(data: { date: string; hours: string; minutes: string; startTime: string; endTime: string }) => Promise<void>>();

  console.log('[WeeklySchedule] monthTimeEntries:', monthTimeEntries.length, 'timeEntries for week:', timeEntries.length, 'employee:', employee.id, 'range:', dateFrom, dateTo);

  const minutesByDate = useMemo(() => {
    const map = new Map<string, { totalMinutes: number; entries: TimeEntry[] }>();
    timeEntries.forEach(entry => {
      const existing = map.get(entry.entry_date) || { totalMinutes: 0, entries: [] };
      existing.totalMinutes += getEffectiveMinutes(entry);
      existing.entries.push(entry);
      map.set(entry.entry_date, existing);
    });
    return map;
  }, [timeEntries]);

  const buildEditingCellFromServer = (date: string) => {
    const existing = minutesByDate.get(date);
    const totalMinutes = existing?.totalMinutes || 0;
    const firstEntry = existing?.entries[0];
    const startT = firstEntry?.start_time ? firstEntry.start_time.slice(11, 16) : '';
    const endT = firstEntry?.end_time ? firstEntry.end_time.slice(11, 16) : '';
    return {
      date,
      hours: Math.floor(totalMinutes / 60).toString(),
      minutes: (totalMinutes % 60).toString(),
      startTime: startT,
      endTime: endT,
    };
  };

  // Sync editingCell from server when selectedDate or query data changes
  useEffect(() => {
    setEditingCell(buildEditingCellFromServer(selectedDate));
  }, [selectedDate, minutesByDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDayOffRecord = (dateStr: string) => daysOff.find(d => dateStr >= d.date_from && dateStr <= d.date_to);

  const handleCellClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Flush any pending debounced save before switching days
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      const toSave = pendingSaveRef.current;
      pendingSaveRef.current = null;
      if (toSave) {
        executeSaveRef.current?.(toSave);
      }
    }
    setSelectedDate(dateStr);
  };

  // Actual save logic — always reads latest minutesByDate via ref to avoid stale closures
  const minutesByDateRef = useRef(minutesByDate);
  minutesByDateRef.current = minutesByDate;

  const executeSave = useCallback(async (saveData: { date: string; hours: string; minutes: string; startTime: string; endTime: string }) => {
    if (savingRef.current) {
      pendingSaveRef.current = saveData;
      return;
    }
    savingRef.current = true;

    try {
      // Calculate start/end timestamps
      let startTimestamp: string;
      let endTimestamp: string;

      if (timeInputMode === 'start_end') {
        const { startTime: start, endTime: end } = saveData;
        if (!start || !end || start.length < 5 || end.length < 5 || start >= end) {
          toast.error('Podaj poprawne godziny (od < do)');
          return;
        }
        startTimestamp = `${saveData.date}T${start}:00`;
        endTimestamp = `${saveData.date}T${end}:00`;
      } else {
        const totalMinutes = (parseInt(saveData.hours) || 0) * 60 + (parseInt(saveData.minutes) || 0);
        if (totalMinutes <= 0) {
          toast.error('Podaj liczbę godzin');
          return;
        }
        const startTime = new Date(`${saveData.date}T08:00:00`);
        startTimestamp = startTime.toISOString();
        endTimestamp = new Date(startTime.getTime() + totalMinutes * 60000).toISOString();
      }

      // One entry per day — find existing or create new
      const { data: existing, error: fetchError } = await supabase
        .from('time_entries')
        .select('id')
        .eq('instance_id', instanceId)
        .eq('employee_id', employee.id)
        .eq('entry_date', saveData.date)
        .limit(1);

      console.log('[TimeEntry save]', { date: saveData.date, startTimestamp, endTimestamp, existing, fetchError });

      if (existing && existing.length > 0) {
        await updateTimeEntry.mutateAsync({ id: existing[0].id, start_time: startTimestamp, end_time: endTimestamp });
      } else {
        await createTimeEntry.mutateAsync({ employee_id: employee.id, entry_date: saveData.date, start_time: startTimestamp, end_time: endTimestamp, entry_type: 'manual' });
      }
      console.log('[TimeEntry save] success');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Błąd podczas zapisywania');
    } finally {
      savingRef.current = false;
      if (pendingSaveRef.current) {
        const next = pendingSaveRef.current;
        pendingSaveRef.current = null;
        executeSaveRef.current?.(next);
      }
    }
  }, [instanceId, employee.id, timeInputMode, createTimeEntry, updateTimeEntry]);

  // Keep ref in sync so debounce timer always calls the latest version
  executeSaveRef.current = executeSave;

  const scheduleSave = useCallback((data: { date: string; hours: string; minutes: string; startTime: string; endTime: string }) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    pendingSaveRef.current = data;
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      const toSave = pendingSaveRef.current;
      pendingSaveRef.current = null;
      if (toSave) {
        executeSaveRef.current?.(toSave);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleHoursChange = (value: string) => {
    if (!editingCell) return;
    setEditingCell({ ...editingCell, hours: value });
  };

  const handleMinutesChange = (value: string) => {
    if (!editingCell) return;
    setEditingCell({ ...editingCell, minutes: value });
  };

  const handleStartTimeChange = (value: string) => {
    if (!editingCell) return;
    setEditingCell({ ...editingCell, startTime: value });
  };

  const handleEndTimeChange = (value: string) => {
    if (!editingCell) return;
    setEditingCell({ ...editingCell, endTime: value });
  };

  // Optimistic local day-off overrides: 'add' = locally marked as day off, 'remove' = locally unmarked
  const [localDayOffOverrides, setLocalDayOffOverrides] = useState<Map<string, 'add' | 'remove'>>(new Map());

  // Clear all overrides when fresh daysOff data arrives from the server
  const prevDaysOffRef = useRef(daysOff);
  useEffect(() => {
    if (prevDaysOffRef.current !== daysOff && localDayOffOverrides.size > 0) {
      setLocalDayOffOverrides(new Map());
    }
    prevDaysOffRef.current = daysOff;
  }, [daysOff, localDayOffOverrides.size]);

  const isDayOff = useCallback((dateStr: string) => {
    const override = localDayOffOverrides.get(dateStr);
    if (override === 'add') return true;
    if (override === 'remove') return false;
    return !!getDayOffRecord(dateStr);
  }, [localDayOffOverrides, daysOff]);

  const handleMarkDayOff = async () => {
    if (!editingCell) return;
    // Optimistic: show as day off immediately
    setLocalDayOffOverrides(prev => new Map(prev).set(editingCell.date, 'add'));
    try {
      await createDayOff.mutateAsync({ employee_id: employee.id, date_from: editingCell.date, date_to: editingCell.date, day_off_type: 'vacation' });
      toast.success('Zapisano jako wolne');
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
      // Revert optimistic update on error
      setLocalDayOffOverrides(prev => { const m = new Map(prev); m.delete(editingCell!.date); return m; });
    }
  };

  const handleRemoveDayOff = async () => {
    if (!editingCell) return;
    const dayOffRecord = getDayOffRecord(editingCell.date);
    if (!dayOffRecord) return;
    // Optimistic: remove day off immediately
    setLocalDayOffOverrides(prev => new Map(prev).set(editingCell.date, 'remove'));
    try {
      await deleteDayOff.mutateAsync(dayOffRecord.id);
      toast.success('Usunięto wolne');
    } catch (error) {
      toast.error('Błąd podczas usuwania');
      // Revert optimistic update on error
      setLocalDayOffOverrides(prev => { const m = new Map(prev); m.delete(editingCell!.date); return m; });
    }
  };

  const weekTotal = useMemo(() => {
    let total = 0;
    minutesByDate.forEach(({ totalMinutes }) => { total += totalMinutes; });
    return total;
  }, [minutesByDate]);

  const monthTotal = useMemo(() => {
    return monthTimeEntries.reduce((sum, e) => sum + (e.total_minutes || 0), 0);
  }, [monthTimeEntries]);

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  };

  const editingDayLabel = editingCell ? format(new Date(editingCell.date + 'T12:00:00'), 'EEEE, d MMM', { locale: pl }) : '';
  const monthName = format(monthStartDate, 'LLLL', { locale: pl });
  const editingCellIsDayOff = editingCell ? isDayOff(editingCell.date) : false;
  const hourOptions = Array.from({ length: 25 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  // For the currently editing day, show the local editingCell value instead of query data
  const getDisplayMinutes = (dateStr: string) => {
    if (editingCell?.date === dateStr) {
      if (timeInputMode === 'start_end') {
        const { startTime, endTime } = editingCell;
        if (startTime && endTime && startTime.length >= 5 && endTime.length >= 5 && endTime > startTime) {
          const [sh, sm] = startTime.split(':').map(Number);
          const [eh, em] = endTime.split(':').map(Number);
          return (eh * 60 + em) - (sh * 60 + sm);
        }
        return 0;
      }
      return (parseInt(editingCell.hours) || 0) * 60 + (parseInt(editingCell.minutes) || 0);
    }
    return minutesByDate.get(dateStr)?.totalMinutes || 0;
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-2xl">
          {format(currentWeekStart, 'd MMM', { locale: pl })} - {format(weekEnd, 'd MMM yyyy', { locale: pl })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDate === dateStr;
          const totalMinutes = getDisplayMinutes(dateStr);
          const isToday = isSameDay(day, new Date());
          const isOff = isDayOff(dateStr);

          return (
            <div key={dateStr} className="flex flex-col">
              <div className={`text-center text-xs py-1 rounded-t ${isToday ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                <div className="font-medium">{format(day, 'EEE', { locale: pl })}</div>
                <div>{format(day, 'd')}</div>
              </div>
              <button
                onClick={() => handleCellClick(day)}
                className={`border rounded-b p-1 text-center min-h-[40px] flex items-center justify-center transition-colors ${
                  isSelected ? 'ring-2 ring-primary border-primary bg-primary/10'
                    : isOff ? 'bg-orange-50 border-orange-200'
                    : totalMinutes > 0 ? 'bg-green-50 border-green-200 hover:bg-green-100'
                    : 'bg-background hover:bg-primary/5'
                }`}
              >
                <span className={`text-sm font-medium ${isOff ? 'text-orange-600' : totalMinutes > 0 ? 'text-green-700' : 'text-muted-foreground'}`}>
                  {isOff ? 'Wolne' : totalMinutes > 0 ? formatMinutes(totalMinutes) : '-'}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {editingCell && (
        <div className="border rounded-lg p-4 bg-card space-y-4">
          <div className="text-2xl font-semibold text-center capitalize">{editingDayLabel}</div>
          <div className="flex items-center justify-center gap-2">
            {timeInputMode === 'start_end' ? (
              <>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-semibold text-foreground">Od</span>
                  <input
                    type="time"
                    value={editingCell.startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="h-14 w-32 text-center text-xl font-medium border rounded-md px-2 bg-background"
                  />
                </div>
                <span className="text-2xl font-bold mt-6">-</span>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-semibold text-foreground">Do</span>
                  <input
                    type="time"
                    value={editingCell.endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="h-14 w-32 text-center text-xl font-medium border rounded-md px-2 bg-background"
                  />
                </div>
              </>
            ) : (
              <>
                <Select value={editingCell.hours} onValueChange={handleHoursChange}>
                  <SelectTrigger className="h-14 w-24 text-center text-xl font-medium"><SelectValue placeholder="0" /></SelectTrigger>
                  <SelectContent>{hourOptions.map(h => (<SelectItem key={h} value={h.toString()}>{h}</SelectItem>))}</SelectContent>
                </Select>
                <span className="text-2xl font-bold">:</span>
                <Select value={editingCell.minutes} onValueChange={handleMinutesChange}>
                  <SelectTrigger className="h-14 w-24 text-center text-xl font-medium"><SelectValue placeholder="0" /></SelectTrigger>
                  <SelectContent>{minuteOptions.map(m => (<SelectItem key={m} value={m.toString()}>{m}</SelectItem>))}</SelectContent>
                </Select>
              </>
            )}
          </div>
          <Button
            onClick={async () => {
              if (!editingCell) return;
              // Flush debounce
              if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
              }
              pendingSaveRef.current = null;
              setManualSaving(true);
              setSaved(false);
              try {
                await executeSave(editingCell);
                setSaved(true);
                toast.success('Godziny zapisane');
                setTimeout(() => setSaved(false), 2000);
              } finally {
                setManualSaving(false);
              }
            }}
            disabled={manualSaving}
            className="w-full h-12"
          >
            {manualSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4 mr-2" />
            ) : null}
            {saved ? 'Zapisano' : 'Zapisz'}
          </Button>
          {editingCellIsDayOff ? (
            <Button onClick={handleRemoveDayOff} variant="outline" className="w-full h-12 bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
              <Trash2 className="w-4 h-4 mr-2" />Usuń Wolne
            </Button>
          ) : (
            <Button onClick={handleMarkDayOff} variant="outline" className="w-full h-12 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100">
              <Palmtree className="w-4 h-4 mr-2" />Wolne
            </Button>
          )}
        </div>
      )}

      <div className="space-y-1.5 pt-2 border-t">
        <div className="flex justify-end items-center gap-3">
          <span className="text-sm font-bold text-foreground">Suma tygodnia:</span>
          <span className="font-bold">{formatMinutes(weekTotal)}</span>
        </div>
        <div className="flex justify-end items-center gap-3">
          <span className="text-sm font-bold text-foreground">Suma miesiąca ({monthName}):</span>
          <span className="font-bold">{formatMinutes(monthTotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
