import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import { Copy, Download, Eye, Mail, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import { useInstructions } from '../hooks/useInstructions';
import { useDeleteInstruction } from '../hooks/useDeleteInstruction';
import type { HardcodedKey, InstructionListItem } from '../types';

interface InstructionListProps {
  instanceId: string;
  supabase: SupabaseClient<Database>;
  onEdit: (id: string | null) => void;
  onDuplicateBuiltin: (key: HardcodedKey) => void;
  onPreview?: (item: InstructionListItem) => void;
  onDownloadPdf?: (item: InstructionListItem) => void;
  onCopyLink?: (item: InstructionListItem) => void;
  onSendByEmail?: (item: InstructionListItem) => void;
}

export function InstructionList({
  instanceId,
  supabase,
  onEdit,
  onDuplicateBuiltin,
  onPreview,
  onDownloadPdf,
  onCopyLink,
  onSendByEmail,
}: InstructionListProps) {
  const { t } = useTranslation();
  const { data: items = [], isLoading } = useInstructions(instanceId, supabase);
  const deleteMutation = useDeleteInstruction(supabase);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Hide builtins that already have a custom row with the same hardcoded_key —
  // once the user has customized a builtin, the read-only template stops being
  // a useful entry in the list.
  const visibleItems = useMemo(() => {
    const customKeys = new Set(
      items
        .filter((i): i is Extract<InstructionListItem, { kind: 'custom' }> => i.kind === 'custom')
        .map((i) => i.row.hardcoded_key)
        .filter((k): k is HardcodedKey => k !== null && k !== undefined),
    );
    return items.filter((item) => item.kind !== 'builtin' || !customKeys.has(item.template.key));
  }, [items]);

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: pendingDeleteId, instanceId });
      toast.success(t('instructions.deletedToast'));
      setPendingDeleteId(null);
    } catch (error: unknown) {
      const message = (error as Error).message;
      if (message === 'INSTRUCTION_RESTRICT_FK') {
        toast.error(t('instructions.deleteRestrictError'));
      } else {
        toast.error(t('instructions.deleteError'));
      }
      setPendingDeleteId(null);
    }
  };

  const handleEdit = (item: InstructionListItem) => {
    if (item.kind === 'builtin') {
      onDuplicateBuiltin(item.template.key);
    } else {
      onEdit(item.row.id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{t('instructions.pageTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('instructions.pageDescription')}</p>
        </div>
        <Button onClick={() => onEdit(null)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('instructions.newButton')}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <div className="space-y-2">
          {visibleItems.map((item) => {
            const title = item.kind === 'builtin' ? item.template.titlePl : item.row.title;
            const key = item.kind === 'builtin' ? `builtin-${item.template.key}` : item.row.id;
            return (
              <Card key={key}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <span className="font-medium truncate">{title}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={t('instructions.actions')}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        {t('instructions.edit')}
                      </DropdownMenuItem>
                      {onPreview && (
                        <DropdownMenuItem onClick={() => onPreview(item)}>
                          <Eye className="w-4 h-4 mr-2" />
                          {t('instructions.preview')}
                        </DropdownMenuItem>
                      )}
                      {onDownloadPdf && (
                        <DropdownMenuItem onClick={() => onDownloadPdf(item)}>
                          <Download className="w-4 h-4 mr-2" />
                          {t('publicInstruction.downloadPdf')}
                        </DropdownMenuItem>
                      )}
                      {onCopyLink && (
                        <DropdownMenuItem onClick={() => onCopyLink(item)}>
                          <Copy className="w-4 h-4 mr-2" />
                          {t('instructions.copyPublicLink')}
                        </DropdownMenuItem>
                      )}
                      {onSendByEmail && (
                        <DropdownMenuItem onClick={() => onSendByEmail(item)}>
                          <Mail className="w-4 h-4 mr-2" />
                          {t('instructions.sendByEmail')}
                        </DropdownMenuItem>
                      )}
                      {item.kind === 'custom' && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setPendingDeleteId(item.row.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('instructions.delete')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('instructions.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('instructions.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {t('instructions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
