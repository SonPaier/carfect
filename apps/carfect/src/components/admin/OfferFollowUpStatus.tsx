import { ChevronDown, StickyNote } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type FollowUpPhoneStatus = 'called_discussed' | 'call_later' | 'called_no_answer' | null;

interface OfferFollowUpStatusProps {
  offerId: string;
  currentStatus: FollowUpPhoneStatus;
  onStatusChange: (offerId: string, newStatus: FollowUpPhoneStatus) => void;
  hasInternalNote?: boolean;
  onNoteClick?: () => void;
}

const STATUS_STYLES: Record<NonNullable<FollowUpPhoneStatus>, string> = {
  called_discussed: 'bg-green-500 text-white hover:bg-green-600',
  call_later: 'bg-yellow-400 text-gray-800 hover:bg-yellow-500',
  called_no_answer: 'bg-orange-500 text-white hover:bg-orange-600',
};

const STATUS_I18N_KEYS: Record<NonNullable<FollowUpPhoneStatus>, string> = {
  called_discussed: 'followUpStatus.calledDiscussed',
  call_later: 'followUpStatus.callLater',
  called_no_answer: 'followUpStatus.calledNoAnswer',
};

const DEFAULT_STATUS_CLASS = 'bg-gray-200 text-gray-600 hover:bg-gray-300';

export function OfferFollowUpStatus({
  offerId,
  currentStatus,
  onStatusChange,
  hasInternalNote = false,
  onNoteClick,
}: OfferFollowUpStatusProps) {
  const { t } = useTranslation();
  const currentLabel = currentStatus ? t(STATUS_I18N_KEYS[currentStatus]) : null;
  const currentClassName = currentStatus ? STATUS_STYLES[currentStatus] : null;

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleStatusChange = (newStatus: FollowUpPhoneStatus) => {
    onStatusChange(offerId, newStatus);
  };

  return (
    <div className="flex items-center gap-1.5" onClick={handleStatusClick}>
      {/* Status dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              currentClassName ?? DEFAULT_STATUS_CLASS,
            )}
            onClick={handleStatusClick}
          >
            {currentLabel ?? t('followUpStatus.contactStatus')}
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onClick={handleStatusClick}>
          {(Object.keys(STATUS_STYLES) as NonNullable<FollowUpPhoneStatus>[]).map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              className="p-1"
            >
              <span
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium w-full text-center',
                  STATUS_STYLES[status],
                )}
              >
                {t(STATUS_I18N_KEYS[status])}
              </span>
            </DropdownMenuItem>
          ))}
          {/* Notatka option */}
          <DropdownMenuItem onClick={() => onNoteClick?.()} className="p-1">
            <span
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium w-full text-center flex items-center justify-center gap-1.5',
                'bg-blue-500 text-white hover:bg-blue-600',
              )}
            >
              <StickyNote className="w-3.5 h-3.5" />
              {t('followUpStatus.note')}
            </span>
          </DropdownMenuItem>
          {currentStatus && (
            <DropdownMenuItem onClick={() => handleStatusChange(null)} className="p-1">
              <span
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium w-full text-center',
                  DEFAULT_STATUS_CLASS,
                )}
              >
                {t('followUpStatus.removeStatus')}
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Note icon - visible when internal note exists */}
      {hasInternalNote && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNoteClick?.();
          }}
          className="w-8 h-8 rounded-full bg-green-500 hover:bg-gray-600 flex items-center justify-center transition-colors"
          title={t('followUpStatus.internalNote')}
        >
          <StickyNote className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  );
}
