import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  InstructionList,
  InstructionEditor,
  type HardcodedKey,
  type PostSaleInstructionRow,
} from '@shared/post-sale-instructions';

interface PostSaleInstructionsSettingsProps {
  instanceId: string;
}

type Mode =
  | { kind: 'list' }
  | { kind: 'new' }
  | { kind: 'edit'; id: string }
  | { kind: 'duplicate'; key: HardcodedKey };

export default function PostSaleInstructionsSettings({
  instanceId,
}: PostSaleInstructionsSettingsProps) {
  const [mode, setMode] = useState<Mode>({ kind: 'list' });

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

  if (mode.kind === 'list') {
    return (
      <InstructionList
        instanceId={instanceId}
        supabase={supabase}
        onEdit={(id) => setMode(id === null ? { kind: 'new' } : { kind: 'edit', id })}
        onDuplicateBuiltin={(key) => setMode({ kind: 'duplicate', key })}
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
}
