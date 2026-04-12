import { useTranslation } from 'react-i18next';
import { Coffee, X } from 'lucide-react';

interface Break {
  id: string;
  station_id: string;
  break_date: string;
  start_time: string;
  end_time: string;
  note: string | null;
}

interface BreakBlockProps {
  breakItem: Break;
  style: { top: string; height: string };
  onDelete?: (breakId: string) => void;
}

export function BreakBlock({ breakItem, style, onDelete }: BreakBlockProps) {
  const { t } = useTranslation();

  return (
    <div
      className="absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-lg border-l-4 px-1 md:px-2 py-1 md:py-1.5 bg-slate-500/80 border-slate-600 text-white overflow-hidden group"
      style={style}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] md:text-xs font-semibold truncate">
          <Coffee className="w-3 h-3 shrink-0" />
          {t('calendar.break')}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(breakItem.id);
          }}
          className="shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
          title={t('calendar.deleteBreak')}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="text-[10px] md:text-xs truncate opacity-80 mt-0.5">
        {breakItem.start_time.slice(0, 5)} - {breakItem.end_time.slice(0, 5)}
      </div>
      {breakItem.note && (
        <div className="text-[10px] md:text-xs truncate opacity-70 mt-0.5">
          {breakItem.note}
        </div>
      )}
    </div>
  );
}
