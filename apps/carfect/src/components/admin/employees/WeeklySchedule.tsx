import { useState, useMemo, useEffect } from 'react';
import { Button } from '@shared/ui';
import { ChevronLeft, ChevronRight, Palmtree, Trash2, Loader2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useTimeEntries, useCreateTimeEntry, useUpdateTimeEntry, TimeEntry } from '@/hooks/useTimeEntries';
import { useEmployeeDaysOff, useCreateEmployeeDayOff, useDeleteEmployeeDayOff } from '@/hooks/useEmployeeDaysOff';

import { Employee } from '@/hooks/useEmployees';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface WeeklyScheduleProps {
  employee: Employee;
  instanceId: string;
}

interface EditingCell {
  date: string;
  startTime: string;
  endTime: string;
}

const WeeklySchedule = ({ employee, instanceId }: WeeklyScheduleProps) => {
  const { t } = useTranslation();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  // Default to today selected
  const [editingCell, setEditingCell] = useState<EditingCell | null>(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return {
      date: todayStr,
      startTime: '',
      endTime: '',
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const dateFrom = format(currentWeekStart, 'yyyy-MM-dd');
  const dateTo = format(weekEnd, 'yyyy-MM-dd');


  const { data: timeEntries = [] } = useTimeEntries(instanceId, employee.id, dateFrom, dateTo);
  const { data: daysOff = [] } = useEmployeeDaysOff(instanceId, employee.id);

  const createTimeEntry = useCreateTimeEntry(instanceId);
  const updateTimeEntry = useUpdateTimeEntry(instanceId);
  const createDayOff = useCreateEmployeeDayOff(instanceId);
  const deleteDayOff = useDeleteEmployeeDayOff(instanceId);

  // Helper to extract HH:mm from ISO string
  const formatTimeFromISO = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      return format(new Date(isoString), 'HH:mm');
    } catch {
      return '';
    }
  };

  // Update editing cell with actual data when time entries load (for default today selection)
  useEffect(() => {
    if (!initialLoadDone && editingCell && timeEntries.length > 0) {
      const existing = minutesByDate.get(editingCell.date);
      const firstEntry = existing?.entries[0];
      setEditingCell(prev => prev ? {
        ...prev,
        startTime: firstEntry ? formatTimeFromISO(firstEntry.start_time) : '',
        endTime: firstEntry ? formatTimeFromISO(firstEntry.end_time) : '',
      } : null);
      setInitialLoadDone(true);
    }
  }, [timeEntries, initialLoadDone]);

  // Check if a date is a day off and return the day off record
  const getDayOffRecord = (dateStr: string) => {
    return daysOff.find(d => dateStr >= d.date_from && dateStr <= d.date_to);
  };

  // Compute minutes from start/end times (fallback when total_minutes is null)
  const getEntryMinutes = (entry: TimeEntry): number => {
    if (entry.total_minutes) return entry.total_minutes;
    if (entry.start_time && entry.end_time) {
      const diff = new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime();
      return Math.max(0, Math.floor(diff / 60000));
    }
    return 0;
  };

  // Group entries by date and sum minutes
  const minutesByDate = useMemo(() => {
    const map = new Map<string, { totalMinutes: number; entries: TimeEntry[] }>();

    timeEntries.forEach(entry => {
      const existing = map.get(entry.entry_date) || { totalMinutes: 0, entries: [] };
      existing.totalMinutes += getEntryMinutes(entry);
      existing.entries.push(entry);
      map.set(entry.entry_date, existing);
    });

    return map;
  }, [timeEntries]);

  const handlePrevWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));

  const handleCellClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = minutesByDate.get(dateStr);
    const firstEntry = existing?.entries[0];

    setEditingCell({
      date: dateStr,
      startTime: firstEntry ? formatTimeFromISO(firstEntry.start_time) : '',
      endTime: firstEntry ? formatTimeFromISO(firstEntry.end_time) : '',
    });
  };

  const handleSave = async () => {
    if (!editingCell || isSaving) return;
    if (!editingCell.startTime || !editingCell.endTime) {
      toast.error(t('timeEntry.startEndRequired'));
      return;
    }

    const startTime = new Date(`${editingCell.date}T${editingCell.startTime}:00`);
    const endTime = new Date(`${editingCell.date}T${editingCell.endTime}:00`);

    if (endTime <= startTime) {
      toast.error(t('timeEntry.endMustBeAfterStart'));
      return;
    }

    const existing = minutesByDate.get(editingCell.date);

    setIsSaving(true);
    try {
      if (existing && existing.entries.length > 0) {
        const firstEntry = existing.entries[0];
        await updateTimeEntry.mutateAsync({
          id: firstEntry.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        });
      } else {
        await createTimeEntry.mutateAsync({
          employee_id: employee.id,
          entry_date: editingCell.date,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          entry_type: 'manual',
        });
      }
      toast.success(t('timeEntry.saved'));
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('timeEntry.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkDayOff = async () => {
    if (!editingCell) return;
    
    try {
      await createDayOff.mutateAsync({
        employee_id: employee.id,
        date_from: editingCell.date,
        date_to: editingCell.date,
        day_off_type: 'vacation',
      });
      toast.success(t('timeEntry.dayOffSaved'));
      setEditingCell(null);
    } catch (error) {
      console.error('Day off error:', error);
      toast.error(t('timeEntry.dayOffError'));
    }
  };

  const handleRemoveDayOff = async () => {
    if (!editingCell) return;
    
    const dayOffRecord = getDayOffRecord(editingCell.date);
    if (!dayOffRecord) return;
    
    try {
      await deleteDayOff.mutateAsync(dayOffRecord.id);
      toast.success(t('timeEntry.dayOffRemoved'));
      setEditingCell({
        ...editingCell,
        startTime: '',
        endTime: '',
      });
    } catch (error) {
      console.error('Remove day off error:', error);
      toast.error(t('timeEntry.dayOffRemoveError'));
    }
  };

  // Calculate week total
  const weekTotal = useMemo(() => {
    let total = 0;
    minutesByDate.forEach(({ totalMinutes }) => {
      total += totalMinutes;
    });
    return total;
  }, [minutesByDate]);



  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  };

  // Find which day is being edited to show its label in the editor panel
  const editingDayLabel = editingCell
    ? format(new Date(editingCell.date), 'EEEE, d MMM', { locale: pl })
    : '';
  
  // Month name for display

  // Check if editing cell is a day off
  const editingCellIsDayOff = editingCell ? !!getDayOffRecord(editingCell.date) : false;

  return (
    <div className="w-full space-y-2">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-2xl">
          {format(currentWeekStart, 'd MMM', { locale: pl })} - {format(weekEnd, 'd MMM yyyy', { locale: pl })}
        </span>
        <Button variant="ghost" size="icon" onClick={handleNextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week grid - days only, no inline editing */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = editingCell?.date === dateStr;
          const dayData = minutesByDate.get(dateStr);
          const totalMinutes = dayData?.totalMinutes || 0;
          const isToday = isSameDay(day, new Date());
          const isOff = !!getDayOffRecord(dateStr);
          
          return (
            <div key={dateStr} className="flex flex-col">
              <div className={`text-center text-xs py-1 rounded-t ${
                isToday ? 'bg-primary text-primary-foreground' : 'bg-white dark:bg-card'
              }`}>
                <div className="font-medium">{format(day, 'EEE', { locale: pl })}</div>
                <div>{format(day, 'd')}</div>
              </div>
              
              {/* Time cell - click to select for editing */}
              <button
                onClick={() => handleCellClick(day)}
                className={`border rounded-b p-1 text-center min-h-[40px] flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/10'
                    : isOff
                      ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
                      : totalMinutes > 0 
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900' 
                        : 'bg-background hover:bg-hover-strong'
                }`}
              >
                <span className={`text-xs font-medium leading-tight ${
                  isOff
                    ? 'text-orange-600 dark:text-orange-400'
                    : totalMinutes > 0
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-muted-foreground'
                }`}>
                  {isOff ? 'Wolne' : (() => {
                    const entry = dayData?.entries[0];
                    if (!entry || !entry.start_time || !entry.end_time) return '-';
                    return (
                      <>
                        <div>{formatTimeFromISO(entry.start_time)}</div>
                        <div>{formatTimeFromISO(entry.end_time)}</div>
                      </>
                    );
                  })()}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor panel - appears below the week grid when a day is selected */}
      {editingCell && (
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <div className="text-2xl font-semibold text-center capitalize">{editingDayLabel}</div>

          <div className="flex items-center justify-center gap-2">
            <input
              type="time"
              value={editingCell.startTime}
              onChange={(e) => setEditingCell({ ...editingCell, startTime: e.target.value })}
              className="h-14 w-32 text-center text-xl font-medium border rounded-md bg-background px-3"
            />
            <span className="text-xl text-muted-foreground">—</span>
            <input
              type="time"
              value={editingCell.endTime}
              onChange={(e) => setEditingCell({ ...editingCell, endTime: e.target.value })}
              className="h-14 w-32 text-center text-xl font-medium border rounded-md bg-background px-3"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Zapisz
            </Button>
            {editingCellIsDayOff ? (
              <Button
                onClick={handleRemoveDayOff}
                size="sm"
                variant="outline"
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Usuń Wolne
              </Button>
            ) : (
              <Button
                onClick={handleMarkDayOff}
                size="sm"
                variant="outline"
                className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <Palmtree className="w-4 h-4 mr-1" />
                Wolne
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Week and month summary - right aligned with bold black labels */}
      <div className="space-y-1.5 pt-2 border-t">
        <div className="flex justify-end items-center gap-3">
          <span className="text-sm font-bold text-foreground">Suma tygodnia:</span>
          <span className="font-bold">{formatMinutes(weekTotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
