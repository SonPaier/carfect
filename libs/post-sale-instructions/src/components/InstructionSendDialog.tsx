import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@shared/ui';
import { Copy, ExternalLink, Mail, Send, X } from 'lucide-react';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import { useInstructions } from '../hooks/useInstructions';
import { useCreateInstruction } from '../hooks/useCreateInstruction';
import {
  useSendInstruction,
  buildInstructionPublicUrl,
} from '../hooks/useSendInstruction';
import { useInstructionSends } from '../hooks/useInstructionSends';
import type { InstructionListItem, InstructionSendRow } from '../types';

interface InstructionSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  customerId: string | null;
  customerEmail: string | null;
  instanceId: string;
  instanceSlug: string;
  supabase: SupabaseClient<Database>;
}

export function InstructionSendDialog({
  open,
  onOpenChange,
  reservationId,
  customerId,
  customerEmail,
  instanceId,
  instanceSlug,
  supabase,
}: InstructionSendDialogProps) {
  const { t } = useTranslation();
  const { data: items = [] } = useInstructions(instanceId, supabase);
  const { data: sends = [] } = useInstructionSends(reservationId, supabase);
  const sendMutation = useSendInstruction(supabase);
  const createMutation = useCreateInstruction(supabase);

  const [selected, setSelected] = useState<InstructionListItem | null>(null);
  const [sentRow, setSentRow] = useState<InstructionSendRow | null>(null);
  const [emailAddress, setEmailAddress] = useState(customerEmail ?? '');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // For builtins, surface a previous send only if there is already a custom row
  // with the same hardcoded_key (which is the row a real send would point to).
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

  const handleSelect = (item: InstructionListItem) => {
    setSelected(item);
    setSentRow(null);
  };

  const handleSend = async () => {
    if (!selected) return;
    try {
      // Promote a builtin to a real DB row before sending — sends.instruction_id
      // is a FK to post_sale_instructions and builtins live only in code.
      let instructionId: string;
      if (selected.kind === 'builtin') {
        const existing = items.find(
          (i) => i.kind === 'custom' && i.row.hardcoded_key === selected.template.key,
        );
        if (existing && existing.kind === 'custom') {
          instructionId = existing.row.id;
        } else {
          const created = await createMutation.mutateAsync({
            instanceId,
            title: selected.template.titlePl,
            content: selected.template.getContent(),
            hardcodedKey: selected.template.key,
          });
          instructionId = created.id;
        }
      } else {
        instructionId = selected.row.id;
      }
      const row = await sendMutation.mutateAsync({
        instructionId,
        reservationId,
        customerId,
        instanceId,
      });
      setSentRow(row);
      toast.success(t('instructions.sendCreated'));
    } catch (error: unknown) {
      toast.error((error as Error).message || t('instructions.sendError'));
    }
  };

  const publicUrl = sentRow
    ? buildInstructionPublicUrl(instanceSlug, sentRow.public_token)
    : null;

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    toast.success(t('instructions.linkCopied'));
  };

  const handleSendEmail = async () => {
    if (!sentRow) return;
    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-instruction-email', {
        body: { sendId: sentRow.id, customEmailBody: emailBody, toEmail: emailAddress },
      });
      if (error) throw error;
      toast.success(t('instructions.sendEmailSent'));
    } catch (error: unknown) {
      toast.error((error as Error).message || t('instructions.sendEmailError'));
    } finally {
      setIsSendingEmail(false);
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
              {items.map((item) => {
                const title = item.kind === 'builtin' ? item.template.titlePl : item.row.title;
                const key = item.kind === 'builtin' ? `builtin-${item.template.key}` : item.row.id;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelect(item)}
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

          {previousSend && !sentRow && (
            <Alert>
              <AlertDescription>
                {t('instructions.alreadySentAt', {
                  date: format(new Date(previousSend.sent_at), 'dd.MM.yyyy HH:mm'),
                })}
              </AlertDescription>
            </Alert>
          )}

          {selected && !sentRow && (
            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || createMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {t('instructions.generateLink')}
              </Button>
            </div>
          )}

          {sentRow && publicUrl && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{t('instructions.publicLink')}</Label>
                <div className="flex items-center gap-2">
                  <Input value={publicUrl} readOnly />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="email">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {t('instructions.sendEmailToggle')}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="instruction-email-to">
                        {t('instructions.emailToLabel')}
                      </Label>
                      <Input
                        id="instruction-email-to"
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instruction-email-body">
                        {t('instructions.emailBodyLabel')}
                      </Label>
                      <Textarea
                        id="instruction-email-body"
                        rows={4}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder={t('instructions.emailBodyPlaceholder')}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSendEmail} disabled={isSendingEmail || !emailAddress}>
                        {isSendingEmail
                          ? t('instructions.sendingEmail')
                          : t('instructions.sendEmail')}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
