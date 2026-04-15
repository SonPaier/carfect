import { Checkbox } from '@shared/ui';
import { Input } from '@shared/ui';
import { Textarea } from '@shared/ui';
import type { CustomFieldDefinition } from '../types';

interface FieldByTypeProps {
  definition: CustomFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function FieldByType({ definition, value, onChange, disabled }: FieldByTypeProps) {
  const { field_type, config } = definition;

  if (field_type === 'checkbox') {
    return (
      <Checkbox
        checked={value as boolean}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (field_type === 'text') {
    return (
      <Input
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        disabled={disabled}
      />
    );
  }

  if (field_type === 'number') {
    return (
      <Input
        type="number"
        value={(value as number) ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        min={config.min}
        max={config.max}
        placeholder={config.placeholder}
        disabled={disabled}
      />
    );
  }

  if (field_type === 'textarea') {
    return (
      <Textarea
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        disabled={disabled}
      />
    );
  }

  return null;
}
