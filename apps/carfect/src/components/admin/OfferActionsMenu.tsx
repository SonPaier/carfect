import { useTranslation } from 'react-i18next';
import {
  Eye,
  Send,
  Trash2,
  Copy,
  RefreshCw,
  CheckCheck,
  Bell,
  Banknote,
  Phone,
  CalendarPlus,
  Printer,
} from 'lucide-react';
import { Badge } from '@shared/ui';
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from '@shared/ui';
import { cn } from '@/lib/utils';
import { OfferWithOptions, statusColors, STATUS_OPTIONS } from './offerTypes';

interface OfferActionsMenuProps {
  offer: OfferWithOptions;
  onPreview: (token: string) => void;
  onCopyLink: (token: string) => void;
  onSendEmail: (offer: OfferWithOptions) => void;
  onChangeStatus: (offerId: string, status: string) => void;
  onOpenApproval: (offer: OfferWithOptions, mode: 'approve' | 'edit') => void;
  onComplete: (offer: OfferWithOptions) => void;
  onReminders: (offer: OfferWithOptions) => void;
  onDelete: (offer: OfferWithOptions) => void;
  onReserve: (offer: OfferWithOptions) => void;
  onPrintPdf?: (token: string) => void;
}

export function OfferActionsMenu({
  offer,
  onPreview,
  onCopyLink,
  onSendEmail,
  onChangeStatus,
  onOpenApproval,
  onComplete,
  onReminders,
  onDelete,
  onReserve,
  onPrintPdf,
}: OfferActionsMenuProps) {
  const { t } = useTranslation();

  return (
    <>
      {offer.customer_data?.phone && (
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `tel:${offer.customer_data.phone}`;
          }}
        >
          <Phone className="w-4 h-4 mr-2" />
          {t('offers.call')}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation();
          onPreview(offer.public_token);
        }}
      >
        <Eye className="w-4 h-4 mr-2" />
        {t('offers.preview')}
      </DropdownMenuItem>
      {onPrintPdf && offer.public_token && offer.offer_format === 'v2' && (
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onPrintPdf(offer.public_token);
          }}
        >
          <Printer className="w-4 h-4 mr-2" />
          Drukuj PDF
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation();
          onCopyLink(offer.public_token);
        }}
      >
        <Copy className="w-4 h-4 mr-2" />
        {t('offers.copyLink')}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation();
          onReserve(offer);
        }}
      >
        <CalendarPlus className="w-4 h-4 mr-2" />
        {t('offers.reserve')}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation();
          onSendEmail(offer);
        }}
      >
        <Send className="w-4 h-4 mr-2" />
        {t('offers.send')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('offers.changeStatus')}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {STATUS_OPTIONS.filter((s) => s !== 'completed').map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={(e) => {
                e.stopPropagation();
                if (status === 'accepted') {
                  onOpenApproval(offer, 'approve');
                } else {
                  onChangeStatus(offer.id, status);
                }
              }}
              disabled={offer.status === status}
            >
              <Badge className={cn('text-xs mr-2', statusColors[status])}>
                {t(`offers.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
              </Badge>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              if (offer.status === 'accepted' || offer.approved_at) {
                onComplete(offer);
              } else {
                onChangeStatus(offer.id, 'completed');
              }
            }}
            disabled={offer.status === 'completed'}
          >
            <Badge className={cn('text-xs mr-2', statusColors['completed'])}>
              {t('offers.statusCompleted')}
            </Badge>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      {(offer.status === 'accepted' || offer.approved_at) && offer.status !== 'completed' && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onComplete(offer);
            }}
            className="text-emerald-600 focus:text-emerald-600"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            {t('offers.markAsCompleted')}
          </DropdownMenuItem>
        </>
      )}
      {offer.status === 'completed' && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onReminders(offer);
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            {t('offers.reminders')}
          </DropdownMenuItem>
        </>
      )}
      {(offer.status === 'accepted' || offer.status === 'completed') && (
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenApproval(offer, 'edit');
          }}
        >
          <Banknote className="w-4 h-4 mr-2" />
          {t('offers.changeAmount')}
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation();
          onDelete(offer);
        }}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {t('offers.delete')}
      </DropdownMenuItem>
    </>
  );
}
