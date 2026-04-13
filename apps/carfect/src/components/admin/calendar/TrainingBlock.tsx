import { cn } from '@/lib/utils';
import { GraduationCap } from 'lucide-react';
import { parseTime } from './useCalendarWorkingHours';
import type { Employee, Training } from './types';

function getTrainingStatusColor(status: string): string {
  if (status === 'sold_out') {
    return 'bg-purple-300 border-purple-500 text-purple-900';
  }
  return 'bg-pink-200 border-pink-400 text-pink-900';
}

interface TrainingBlockProps {
  training: Training;
  style: { top: string; height: string };
  zIndex: number;
  employees: Employee[];
  onClick?: (training: Training) => void;
}

export function TrainingBlock({ training, style, zIndex, employees, onClick }: TrainingBlockProps) {
  const isMultiDayTraining = training.end_date && training.end_date !== training.start_date;
  const statusLabel = training.status === 'sold_out' ? 'Zamknięte' : 'Otwarte';

  const getDayAbbr = (dateStr: string) => {
    const dayNames = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB'];
    const d = new Date(dateStr + 'T00:00:00');
    return dayNames[d.getDay()];
  };

  const dayRangeLabel = isMultiDayTraining
    ? ` (${getDayAbbr(training.start_date)} - ${getDayAbbr(training.end_date!)})`
    : '';

  const trainingEmps = (training.assigned_employee_ids || [])
    .map((id: string) => employees.find((e) => e.id === id))
    .filter((e): e is Employee => !!e);

  const durationMinutes =
    (parseTime(training.end_time.substring(0, 5)) -
      parseTime(training.start_time.substring(0, 5))) *
    60;

  return (
    <div
      className={cn(
        'absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-lg border px-1 md:px-2 py-0.5 md:py-1 cursor-pointer',
        'transition-all duration-150 hover:shadow-lg hover:z-20 overflow-hidden select-none',
        getTrainingStatusColor(training.status),
      )}
      style={{ ...style, zIndex }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(training);
      }}
    >
      <div className="px-0.5">
        <span className="text-[13px] md:text-[15px] font-bold tabular-nums shrink-0 flex items-center gap-1 pb-0.5">
          {training.start_time.substring(0, 5)} - {training.end_time.substring(0, 5)}
          {dayRangeLabel}
        </span>
        <div className="flex items-center gap-1 text-[11px] md:text-[13px] font-bold truncate mt-0.5">
          <GraduationCap className="w-3 h-3 shrink-0" />
          <span className="truncate">
            Szkolenie {training.title.replace(/^Szkolenie\s*/i, '')}
          </span>
        </div>
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          <span
            className={cn(
              'inline-block px-1 py-0.5 text-[9px] md:text-[10px] font-medium rounded leading-none',
              training.status === 'sold_out'
                ? 'bg-white/30 text-white'
                : 'bg-pink-900/20 text-pink-900',
            )}
          >
            {statusLabel}
          </span>
        </div>
        {trainingEmps.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {trainingEmps.slice(0, 2).map((emp) => (
              <span
                key={emp.id}
                className="inline-flex items-center px-2.5 py-1 text-[12px] md:text-[13px] font-semibold bg-primary text-primary-foreground rounded-md leading-none"
              >
                {emp.name.split(' ')[0]}
              </span>
            ))}
            {trainingEmps.length > 2 && (
              <span className="inline-flex items-center px-2.5 py-1 text-[12px] md:text-[13px] font-semibold bg-primary/90 text-primary-foreground rounded-md leading-none">
                +{trainingEmps.length - 2}
              </span>
            )}
          </div>
        )}
        {training.description && durationMinutes > 30 && (
          <div className="text-[14px] opacity-80 mt-0.5 whitespace-pre-wrap">
            {training.description}
          </div>
        )}
      </div>
    </div>
  );
}
