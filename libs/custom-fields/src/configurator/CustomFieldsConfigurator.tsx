import { Loader2, Plus } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button, EmptyState } from '@shared/ui';
import { useCustomFields } from '../useCustomFields';
import type { CustomFieldDefinition } from '../types';
import { CustomFieldCard } from './CustomFieldCard';

interface CustomFieldsConfiguratorProps {
  instanceId: string;
  context: string;
  supabase: SupabaseClient;
}

export function CustomFieldsConfigurator({
  instanceId,
  context,
  supabase,
}: CustomFieldsConfiguratorProps) {
  const { definitions, isLoading, addField, updateField, removeField, reorderFields } =
    useCustomFields(instanceId, context, supabase);

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const reordered = [...definitions];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    reorderFields(reordered.map((d) => d.id));
  }

  function handleMoveDown(index: number) {
    if (index === definitions.length - 1) return;
    const reordered = [...definitions];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    reorderFields(reordered.map((d) => d.id));
  }

  function handleAdd() {
    addField({
      field_type: 'text',
      label: 'Nowe pole',
      required: false,
      sort_order: definitions.length,
      config: {},
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {definitions.length === 0 ? (
        <EmptyState title="Brak pól własnych" />
      ) : (
        definitions.map((definition, index) => (
          <CustomFieldCard
            key={definition.id}
            definition={definition}
            onUpdate={(patch) => updateField(definition.id, patch)}
            onRemove={() => removeField(definition.id)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            isFirst={index === 0}
            isLast={index === definitions.length - 1}
          />
        ))
      )}

      <Button type="button" variant="outline" onClick={handleAdd} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Dodaj pole
      </Button>
    </div>
  );
}
