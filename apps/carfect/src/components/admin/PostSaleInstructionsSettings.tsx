import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  InstructionList,
  InstructionEditor,
  InstructionPreviewDialog,
  InstructionEmailDialog,
  buildInstructionPublicUrl,
  previewInstructionPdf,
  type HardcodedKey,
  type InstructionListItem,
  type PostSaleInstructionRow,
  type TiptapDocument,
} from '@shared/post-sale-instructions';

interface PostSaleInstructionsSettingsProps {
  instanceId: string;
}

type Mode =
  | { kind: 'list' }
  | { kind: 'new' }
  | { kind: 'edit'; id: string }
  | { kind: 'duplicate'; key: HardcodedKey };

interface InstanceRow {
  slug: string | null;
  name: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  contact_person: string | null;
}

export default function PostSaleInstructionsSettings({
  instanceId,
}: PostSaleInstructionsSettingsProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [previewItem, setPreviewItem] = useState<InstructionListItem | null>(null);
  const [emailItem, setEmailItem] = useState<InstructionListItem | null>(null);

  const editingId = mode.kind === 'edit' ? mode.id : null;
  const { data: editingRow } = useQuery<PostSaleInstructionRow | null>({
    queryKey: ['post-sale-instruction', editingId],
    enabled: editingId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_sale_instructions')
        .select('*')
        .eq('id', editingId!)
        .single();
      if (error) throw error;
      return data as PostSaleInstructionRow;
    },
  });

  // Single fetch — selects both the slug (used to build public URLs) and the
  // preview-info fields (used by the preview dialog) in one round-trip.
  const { data: instanceRow } = useQuery<InstanceRow | null>({
    queryKey: ['instance-preview-info', instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instances')
        .select('slug, name, logo_url, phone, email, address, website, contact_person')
        .eq('id', instanceId)
        .single();
      if (error) throw error;
      return data as InstanceRow;
    },
    staleTime: 5 * 60 * 1000,
  });

  const previewInstance = {
    name: instanceRow?.name ?? '',
    logo_url: instanceRow?.logo_url ?? '',
    phone: instanceRow?.phone ?? '',
    email: instanceRow?.email ?? '',
    address: instanceRow?.address ?? '',
    website: instanceRow?.website ?? '',
    contact_person: instanceRow?.contact_person ?? '',
  };

  const instanceSlug = instanceRow?.slug ?? null;

  const handleCopyLink = async (item: InstructionListItem) => {
    if (!instanceSlug) {
      toast.error(t('publicInstruction.loadError'));
      return;
    }
    if (item.kind === 'builtin') {
      toast.error(t('instructions.copyLinkBuiltinHint'));
      return;
    }
    const url = buildInstructionPublicUrl(instanceSlug, item.row.slug);
    await navigator.clipboard.writeText(url);
    toast.success(t('instructions.linkCopied'));
  };

  const handleDownloadPdf = async (item: InstructionListItem) => {
    const title = item.kind === 'builtin' ? item.template.titlePl : item.row.title;
    const content: TiptapDocument =
      item.kind === 'builtin' ? item.template.getContent() : (item.row.content as TiptapDocument);
    try {
      await previewInstructionPdf({ title, content, instance: previewInstance });
    } catch {
      toast.error(t('publicInstruction.loadError'));
    }
  };

  const renderBody = () => {
    if (mode.kind === 'list') {
      return (
        <InstructionList
          instanceId={instanceId}
          supabase={supabase}
          onEdit={(id) => setMode(id === null ? { kind: 'new' } : { kind: 'edit', id })}
          onDuplicateBuiltin={(key) => setMode({ kind: 'duplicate', key })}
          onPreview={(item) => setPreviewItem(item)}
          onDownloadPdf={handleDownloadPdf}
          onCopyLink={handleCopyLink}
          onSendByEmail={(item) => {
            if (item.kind === 'builtin') {
              toast.error(t('instructions.copyLinkBuiltinHint'));
              return;
            }
            setEmailItem(item);
          }}
        />
      );
    }

    if (mode.kind === 'edit' && !editingRow) {
      return null;
    }

    const editorMode =
      mode.kind === 'new'
        ? ({ kind: 'new' } as const)
        : mode.kind === 'duplicate'
          ? ({ kind: 'duplicate', key: mode.key } as const)
          : ({ kind: 'edit', row: editingRow! } as const);

    return (
      <InstructionEditor
        instanceId={instanceId}
        supabase={supabase}
        mode={editorMode}
        onClose={() => setMode({ kind: 'list' })}
        onSaved={() => setMode({ kind: 'list' })}
      />
    );
  };

  return (
    <>
      {renderBody()}
      <InstructionPreviewDialog
        open={previewItem !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null);
        }}
        item={previewItem}
        instance={previewInstance}
      />
      <InstructionEmailDialog
        open={emailItem !== null}
        onOpenChange={(open) => {
          if (!open) setEmailItem(null);
        }}
        item={emailItem}
        supabase={supabase}
      />
    </>
  );
}
