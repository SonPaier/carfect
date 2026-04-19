import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/ui';
import { Button } from '@shared/ui';
import { Label } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Calendar } from '@shared/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui';
import {
  useCreateEmployeeDayOff,
  DayOffType,
  DAY_OFF_TYPE_LABELS,
} from '@/hooks/useEmployeeDaysOff';
import { Employee } from '@/hooks/useEmployees';
import { toast } from 'sonner';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';

interface AddEmployeeDayOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string | null;
  employees: Employee[];
}

const AddEmployeeDayOffDialog = ({
  open,
  onOpenChange,
  instanceId,
  employees,
}: AddEmployeeDayOffDialogProps) => {
  const [employeeId, setEmployeeId] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dayOffType, setDayOffType] = useState<DayOffType>('vacation');

  const createDayOff = useCreateEmployeeDayOff(instanceId);
  const isSubmitting = createDayOff.isPending;

  useEffect(() => {
    if (open) {
      setEmployeeId(employees[0]?.id || '');
      setDateRange(undefined);
      setDayOffType('vacation');
    }
  }, [employees, open]);

  const { t } = useTranslation();

  const handleSubmit = async () => {
    if (!employeeId) {
      toast.error(t('admin.daysOff.selectEmployeeError'));
      return;
    }
    if (!dateRange?.from) {
      toast.error(t('admin.daysOff.selectDateError'));
      return;
    }

    try {
      await createDayOff.mutateAsync({
        employee_id: employeeId,
        date_from: format(dateRange.from, 'yyyy-MM-dd'),
        date_to: format(dateRange.to || dateRange.from, 'yyyy-MM-dd'),
        day_off_type: dayOffType,
      });
      toast.success(t('admin.daysOff.added'));
      onOpenChange(false);
    } catch (error) {
      toast.error(t('admin.daysOff.addError'));
    }
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return t('admin.daysOff.selectPeriod');
    if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
      return format(dateRange.from, 'd MMMM yyyy', { locale: getDateLocale() });
    }
    return `${format(dateRange.from, 'd MMM', { locale: getDateLocale() })} - ${format(dateRange.to, 'd MMM yyyy', { locale: getDateLocale() })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.daysOff.addTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date range picker - first */}
          <div className="space-y-2">
            <Label>{t('admin.daysOff.periodLabel')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal bg-white',
                    !dateRange?.from && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={getDateLocale()}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Day off type - second */}
          <div className="space-y-2">
            <Label>{t('admin.daysOff.typeLabel')}</Label>
            <Select value={dayOffType} onValueChange={(v) => setDayOffType(v as DayOffType)}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DAY_OFF_TYPE_LABELS) as DayOffType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {DAY_OFF_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee select - third */}
          <div className="space-y-2">
            <Label>{t('admin.daysOff.employeeLabel')}</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={t('admin.daysOff.selectEmployee')} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-white">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDayOffDialog;
