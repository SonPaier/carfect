import { GripVertical, Trash2, Plus } from 'lucide-react';
import { Button, Switch, Textarea } from '@shared/ui';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ConsentClauseDef } from '../types';

interface ConsentClausesSectionProps {
  clauses: ConsentClauseDef[];
  onChange: (clauses: ConsentClauseDef[]) => void;
}

function SortableClauseCard({
  clause,
  onUpdate,
  onDelete,
}: {
  clause: ConsentClauseDef;
  onUpdate: (patch: Partial<ConsentClauseDef>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clause.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 space-y-3 bg-card${isDragging ? ' opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-2"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <Textarea
          className="flex-1"
          placeholder="Treść zgody..."
          value={clause.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Usuń zgodę"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 pl-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch
            checked={clause.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
          Wymagane
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch
            checked={clause.requiresSignature}
            onCheckedChange={(checked) => onUpdate({ requiresSignature: checked })}
          />
          Wymaga podpisu
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch
            checked={clause.visibleToCustomer}
            onCheckedChange={(checked) => onUpdate({ visibleToCustomer: checked })}
          />
          Widoczne dla klienta
        </label>
      </div>
    </div>
  );
}

export function ConsentClausesSection({ clauses, onChange }: ConsentClausesSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function updateClause(id: string, patch: Partial<ConsentClauseDef>) {
    onChange(clauses.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function deleteClause(id: string) {
    onChange(clauses.filter((c) => c.id !== id));
  }

  function addClause() {
    const newClause: ConsentClauseDef = {
      id: crypto.randomUUID(),
      text: '',
      required: false,
      requiresSignature: false,
      visibleToCustomer: true,
      order: clauses.length > 0 ? Math.max(...clauses.map((c) => c.order)) + 1 : 0,
    };
    onChange([...clauses, newClause]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = clauses.map((c) => c.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const reordered = arrayMove(clauses, oldIndex, newIndex).map((c, i) => ({
      ...c,
      order: i,
    }));
    onChange(reordered);
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={clauses.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {clauses.map((clause) => (
            <SortableClauseCard
              key={clause.id}
              clause={clause}
              onUpdate={(patch) => updateClause(clause.id, patch)}
              onDelete={() => deleteClause(clause.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" size="sm" onClick={addClause}>
        <Plus className="w-4 h-4" />
        Dodaj zgodę
      </Button>
    </div>
  );
}
