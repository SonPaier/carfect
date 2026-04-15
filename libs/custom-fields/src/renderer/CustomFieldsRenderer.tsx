import { cn, Label } from '@shared/ui';
import type { CustomFieldDefinition, CustomFieldValues } from '../types';
import { FieldByType } from './FieldByType';

interface CustomFieldsRendererProps {
  definitions: CustomFieldDefinition[];
  values: CustomFieldValues;
  onChange: (values: CustomFieldValues) => void;
  disabled?: boolean;
}

export function CustomFieldsRenderer({
  definitions,
  values,
  onChange,
  disabled,
}: CustomFieldsRendererProps) {
  if (definitions.length === 0) {
    return null;
  }

  function handleFieldChange(id: string, newValue: unknown) {
    onChange({ ...values, [id]: newValue });
  }

  return (
    <div className="flex flex-wrap gap-4">
      {definitions.map((def) => {
        const isHalf = def.config.width === 'half';
        return (
          <div
            key={def.id}
            className={cn(isHalf ? 'w-[calc(50%-0.5rem)]' : 'w-full')}
          >
            <Label className="mb-1 block">
              {def.label}
              {def.required && ' *'}
            </Label>
            <FieldByType
              definition={def}
              value={values[def.id]}
              onChange={(val) => handleFieldChange(def.id, val)}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );
}
