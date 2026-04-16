import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch, cn } from '@shared/ui';
import { ProtocolConfig, SectionId } from '../types';

interface SectionOrderTabProps {
  config: ProtocolConfig;
  onChange: (config: ProtocolConfig) => void;
}

const SECTION_LABELS: Record<SectionId, string> = {
  header: 'Nagłówek',
  customerInfo: 'Dane klienta',
  vehicleInfo: 'Dane pojazdu',
  vehicleDiagram: 'Diagram uszkodzeń',
  fuelOdometer: 'Poziom paliwa i przebieg',
  valuableItems: 'Przedmioty wartościowe',
  customFields: 'Pola własne',
  serviceItems: 'Usługi',
  consentClauses: 'Zgody',
  customerSignature: 'Podpis klienta',
  releaseSection: 'Sekcja wydania',
};

const PINNED_TOP: SectionId[] = ['header'];
const PINNED_BOTTOM: SectionId[] = ['customerSignature', 'releaseSection'];
const PINNED_SET = new Set<SectionId>([...PINNED_TOP, ...PINNED_BOTTOM]);

/** Returns the enabled state for a given section based on config. */
export function getSectionEnabled(config: ProtocolConfig, sectionId: SectionId): boolean {
  switch (sectionId) {
    case 'fuelOdometer':
      return config.builtInFields.fuelLevel.enabled;
    case 'valuableItems':
      return config.builtInFields.valuableItemsClause.enabled;
    case 'serviceItems':
      return config.builtInFields.serviceItems.enabled;
    case 'customFields':
    case 'consentClauses':
    default:
      return true;
  }
}

/** Toggles the enabled state for a given section and returns the updated config. */
export function toggleSectionEnabled(config: ProtocolConfig, sectionId: SectionId): ProtocolConfig {
  switch (sectionId) {
    case 'fuelOdometer':
      return {
        ...config,
        builtInFields: {
          ...config.builtInFields,
          fuelLevel: { ...config.builtInFields.fuelLevel, enabled: !config.builtInFields.fuelLevel.enabled },
        },
      };
    case 'valuableItems':
      return {
        ...config,
        builtInFields: {
          ...config.builtInFields,
          valuableItemsClause: { ...config.builtInFields.valuableItemsClause, enabled: !config.builtInFields.valuableItemsClause.enabled },
        },
      };
    case 'serviceItems':
      return {
        ...config,
        builtInFields: {
          ...config.builtInFields,
          serviceItems: { ...config.builtInFields.serviceItems, enabled: !config.builtInFields.serviceItems.enabled },
        },
      };
    default:
      return config;
  }
}

/** Determines if a section has a toggle control. */
function hasSectionToggle(sectionId: SectionId): boolean {
  return ['fuelOdometer', 'valuableItems', 'serviceItems'].includes(sectionId);
}

interface PinnedCardProps {
  id: SectionId;
}

function PinnedCard({ id }: PinnedCardProps) {
  return (
    <div
      data-testid={`pinned-card-${id}`}
      className="flex items-center gap-3 p-3 border rounded-lg bg-card opacity-60"
    >
      <div className="w-5 h-5" aria-hidden="true" />
      <span className="flex-1 text-sm font-medium text-muted-foreground">{SECTION_LABELS[id]}</span>
    </div>
  );
}

interface SortableSectionCardProps {
  id: SectionId;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

function SortableSectionCard({ id, label, enabled, onToggle }: SortableSectionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const showToggle = hasSectionToggle(id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`sortable-card-${id}`}
      className={cn('flex items-center gap-3 p-3 border rounded-lg bg-card', isDragging && 'opacity-50 shadow-lg z-50')}
    >
      <button
        type="button"
        data-testid={`drag-handle-${id}`}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label={`Przeciągnij sekcję ${label}`}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {showToggle && (
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label={`Włącz/wyłącz sekcję ${label}`}
        />
      )}
    </div>
  );
}

export function SectionOrderTab({ config, onChange }: SectionOrderTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const draggableIds = config.sectionOrder.filter((id) => !PINNED_SET.has(id));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = draggableIds.indexOf(active.id as SectionId);
    const newIndex = draggableIds.indexOf(over.id as SectionId);
    const reorderedDraggable = arrayMove(draggableIds, oldIndex, newIndex);

    const newSectionOrder: SectionId[] = [
      ...PINNED_TOP,
      ...reorderedDraggable,
      ...PINNED_BOTTOM,
    ];

    onChange({ ...config, sectionOrder: newSectionOrder });
  }

  function handleToggle(sectionId: SectionId) {
    onChange(toggleSectionEnabled(config, sectionId));
  }

  return (
    <div className="space-y-2">
      {PINNED_TOP.map((id) => (
        <PinnedCard key={id} id={id} />
      ))}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={draggableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {draggableIds.map((id) => (
              <SortableSectionCard
                key={id}
                id={id}
                label={SECTION_LABELS[id]}
                enabled={getSectionEnabled(config, id)}
                onToggle={() => handleToggle(id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {PINNED_BOTTOM.map((id) => (
        <PinnedCard key={id} id={id} />
      ))}
    </div>
  );
}
