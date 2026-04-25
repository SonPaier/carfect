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
  Badge,
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
import {
  useSendInstruction,
  buildInstructionPublicUrl,
} from '../hooks/useSendInstruction';
import { useInstructionSends } from '../hooks/useInstructionSends';
import type { HardcodedKey, InstructionSendRow } from '../types';

interface InstructionSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  customerId: string | null;
  customerEmail: string | null;
  instanceId: string;
  instanceSlug: string;
  supabase: SupabaseClient<Database>;
  onRequestDuplicate: (key: HardcodedKey) => void;
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
  onRequestDuplicate,
}: InstructionSendDialogProps) {
  const { t } = useTranslation();
  const { data: items = [] } = useInstructions(instanceId, supabase);
  const { data: sends = [] } = useInstructionSends(reservationId, supabase);
  const sendMutation = useSendInstruction(supabase);

  const [selectedInstructionId, setSelectedInstructionId] = useState<string | null>(null);
  const [selectedBuiltinKey, setSelectedBuiltinKey] = useState<HardcodedKey | null>(null);
  const [sentRow, setSentRow] = useState<InstructionSendRow | null>(null);
  const [emailAddress, setEmailAddress] = useState(customerEmail ?? '');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const previousSend = useMemo(() => {
    if (!selectedInstructionId) return null;
    return sends.find((s) => s.instruction_id === selectedInstructionId) ?? null;
  }, [selectedInstructionId, sends]);

  const handleSelectInstruction = (id: string) => {
    setSelectedInstructionId(id);
    setSelectedBuiltinKey(null);
    setSentRow(null);
  };

  const handleSelectBuiltin = (key: HardcodedKey) => {
    setSelectedBuiltinKey(key);
    setSelectedInstructionId(null);
    setSentRow(null);
  };

  const handleSend = async () => {
    if (!selectedInstructionId) return;
    try {
      const row = await sendMutation.mutateAsync({
        instructionId: selectedInstructionId,
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
                if (item.kind === 'builtin') {
                  return (
                    <button
                      key={`builtin-${item.template.key}`}
                      type="button"
                      onClick={() => handleSelectBuiltin(item.template.key)}
                      className={`w-full text-left p-2 rounded border ${
                        selectedBuiltinKey === item.template.key
                          ? 'border-primary'
                          : 'border-border'
                      } hover:bg-hover flex items-center gap-2`}
                    >
                      <span className="flex-1 truncate">{item.template.titlePl}</span>
                      <Badge variant="secondary">{t('instructions.builtinBadge')}</Badge>
                    </button>
                  );
                }
                return (
                  <button
                    key={item.row.id}
                    type="button"
                    onClick={() => handleSelectInstruction(item.row.id)}
                    className={`w-full text-left p-2 rounded border ${
                      selectedInstructionId === item.row.id
                        ? 'border-primary'
                        : 'border-border'
                    } hover:bg-hover`}
                  >
                    <span className="truncate">{item.row.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedBuiltinKey && (
            <Alert>
              <AlertDescription className="flex items-center justify-between gap-2">
                <span>{t('instructions.builtinNeedsDuplicate')}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onRequestDuplicate(selectedBuiltinKey);
                    onOpenChange(false);
                  }}
                >
                  {t('instructions.duplicateAndEdit')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {previousSend && !sentRow && (
            <Alert>
              <AlertDescription>
                {t('instructions.alreadySentAt', {
                  date: format(new Date(previousSend.sent_at), 'dd.MM.yyyy HH:mm'),
                })}
              </AlertDescription>
            </Alert>
          )}

          {selectedInstructionId && !sentRow && (
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={sendMutation.isPending}>
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
