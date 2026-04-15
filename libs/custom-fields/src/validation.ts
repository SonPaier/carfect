import type { CustomFieldDefinition, CustomFieldValues, ValidationResult } from './types';

export function validateCustomFieldValues(
  definitions: CustomFieldDefinition[],
  values: CustomFieldValues
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const def of definitions) {
    const value = values[def.id];

    if (def.required) {
      if (def.field_type === 'checkbox') {
        if (value !== true) {
          errors[def.id] = 'To pole jest wymagane';
          continue;
        }
      } else if (value === undefined || value === null || value === '') {
        errors[def.id] = 'To pole jest wymagane';
        continue;
      }
    }

    if (value === undefined || value === null || value === '') {
      continue;
    }

    switch (def.field_type) {
      case 'checkbox': {
        if (typeof value !== 'boolean') {
          errors[def.id] = 'Nieprawidłowy typ';
        }
        break;
      }
      case 'number': {
        if (typeof value !== 'number') {
          errors[def.id] = 'Nieprawidłowy typ';
          break;
        }
        if (def.config.min !== undefined && value < def.config.min) {
          errors[def.id] = `Wartość musi być co najmniej ${def.config.min}`;
        } else if (def.config.max !== undefined && value > def.config.max) {
          errors[def.id] = `Wartość nie może przekraczać ${def.config.max}`;
        }
        break;
      }
      case 'text':
      case 'textarea': {
        if (typeof value !== 'string') {
          errors[def.id] = 'Nieprawidłowy typ';
        }
        break;
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
