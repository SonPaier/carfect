import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label } from '@shared/ui';
import { Send, X } from 'lucide-react';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import type { InstructionListItem } from '../types';

interface InstructionEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InstructionListItem | null;
  defaultEmail?: string;
  supabase: SupabaseClient<Database>;
}

/**
 * Settings-context email dialog. No reservation in scope, no sends row —
 * the edge function resolves the instruction directly via instructionId.
 * Builtins are not supported (they don't have a DB id); the caller should
 * gate this dialog to custom rows only.
 */
export function InstructionEmailDialog({
  open,
  onOpenChange,
  item,
  defaultEmail,
  supabase,
}: InstructionEmailDialogProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open) setEmail(defaultEmail ?? '');
  }, [open, defaultEmail]);

  if (item && item.kind === 'builtin') {
    // Builtins must be promoted to custom rows before sending.
    return null;
  }

  const instructionId = item?.kind === 'custom' ? item.row.id : null;
  const title = item?.kind === 'custom' ? item.row.title : '';

  const handleSend = async () => {
    if (!instructionId || !email) return;
    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-instruction-email', {
        body: { instructionId, toEmail: email },
      });
      if (error) throw error;
      toast.success(t('instructions.sendEmailSent'));
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error((error as Error).message || t('instructions.sendEmailError'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="[&>button]:hidden max-w-md">
        <div className="absolute top-3 right-3 z-50">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close')}
            className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="instruction-email-direct-to">{t('instructions.emailToLabel')}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="instruction-email-direct-to"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleSend} disabled={!email || isSending}>
              <Send className="w-4 h-4 mr-2" />
              {isSending ? t('instructions.sendingEmail') : t('instructions.sendEmail')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
