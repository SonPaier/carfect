import { GripVertical, Trash2, Plus } from 'lucide-react';
import { Button, Input } from '@shared/ui';
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
import type { ServiceColumnDef } from '../types';

interface ServiceColumnsSectionProps {
  columns: ServiceColumnDef[];
  onChange: (cols: ServiceColumnDef[]) => void;
}

function SortableColumnCard({
  col,
  onUpdate,
  onDelete,
}: {
  col: ServiceColumnDef;
  onUpdate: (patch: Partial<ServiceColumnDef>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 bg-card${isDragging ? ' opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <Input
          className="flex-1"
          placeholder="Nazwa kolumny..."
          value={col.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          aria-label="Nazwa kolumny"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Usuń kolumnę"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function ServiceColumnsSection({ columns, onChange }: ServiceColumnsSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function updateColumn(id: string, patch: Partial<ServiceColumnDef>) {
    onChange(columns.map((col) => (col.id === id ? { ...col, ...patch } : col)));
  }

  function deleteColumn(id: string) {
    onChange(columns.filter((col) => col.id !== id));
  }

  function addColumn() {
    const newColumn: ServiceColumnDef = {
      id: crypto.randomUUID(),
      label: 'Nowa kolumna',
      order: columns.length > 0 ? Math.max(...columns.map((c) => c.order)) + 1 : 0,
    };
    onChange([...columns, newColumn]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = columns.map((c) => c.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const reordered = arrayMove(columns, oldIndex, newIndex).map((c, i) => ({
      ...c,
      order: i,
    }));
    onChange(reordered);
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={columns.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {columns.map((col) => (
            <SortableColumnCard
              key={col.id}
              col={col}
              onUpdate={(patch) => updateColumn(col.id, patch)}
              onDelete={() => deleteColumn(col.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" size="sm" onClick={addColumn}>
        <Plus className="w-4 h-4" />
        Dodaj kolumnę
      </Button>
    </div>
  );
}
