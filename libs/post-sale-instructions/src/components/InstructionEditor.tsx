import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button, Input, Label, RichTextEditor } from '@shared/ui';
import type { Database } from '../../../../apps/carfect/src/integrations/supabase/types';
import { useCreateInstruction } from '../hooks/useCreateInstruction';
import { useUpdateInstruction } from '../hooks/useUpdateInstruction';
import { BUILTIN_TEMPLATES } from '../builtinTemplates';
import type { HardcodedKey, PostSaleInstructionRow, TiptapDocument } from '../types';

type EditorMode =
  | { kind: 'new' }
  | { kind: 'edit'; row: PostSaleInstructionRow }
  | { kind: 'duplicate'; key: HardcodedKey };

interface InstructionEditorProps {
  instanceId: string;
  supabase: SupabaseClient<Database>;
  mode: EditorMode;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  title: string;
  content: TiptapDocument;
}

function buildDefaults(mode: EditorMode): FormValues {
  if (mode.kind === 'edit') {
    return { title: mode.row.title, content: mode.row.content as TiptapDocument };
  }
  if (mode.kind === 'duplicate') {
    const tpl = BUILTIN_TEMPLATES.find((t) => t.key === mode.key);
    if (!tpl) {
      return { title: '', content: { type: 'doc', content: [{ type: 'paragraph' }] } };
    }
    return { title: tpl.titlePl, content: tpl.getContent() };
  }
  return { title: '', content: { type: 'doc', content: [{ type: 'paragraph' }] } };
}

export function InstructionEditor({
  instanceId,
  supabase,
  mode,
  onClose,
  onSaved,
}: InstructionEditorProps) {
  const { t } = useTranslation();
  const createMutation = useCreateInstruction(supabase);
  const updateMutation = useUpdateInstruction(supabase);

  const schema = z.object({
    title: z.string().min(1, t('instructions.titleRequired')),
    content: z.custom<TiptapDocument>(
      (v): v is TiptapDocument =>
        typeof v === 'object' && v !== null && (v as TiptapDocument).type === 'doc',
    ),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(mode),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode.kind === 'edit') {
        await updateMutation.mutateAsync({
          id: mode.row.id,
          instanceId,
          title: values.title,
          content: values.content,
        });
      } else {
        await createMutation.mutateAsync({
          instanceId,
          title: values.title,
          content: values.content,
          hardcodedKey: mode.kind === 'duplicate' ? mode.key : null,
        });
      }
      toast.success(t('instructions.savedToast'));
      onSaved();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('instructions.saveError'));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const fileName = `instructions/${instanceId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('protocol-photos')
      .upload(fileName, file, { contentType: file.type, cacheControl: '3600' });
    if (error) throw error;
    const { data } = supabase.storage.from('protocol-photos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="pb-24">
      <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="instruction-title">{t('instructions.titleLabel')}</Label>
          <Input
            id="instruction-title"
            placeholder={t('instructions.titlePlaceholder')}
            {...form.register('title')}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <Controller
          name="content"
          control={form.control}
          render={({ field }) => (
            <div className="space-y-2">
              <Label>{t('instructions.contentLabel')}</Label>
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                onUploadImage={uploadImage}
                className="[&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:prose [&_.ProseMirror]:prose-sm [&_.ProseMirror]:max-w-none [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2"
              />
            </div>
          )}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-40">
        <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
