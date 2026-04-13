import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { Badge } from '@shared/ui';

/**
 * Extracts HH:MM from a time string (e.g. "09:30:00" → "09:30").
 */
export function formatTime(time: string): string {
  return time?.substring(0, 5) || '';
}

/**
 * Returns a Badge element representing the reservation status.
 */
export function getStatusBadge(status: string, t: TFunction): ReactNode {
  switch (status) {
    case 'confirmed':
      return (
        <Badge className="bg-success/20 text-success border-success/30">
          {t('reservations.statuses.confirmed')}
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30">
          {t('reservations.statuses.pending')}
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge className="bg-primary/20 text-primary border-primary/30">
          {t('reservations.statuses.inProgress')}
        </Badge>
      );
    case 'completed':
      return (
        <Badge className="bg-muted text-muted-foreground">
          {t('reservations.statuses.completed')}
        </Badge>
      );
    case 'released':
      return (
        <Badge className="bg-muted text-muted-foreground">
          {t('reservations.statuses.released')}
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30">
          {t('reservations.statuses.cancelled')}
        </Badge>
      );
    case 'no_show':
      return (
        <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">
          {t('reservations.statuses.noShow')}
        </Badge>
      );
    case 'change_requested':
      return (
        <Badge className="bg-orange-200 text-orange-800 border-orange-400">
          {t('reservations.statuses.changeRequested')}
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

/**
 * Returns a Badge element representing the reservation source.
 */
export function getSourceLabel(
  source: string | undefined | null,
  createdByUsername: string | null | undefined,
  t: TFunction,
): ReactNode {
  if (!source || source === 'admin') {
    const displayName = createdByUsername || t('reservations.sources.employee');
    return (
      <Badge variant="outline" className="text-xs font-normal">
        {t('reservations.addedBy')}: {displayName}
      </Badge>
    );
  }
  if (source === 'customer' || source === 'calendar' || source === 'online') {
    return (
      <Badge
        variant="outline"
        className="text-xs font-normal border-muted-foreground/30 text-muted-foreground"
      >
        {t('reservations.addedBy')}: {t('reservations.sources.system')}
      </Badge>
    );
  }
  if (source === 'booksy') {
    return (
      <Badge variant="outline" className="text-xs font-normal border-purple-500/30 text-purple-600">
        {t('reservations.addedBy')}: {t('reservations.sources.booksy')}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs font-normal">
      {t('reservations.addedBy')}: {source}
    </Badge>
  );
}
