import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ExternalLink } from 'lucide-react';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import { useInstructionSends } from '../hooks/useInstructionSends';
import { buildInstructionPublicUrl } from '../hooks/useSendInstruction';

interface InstructionSendHistoryProps {
  reservationId: string;
  instanceId: string;
  instanceSlug: string;
  supabase: SupabaseClient<Database>;
}

export function InstructionSendHistory({
  reservationId,
  instanceSlug,
  supabase,
}: InstructionSendHistoryProps) {
  const { t } = useTranslation();
  const { data: sends = [], isLoading } = useInstructionSends(reservationId, supabase);

  if (isLoading) return null;
  if (sends.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">{t('instructions.noSendsYet')}</p>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{t('instructions.historyTitle')}</h4>
      <ul className="space-y-1">
        {sends.map((send) => {
          const title = send.post_sale_instructions?.title ?? t('instructions.untitled');
          const sentAt = format(new Date(send.sent_at), 'dd.MM.yyyy HH:mm', { locale: pl });
          const viewedLabel = send.viewed_at
            ? t('instructions.viewedAt', {
                date: format(new Date(send.viewed_at), 'dd.MM.yyyy HH:mm', { locale: pl }),
              })
            : t('instructions.notViewed');
          const url = buildInstructionPublicUrl(instanceSlug, send.public_token);
          return (
            <li
              key={send.id}
              className="flex items-center justify-between gap-2 text-sm py-1"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">
                  {t('instructions.alreadySentAt', { date: sentAt })} · {viewedLabel}
                </div>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded hover:bg-hover transition-colors shrink-0"
                aria-label={t('instructions.openPublicLink')}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
