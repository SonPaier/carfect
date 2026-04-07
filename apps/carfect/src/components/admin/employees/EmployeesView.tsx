import { useState, useMemo, useCallback } from 'react';
import { useEmployees, useDeleteEmployee, Employee } from '@/hooks/useEmployees';
import {
  useTimeEntriesForDateRange,
  calculateMonthlySummary,
  TimeEntry,
} from '@/hooks/useTimeEntries';
import { useEmployeeDaysOff, EmployeeDayOff } from '@/hooks/useEmployeeDaysOff';
import { useWorkersSettings } from '@/hooks/useWorkersSettings';
import { useWorkingHours } from '@/hooks/useWorkingHours';
import { useAuth } from '@/hooks/useAuth';
import { Button, EmptyState } from '@shared/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import { ConfirmDialog } from '@shared/ui';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Pencil,
  CalendarOff,
  Settings2,
  MoreVertical,
  Trash2,
  KeyRound,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  getISOWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameMonth,
  isSameWeek,
  getDay,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import AddEditEmployeeDialog from './AddEditEmployeeDialog';
import GrantAccessDialog from './GrantAccessDialog';
import WorkerTimeDialog from './WorkerTimeDialog';
import AddEmployeeDayOffDialog from './AddEmployeeDayOffDialog';
import WorkersSettingsDrawer from './WorkersSettingsDrawer';

// Weekday index to working_hours key map (0=Sunday, 1=Monday, etc)
const WEEKDAY_TO_KEY: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

interface EmployeesViewProps {
  instanceId: string | null;
}

const WEEKDAY_SHORT: Record<number, string> = {
  0: 'ND',
  1: 'PN',
  2: 'WT',
  3: 'ŚR',
  4: 'CZ',
  5: 'PT',
  6: 'SB',
};

const EmployeesView = ({ instanceId }: EmployeesViewProps) => {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('super_admin');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [workerDialogEmployee, setWorkerDialogEmployee] = useState<Employee | null>(null);
  const [dayOffDialogOpen, setDayOffDialogOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [grantAccessEmployee, setGrantAccessEmployee] = useState<Employee | null>(null);

  // Fetch workers settings to determine if we're in weekly or monthly mode
  const { data: workersSettings, isLoading: loadingSettings } = useWorkersSettings(instanceId);
  const timeTrackingEnabled = workersSettings?.time_tracking_enabled ?? false;
  const isWeeklyMode = workersSettings?.report_frequency === 'weekly';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month boundaries
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Week boundaries (Monday to Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekNumber = getISOWeek(currentDate);

  // Date range for queries based on mode
  const dateFrom = isWeeklyMode
    ? format(weekStart, 'yyyy-MM-dd')
    : format(monthStart, 'yyyy-MM-dd');
  const dateTo = isWeeklyMode ? format(weekEnd, 'yyyy-MM-dd') : format(monthEnd, 'yyyy-MM-dd');

  // Period boundaries for days off calculation
  const periodStart = isWeeklyMode ? weekStart : monthStart;
  const periodEnd = isWeeklyMode ? weekEnd : monthEnd;

  const { data: employees = [], isLoading: loadingEmployees } = useEmployees(instanceId);
  const deleteEmployee = useDeleteEmployee(instanceId);
  const { data: timeEntries = [], isLoading: loadingEntries } = useTimeEntriesForDateRange(
    instanceId,
    dateFrom,
    dateTo,
  );
  const { data: daysOff = [], isLoading: loadingDaysOff } = useEmployeeDaysOff(instanceId, null);
  const { data: workingHours } = useWorkingHours(instanceId);

  // Helper to get opening time for a given date
  const getOpeningTime = (dateStr: string): Date | null => {
    if (!workingHours) return null;
    // Use ISO format with time to avoid timezone issues
    const date = new Date(dateStr + 'T12:00:00'); // Use noon so getDay() works correctly
    const dayOfWeek = getDay(date);
    const dayKey = WEEKDAY_TO_KEY[dayOfWeek];
    const dayHours = workingHours[dayKey];
    if (!dayHours || !dayHours.open) return null;

    const [hours, minutes] = dayHours.open.split(':').map(Number);
    // Create opening date in local time
    const openingDate = new Date(dateStr + 'T00:00:00');
    openingDate.setHours(hours, minutes, 0, 0);
    return openingDate;
  };

  // Calculate pre-opening minutes for entries on a given date
  const calculatePreOpeningMinutes = (entries: TimeEntry[], dateStr: string): number => {
    const openingTime = getOpeningTime(dateStr);
    if (!openingTime) return 0;

    let preOpeningMinutes = 0;
    entries.forEach((entry) => {
      if (!entry.start_time) return;
      const startTime = new Date(entry.start_time);
      if (startTime < openingTime) {
        const endTime = entry.end_time ? new Date(entry.end_time) : new Date();
        const effectiveEnd = endTime < openingTime ? endTime : openingTime;
        const diffMs = effectiveEnd.getTime() - startTime.getTime();
        preOpeningMinutes += Math.max(0, Math.floor(diffMs / 60000));
      }
    });
    return preOpeningMinutes;
  };

  // Calculate pre-opening time per employee for the period
  const preOpeningByEmployee = useMemo(() => {
    const result = new Map<string, number>();

    // Group entries by employee and date
    const entriesByEmployeeDate = new Map<string, Map<string, TimeEntry[]>>();
    timeEntries.forEach((entry) => {
      if (!entriesByEmployeeDate.has(entry.employee_id)) {
        entriesByEmployeeDate.set(entry.employee_id, new Map());
      }
      const dateMap = entriesByEmployeeDate.get(entry.employee_id)!;
      if (!dateMap.has(entry.entry_date)) {
        dateMap.set(entry.entry_date, []);
      }
      dateMap.get(entry.entry_date)!.push(entry);
    });

    entriesByEmployeeDate.forEach((dateMap, employeeId) => {
      let totalPreOpening = 0;
      dateMap.forEach((entries, dateStr) => {
        totalPreOpening += calculatePreOpeningMinutes(entries, dateStr);
      });
      result.set(employeeId, totalPreOpening);
    });

    return result;
  }, [timeEntries, workingHours]);

  // Filter only active (not soft-deleted) employees
  const activeEmployees = employees.filter(
    (e) => e.active && !(e as Record<string, unknown>).deleted_at,
  );

  // Calculate period totals (works for both weekly and monthly)
  const periodSummary = useMemo(() => calculateMonthlySummary(timeEntries), [timeEntries]);

  // Time calculation mode from settings (default: start_to_stop)
  const timeCalculationMode = workersSettings?.time_calculation_mode ?? 'start_to_stop';

  // Get days off for this period
  const getDaysOffForEmployee = (employeeId: string) => {
    return daysOff.filter((d) => {
      if (d.employee_id !== employeeId) return false;
      const from = parseISO(d.date_from);
      const to = parseISO(d.date_to);
      // Check if the day off range overlaps with the current period
      // Overlap exists if: dayOff.from <= periodEnd AND dayOff.to >= periodStart
      return from <= periodEnd && to >= periodStart;
    });
  };

  // Format days off for display on the card
  // Format days off as array of objects with from/to dates for display
  type DayOffLine = { from: string; to: string | null };

  const formatDaysOffForPeriodLines = (employeeDaysOff: EmployeeDayOff[]): DayOffLine[] => {
    const allDates: Date[] = [];

    employeeDaysOff.forEach((item) => {
      const from = parseISO(item.date_from);
      const to = parseISO(item.date_to);
      const daysInRange = eachDayOfInterval({ start: from, end: to });
      daysInRange.forEach((day) => {
        const isInPeriod = isWeeklyMode
          ? isSameWeek(day, currentDate, { weekStartsOn: 1 })
          : isSameMonth(day, currentDate);
        if (isInPeriod) {
          allDates.push(day);
        }
      });
    });

    if (allDates.length === 0) return [];

    // Sort and deduplicate
    allDates.sort((a, b) => a.getTime() - b.getTime());
    const uniqueDates = allDates.filter(
      (d, i, arr) => i === 0 || d.getTime() !== arr[i - 1].getTime(),
    );

    // Group consecutive dates into ranges - each range is separate line
    const lines: DayOffLine[] = [];
    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;

    const formatDateWithDay = (date: Date) => {
      const dayNum = format(date, 'd');
      const monthName = format(date, 'LLLL', { locale: pl });
      const weekday = WEEKDAY_SHORT[getDay(date)];
      return `${dayNum} ${monthName} (${weekday})`;
    };

    uniqueDates.forEach((date, idx) => {
      const prevDate = uniqueDates[idx - 1];
      const isConsecutive = prevDate && date.getTime() - prevDate.getTime() === 24 * 60 * 60 * 1000;

      if (isConsecutive && rangeStart) {
        rangeEnd = date;
      } else {
        if (rangeStart) {
          lines.push({
            from: formatDateWithDay(rangeStart),
            to: rangeEnd ? formatDateWithDay(rangeEnd) : null,
          });
        }
        rangeStart = date;
        rangeEnd = null;
      }
    });

    // Close last range
    if (rangeStart) {
      lines.push({
        from: formatDateWithDay(rangeStart),
        to: rangeEnd ? formatDateWithDay(rangeEnd) : null,
      });
    }

    return lines;
  };

  const handlePrevPeriod = () => {
    if (isWeeklyMode) {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNextPeriod = () => {
    if (isWeeklyMode) {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
  };

  const handleEditEmployee = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const handleTileClick = (employee: Employee) => {
    setWorkerDialogEmployee(employee);
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    try {
      await deleteEmployee.mutateAsync(deletingEmployee.id);
      toast.success(t('employeeDialog.employeeDeleted'));
      setDeletingEmployee(null);
    } catch (error) {
      toast.error(t('employeeDialog.deleteError'));
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEmployee(null);
    // Also close worker time dialog when edit dialog closes
    setWorkerDialogEmployee(null);
  };

  // Format week range display: "Tydzień 5 (27.01 - 02.02)"
  const formatWeekDisplay = () => {
    const startFormatted = format(weekStart, 'd.MM');
    const endFormatted = format(weekEnd, 'd.MM');
    return `Tydzień ${weekNumber} (${startFormatted} - ${endFormatted})`;
  };

  const isLoading = loadingEmployees || loadingEntries || loadingDaysOff || loadingSettings;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-medium">Pracownicy</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              onClick={() => setSettingsDrawerOpen(true)}
              variant="outline"
              size="icon"
              className="bg-white"
              title="Ustawienia czasu pracy"
            >
              <Settings2 className="w-5 h-5" />
            </Button>
            {timeTrackingEnabled && (
              <Button
                onClick={() => setDayOffDialogOpen(true)}
                variant="outline"
                size="icon"
                className="bg-white"
                title="Dodaj nieobecność"
              >
                <CalendarOff className="w-5 h-5" />
              </Button>
            )}
            <Button onClick={handleAddEmployee} title="Dodaj pracownika">
              Dodaj pracownika
            </Button>
          </div>
        )}
      </div>
      <div id="hint-infobox-slot" className="flex flex-col gap-4" />

      {/* Period picker (Month or Week) - only when time tracking enabled */}
      {timeTrackingEnabled && activeEmployees.length > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevPeriod} className="bg-white">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextPeriod} className="bg-white">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="font-medium text-lg">
            {isWeeklyMode ? formatWeekDisplay() : format(currentDate, 'LLLL yyyy', { locale: pl })}
          </span>
        </div>
      )}

      {/* Empty state */}
      {activeEmployees.length === 0 ? (
        <EmptyState
          icon={User}
          title="Brak pracowników"
          description="Dodaj pierwszego pracownika, aby rozpocząć"
        />
      ) : (
        <>
          {/* Table layout */}
          <div className="overflow-hidden rounded-lg border border-border/50 max-w-full">
            <Table className="bg-white w-full table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Pracownik</TableHead>
                  {timeTrackingEnabled && (
                    <TableHead className="text-center w-[30%]">Przepracowano</TableHead>
                  )}
                  {isAdmin && <TableHead className="w-[50px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEmployees.map((employee) => {
                  const summary = periodSummary.get(employee.id);
                  const totalMinutes = summary?.total_minutes || 0;
                  const preOpeningMinutes = preOpeningByEmployee.get(employee.id) || 0;

                  const displayMinutes =
                    timeCalculationMode === 'opening_to_stop'
                      ? Math.max(0, totalMinutes - preOpeningMinutes)
                      : totalMinutes;

                  const hours = Math.floor(displayMinutes / 60);
                  const mins = displayMinutes % 60;

                  return (
                    <TableRow
                      key={employee.id}
                      className={timeTrackingEnabled ? 'cursor-pointer hover:bg-hover-strong' : ''}
                      onClick={timeTrackingEnabled ? () => handleTileClick(employee) : undefined}
                    >
                      <TableCell className="py-3">
                        <span className="font-medium truncate">{employee.name}</span>
                      </TableCell>
                      {timeTrackingEnabled && (
                        <TableCell className="text-center py-3">
                          <div className="text-sm leading-tight">
                            {hours > 0 && <div>{hours}h</div>}
                            <div>{mins}min</div>
                          </div>
                        </TableCell>
                      )}
                      {isAdmin && (
                        <TableCell className="text-right py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEmployee(e as unknown as React.MouseEvent, employee);
                                }}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edytuj
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGrantAccessEmployee(employee);
                                }}
                              >
                                <KeyRound className="w-4 h-4 mr-2" />
                                Daj dostęp
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingEmployee(employee);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Usuń
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Vacations/Days off section - only when time tracking enabled */}
          {timeTrackingEnabled &&
            (() => {
              // Collect all employees with days off in this period
              const employeesWithDaysOff = activeEmployees
                .map((emp) => ({
                  employee: emp,
                  daysOffLines: formatDaysOffForPeriodLines(getDaysOffForEmployee(emp.id)),
                }))
                .filter((item) => item.daysOffLines.length > 0);

              if (employeesWithDaysOff.length === 0) return null;

              return (
                <div className="mt-6 space-y-3">
                  <h3 className="font-medium text-muted-foreground">Nieobecności</h3>
                  <div className="space-y-2">
                    {employeesWithDaysOff.map(({ employee, daysOffLines }) => (
                      <div
                        key={employee.id}
                        className="flex items-start gap-3 p-3 border rounded-lg bg-card"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.photo_url || undefined} alt={employee.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {employee.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium mb-1">{employee.name}</div>
                          <div className="text-sm space-y-1.5">
                            {daysOffLines.map((line, idx) => (
                              <div key={idx}>
                                {line.to ? (
                                  <>
                                    <span className="text-muted-foreground">od </span>
                                    <span className="font-medium text-foreground">{line.from}</span>
                                    <span className="text-muted-foreground"> do </span>
                                    <span className="font-medium text-foreground">{line.to}</span>
                                  </>
                                ) : (
                                  <span className="font-medium text-foreground">{line.from}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
        </>
      )}

      {/* Dialogs */}
      <AddEditEmployeeDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        instanceId={instanceId}
        employee={editingEmployee}
        isAdmin={isAdmin}
      />

      {workerDialogEmployee && instanceId && (
        <WorkerTimeDialog
          open={!!workerDialogEmployee}
          onOpenChange={(open) => !open && setWorkerDialogEmployee(null)}
          employee={workerDialogEmployee}
          instanceId={instanceId}
          showEditButton={isAdmin}
          onEditEmployee={() => {
            setEditingEmployee(workerDialogEmployee);
            setDialogOpen(true);
          }}
        />
      )}

      <AddEmployeeDayOffDialog
        open={dayOffDialogOpen}
        onOpenChange={setDayOffDialogOpen}
        instanceId={instanceId}
        employees={activeEmployees}
      />

      <WorkersSettingsDrawer
        open={settingsDrawerOpen}
        onOpenChange={setSettingsDrawerOpen}
        instanceId={instanceId}
      />

      <ConfirmDialog
        open={!!deletingEmployee}
        onOpenChange={(open) => !open && setDeletingEmployee(null)}
        title={t('employeeDialog.deleteTitle')}
        description={t('employeeDialog.deleteDescription', { name: deletingEmployee?.name })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDeleteEmployee}
        variant="destructive"
      />

      {grantAccessEmployee && instanceId && (
        <GrantAccessDialog
          open={!!grantAccessEmployee}
          onOpenChange={(open) => !open && setGrantAccessEmployee(null)}
          instanceId={instanceId}
          employeeName={grantAccessEmployee.name}
        />
      )}
    </div>
  );
};

export default EmployeesView;
