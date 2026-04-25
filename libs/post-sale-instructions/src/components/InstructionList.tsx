import { useState } from 'react';
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
  Badge,
  Button,
  Card,
  CardContent,
} from '@shared/ui';
import { Pencil, Plus, Trash2, Copy } from 'lucide-react';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import { useInstructions } from '../hooks/useInstructions';
import { useDeleteInstruction } from '../hooks/useDeleteInstruction';
import type { HardcodedKey } from '../types';

interface InstructionListProps {
  instanceId: string;
  supabase: SupabaseClient<Database>;
  onEdit: (id: string | null) => void;
  onDuplicateBuiltin: (key: HardcodedKey) => void;
}

export function InstructionList({
  instanceId,
  supabase,
  onEdit,
  onDuplicateBuiltin,
}: InstructionListProps) {
  const { t } = useTranslation();
  const { data: items = [], isLoading } = useInstructions(instanceId, supabase);
  const deleteMutation = useDeleteInstruction(supabase);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{t('instructions.pageTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('instructions.pageDescription')}
          </p>
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
          {items.map((item) => {
            if (item.kind === 'builtin') {
              return (
                <Card key={`builtin-${item.template.key}`}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{item.template.titlePl}</span>
                      <Badge variant="secondary">{t('instructions.builtinBadge')}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicateBuiltin(item.template.key)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {t('instructions.duplicateAndEdit')}
                    </Button>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={item.row.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <span className="font-medium truncate">{item.row.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item.row.id)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      {t('instructions.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteId(item.row.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('instructions.delete')}
                    </Button>
                  </div>
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
