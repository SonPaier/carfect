import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@shared/ui';
import { Send, X } from 'lucide-react';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import { useInstructions } from '../hooks/useInstructions';
import { useCreateInstruction } from '../hooks/useCreateInstruction';
import { useSendInstruction } from '../hooks/useSendInstruction';
import { useInstructionSends } from '../hooks/useInstructionSends';
import { filterVisibleItems, type InstructionListItem } from '../types';

interface InstructionSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  customerId: string | null;
  customerEmail: string | null;
  instanceId: string;
  supabase: SupabaseClient<Database>;
}

export function InstructionSendDialog({
  open,
  onOpenChange,
  reservationId,
  customerId,
  customerEmail,
  instanceId,
  supabase,
}: InstructionSendDialogProps) {
  const { t } = useTranslation();
  const { data: items = [] } = useInstructions(instanceId, supabase);
  const { data: sends = [] } = useInstructionSends(reservationId, supabase);
  const sendMutation = useSendInstruction(supabase);
  const createMutation = useCreateInstruction(supabase);

  const [selected, setSelected] = useState<InstructionListItem | null>(null);
  const [emailAddress, setEmailAddress] = useState(customerEmail ?? '');
  const [invokingEmail, setInvokingEmail] = useState(false);
  const isSending = createMutation.isPending || sendMutation.isPending || invokingEmail;

  const visibleItems = useMemo(() => filterVisibleItems(items), [items]);

  const previousSend = useMemo(() => {
    if (!selected) return null;
    if (selected.kind === 'custom') {
      return sends.find((s) => s.instruction_id === selected.row.id) ?? null;
    }
    const promotedRow = items.find(
      (i) => i.kind === 'custom' && i.row.hardcoded_key === selected.template.key,
    );
    if (promotedRow && promotedRow.kind === 'custom') {
      return sends.find((s) => s.instruction_id === promotedRow.row.id) ?? null;
    }
    return null;
  }, [selected, sends, items]);

  // Send: insert send row + invoke email function in one shot. No "Generate
  // link" intermediate step — the customer-facing URL is implicit (slug-based,
  // resolved by the public route).
  const handleSend = async () => {
    if (!selected || !emailAddress || isSending) return;
    try {
      let instructionId: string;
      if (selected.kind === 'builtin') {
        const existing = items.find(
          (i) => i.kind === 'custom' && i.row.hardcoded_key === selected.template.key,
        );
        instructionId =
          existing && existing.kind === 'custom'
            ? existing.row.id
            : (
                await createMutation.mutateAsync({
                  instanceId,
                  title: selected.template.titlePl,
                  content: selected.template.getContent(),
                  hardcodedKey: selected.template.key,
                })
              ).id;
      } else {
        instructionId = selected.row.id;
      }
      const sentRow = await sendMutation.mutateAsync({
        instructionId,
        reservationId,
        customerId,
        instanceId,
      });
      setInvokingEmail(true);
      const { error } = await supabase.functions.invoke('send-instruction-email', {
        body: { sendId: sentRow.id, toEmail: emailAddress },
      });
      if (error) throw error;
      toast.success(t('instructions.sendEmailSent'));
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error((error as Error).message || t('instructions.sendEmailError'));
    } finally {
      setInvokingEmail(false);
    }
  };

  const isSelected = (item: InstructionListItem) => {
    if (!selected) return false;
    if (item.kind === 'builtin' && selected.kind === 'builtin') {
      return item.template.key === selected.template.key;
    }
    if (item.kind === 'custom' && selected.kind === 'custom') {
      return item.row.id === selected.row.id;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="[&>button]:hidden max-w-2xl">
        <div className="absolute top-3 right-3 z-50">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <DialogHeader>
          <DialogTitle>{t('instructions.sendDialogTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('instructions.pickTemplate')}</Label>
            <div className="space-y-1 max-h-64 overflow-auto">
              {visibleItems.map((item) => {
                const title = item.kind === 'builtin' ? item.template.titlePl : item.row.title;
                const key = item.kind === 'builtin' ? `builtin-${item.template.key}` : item.row.id;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`w-full text-left p-2 rounded border ${
                      isSelected(item) ? 'border-primary' : 'border-border'
                    } hover:bg-hover`}
                  >
                    <span className="truncate">{title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {previousSend && (
            <Alert>
              <AlertDescription>
                {t('instructions.alreadySentAt', {
                  date: format(new Date(previousSend.sent_at), 'dd.MM.yyyy HH:mm'),
                })}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="instruction-email-to">{t('instructions.emailToLabel')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="instruction-email-to"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="email@example.com"
              />
              <Button onClick={handleSend} disabled={!selected || !emailAddress || isSending}>
                <Send className="w-4 h-4 mr-2" />
                {isSending ? t('instructions.sendingEmail') : t('instructions.sendEmail')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
