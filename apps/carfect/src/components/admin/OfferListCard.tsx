import { useTranslation } from 'react-i18next';
import { Eye, MoreVertical } from 'lucide-react';
import { formatViewedDate } from '@shared/utils';
import { Button } from '@shared/ui';
import { Badge } from '@shared/ui';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@shared/ui';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { OfferWithOptions, statusColors, formatPrice } from './offerTypes';
import { OfferActionsMenu } from './OfferActionsMenu';
import { OfferFollowUpStatus } from './OfferFollowUpStatus';
import type { FollowUpPhoneStatus } from './offerTypes';

interface OfferListCardProps {
  offer: OfferWithOptions;
  onEdit: (offerId: string) => void;
  onPreview: (token: string) => void;
  onCopyLink: (token: string) => void;
  onSendEmail: (offer: OfferWithOptions) => void;
  onChangeStatus: (offerId: string, status: string) => void;
  onOpenApproval: (offer: OfferWithOptions, mode: 'approve' | 'edit') => void;
  onComplete: (offer: OfferWithOptions) => void;
  onReminders: (offer: OfferWithOptions) => void;
  onDelete: (offer: OfferWithOptions) => void;
  onReserve: (offer: OfferWithOptions) => void;
  onFollowUpChange: (offerId: string, status: FollowUpPhoneStatus) => void;
  onNoteClick: (offer: OfferWithOptions) => void;
  onViewHistory: (offerId: string, viewedAt: string | null) => void;
}

function StatusBadge({
  offer,
  onViewHistory,
}: {
  offer: OfferWithOptions;
  onViewHistory: (offerId: string, viewedAt: string | null) => void;
}) {
  const { t } = useTranslation();

  if (offer.status === 'viewed' && offer.viewed_at) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewHistory(offer.id, offer.viewed_at ?? null);
        }}
        className="inline-flex"
      >
        <Badge
          className={cn('text-xs cursor-pointer hover:opacity-80', statusColors[offer.status])}
        >
          <Eye className="w-3 h-3 mr-1" />
          {t('offers.viewedAt', { date: formatViewedDate(offer.viewed_at) })}
        </Badge>
      </button>
    );
  }

  return (
    <Badge className={cn('text-xs', statusColors[offer.status])}>
      {t(
        `offers.status${offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}`,
        offer.status,
      )}
    </Badge>
  );
}

function ApprovedPrice({ offer }: { offer: OfferWithOptions }) {
  if (!offer.admin_approved_gross && !offer.approved_at) return null;
  return (
    <span className="text-sm font-medium ml-2">
      {formatPrice(offer.admin_approved_gross ?? offer.total_gross)}
    </span>
  );
}

function CustomerLine({ offer }: { offer: OfferWithOptions }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-baseline gap-1 font-semibold text-base leading-tight">
      <span className="truncate">
        {offer.customer_data?.name || offer.customer_data?.company || t('offers.noCustomer')}
      </span>
      {offer.vehicle_data?.brandModel && (
        <>
          <span className="text-muted-foreground font-normal">·</span>
          <span className="text-muted-foreground font-normal truncate">
            {offer.vehicle_data.brandModel}
          </span>
        </>
      )}
    </div>
  );
}

function MetaLine({ offer }: { offer: OfferWithOptions }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
      <span>{offer.offer_number}</span>
      <span>·</span>
      <span>
        {t('offers.createdOn', {
          date: format(new Date(offer.created_at), 'dd.MM.yyyy', { locale: pl }),
        })}
      </span>
      {offer.source === 'website' && (
        <>
          <span>·</span>
          <span className="text-blue-600">WWW</span>
        </>
      )}
    </div>
  );
}

function ScopePills({ offer }: { offer: OfferWithOptions }) {
  const { t } = useTranslation();
  if (!offer.offer_scopes || offer.offer_scopes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {offer.offer_scopes.map((scope) => {
        const matchingOption = offer.offer_options?.find(
          (opt) => opt.scope_id === scope.id && !opt.is_upsell,
        );
        const scopePrice = matchingOption?.subtotal_net;
        return (
          <Badge
            key={scope.id}
            variant="secondary"
            className="text-xs bg-muted/20 text-foreground font-normal"
          >
            {scope.name}
            {scopePrice != null && scopePrice > 0 ? `: ${Math.round(scopePrice)} zł` : ''}
          </Badge>
        );
      })}
      {(offer.approved_at || offer.status === 'accepted' || offer.status === 'completed') &&
        offer.selectedOptionName && (
          <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
            {offer.selectedOptionName}
          </Badge>
        )}
    </div>
  );
}

function ActionsDropdown(
  props: Omit<
    OfferListCardProps,
    'onEdit' | 'onFollowUpChange' | 'onNoteClick' | 'onViewHistory'
  > & {
    buttonClassName?: string;
  },
) {
  const { offer, buttonClassName, ...menuProps } = props;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', buttonClassName)}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <OfferActionsMenu offer={offer} {...menuProps} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OfferListCard({
  offer,
  onEdit,
  onPreview,
  onCopyLink,
  onSendEmail,
  onChangeStatus,
  onOpenApproval,
  onComplete,
  onReminders,
  onDelete,
  onReserve,
  onFollowUpChange,
  onNoteClick,
  onViewHistory,
}: OfferListCardProps) {
  const menuProps = {
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
  };

  return (
    <div
      className="glass-card p-4 hover:border-primary/30 transition-colors cursor-pointer relative"
      onClick={() => onEdit(offer.id)}
    >
      {/* MOBILE LAYOUT */}
      <div className="md:hidden">
        <div className="absolute top-3 right-3">
          <ActionsDropdown {...menuProps} />
        </div>

        <div className="pr-10">
          <CustomerLine offer={offer} />
        </div>

        <div className="mt-2">
          <StatusBadge offer={offer} onViewHistory={onViewHistory} />
          <ApprovedPrice offer={offer} />
        </div>

        <MetaLine offer={offer} />
        <ScopePills offer={offer} />

        {offer.customer_data?.phone && (
          <div className="mt-3">
            <OfferFollowUpStatus
              offerId={offer.id}
              currentStatus={offer.follow_up_phone_status ?? null}
              onStatusChange={onFollowUpChange}
              hasInternalNote={!!offer.internal_notes}
              onNoteClick={() => onNoteClick(offer)}
            />
          </div>
        )}
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:block">
        <div className="flex items-start justify-between gap-3 w-full">
          <div className="min-w-0 flex-1">
            <CustomerLine offer={offer} />
            <MetaLine offer={offer} />
            <ScopePills offer={offer} />

            {offer.customer_data?.phone && (
              <div className="mt-3">
                <OfferFollowUpStatus
                  offerId={offer.id}
                  currentStatus={offer.follow_up_phone_status ?? null}
                  onStatusChange={onFollowUpChange}
                  hasInternalNote={!!offer.internal_notes}
                  onNoteClick={() => onNoteClick(offer)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge offer={offer} onViewHistory={onViewHistory} />
            {(offer.admin_approved_gross || offer.approved_at) && (
              <span className="text-sm font-medium ml-1">
                {formatPrice(offer.admin_approved_gross ?? offer.total_gross)}
              </span>
            )}
            <ActionsDropdown {...menuProps} buttonClassName="-mr-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
