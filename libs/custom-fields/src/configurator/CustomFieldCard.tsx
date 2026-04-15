import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@shared/ui';
import type { CustomFieldDefinition, CustomFieldType } from '../types';

interface CustomFieldCardProps {
  definition: CustomFieldDefinition;
  onUpdate: (patch: Partial<CustomFieldDefinition>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'text', label: 'Tekst' },
  { value: 'number', label: 'Liczba' },
  { value: 'textarea', label: 'Notatka' },
];

export function CustomFieldCard({
  definition,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: CustomFieldCardProps) {
  const [localLabel, setLocalLabel] = useState(definition.label);

  return (
    <Card className="p-4">
      <CardContent className="p-0 flex flex-col gap-3">
        {/* Header row: type selector + move/delete buttons */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={definition.field_type}
              onValueChange={(value) => onUpdate({ field_type: value as CustomFieldType })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="Przesuń w górę"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="Przesuń w dół"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label="Usuń pole"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Label input */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Etykieta</Label>
          <Input
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={() => {
              if (localLabel !== definition.label) onUpdate({ label: localLabel });
            }}
            placeholder="Nazwa pola"
          />
        </div>

        {/* Toggle row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id={`required-${definition.id}`}
              checked={definition.required}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
            <Label htmlFor={`required-${definition.id}`} className="text-sm cursor-pointer">
              Wymagane
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id={`visible-${definition.id}`}
              checked={definition.config.visibleToCustomer ?? true}
              onCheckedChange={(checked) =>
                onUpdate({ config: { ...definition.config, visibleToCustomer: checked } })
              }
            />
            <Label htmlFor={`visible-${definition.id}`} className="text-sm cursor-pointer">
              Widoczne dla klienta
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
