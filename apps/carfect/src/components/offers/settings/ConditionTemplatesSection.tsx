import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Textarea } from '@shared/ui';
import {
  useConditionTemplates,
  type TemplateType,
  type ConditionTemplate,
} from '@/hooks/useConditionTemplates';

const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  warranty: 'Gwarancja',
  payment_terms: 'Warunki płatności',
  service_info: 'Informacje o usłudze',
  notes: 'Uwagi',
};

const TEMPLATE_TYPES: TemplateType[] = ['warranty', 'payment_terms', 'service_info', 'notes'];

interface ConditionTemplatesSectionProps {
  instanceId: string;
}

interface EditState {
  id: string | null;
  type: TemplateType;
  name: string;
  content: string;
}

export function ConditionTemplatesSection({ instanceId }: ConditionTemplatesSectionProps) {
  const { templates, loading, byType, createTemplate, updateTemplate, deleteTemplate } =
    useConditionTemplates(instanceId);

  const [addingType, setAddingType] = useState<TemplateType | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const handleStartAdd = (type: TemplateType) => {
    setAddingType(type);
    setEditing({ id: null, type, name: '', content: '' });
  };

  const handleStartEdit = (template: ConditionTemplate) => {
    setAddingType(null);
    setEditing({
      id: template.id,
      type: template.template_type,
      name: template.name,
      content: template.content,
    });
  };

  const handleCancel = () => {
    setEditing(null);
    setAddingType(null);
  };

  const handleSave = async () => {
    if (!editing || !editing.name.trim() || !editing.content.trim()) return;

    setSaving(true);
    if (editing.id) {
      await updateTemplate(editing.id, {
        name: editing.name.trim(),
        content: editing.content.trim(),
      });
    } else {
      await createTemplate(editing.type, editing.name, editing.content);
    }
    setSaving(false);
    setEditing(null);
    setAddingType(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return;
    await deleteTemplate(id);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Ładowanie...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Twórz szablony warunków, które możesz szybko wstawiać przy tworzeniu oferty.
      </p>

      {TEMPLATE_TYPES.map((type) => {
        const items = byType(type);
        const isAddingThis = addingType === type;

        return (
          <div key={type} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-medium">{TEMPLATE_TYPE_LABELS[type]}</Label>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs h-7"
                onClick={() => handleStartAdd(type)}
                disabled={!!editing}
              >
                <Plus className="w-3 h-3" />
                Dodaj
              </Button>
            </div>

            {items.length === 0 && !isAddingThis && (
              <p className="text-xs text-muted-foreground pl-1">Brak szablonów</p>
            )}

            {items.map((template) => {
              const isEditing = editing?.id === template.id;

              if (isEditing) {
                return (
                  <TemplateForm
                    key={template.id}
                    name={editing!.name}
                    content={editing!.content}
                    onNameChange={(name) => setEditing((e) => e && { ...e, name })}
                    onContentChange={(content) => setEditing((e) => e && { ...e, content })}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    saving={saving}
                  />
                );
              }

              return (
                <TemplateItem
                  key={template.id}
                  template={template}
                  onEdit={() => handleStartEdit(template)}
                  onDelete={() => handleDelete(template.id)}
                  disabled={!!editing}
                />
              );
            })}

            {isAddingThis && editing && (
              <TemplateForm
                name={editing.name}
                content={editing.content}
                onNameChange={(name) => setEditing((e) => e && { ...e, name })}
                onContentChange={(content) => setEditing((e) => e && { ...e, content })}
                onSave={handleSave}
                onCancel={handleCancel}
                saving={saving}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TemplateItem({
  template,
  onEdit,
  onDelete,
  disabled,
}: {
  template: ConditionTemplate;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg border border-border/50 bg-white">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{template.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.content}</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0"
        onClick={onEdit}
        disabled={disabled}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
        onClick={onDelete}
        disabled={disabled}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function TemplateForm({
  name,
  content,
  onNameChange,
  onContentChange,
  onSave,
  onCancel,
  saving,
}: {
  name: string;
  content: string;
  onNameChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 space-y-2">
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Nazwa szablonu..."
        className="h-8"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      />
      <Textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Treść szablonu..."
        rows={3}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="w-3.5 h-3.5 mr-1" />
          Anuluj
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={saving || !name.trim() || !content.trim()}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5 mr-1" />
          )}
          Zapisz
        </Button>
      </div>
    </div>
  );
}
