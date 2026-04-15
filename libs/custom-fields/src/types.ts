export type CustomFieldType = 'checkbox' | 'text' | 'number' | 'textarea';

export type FieldWidth = 'full' | 'half';

export interface CustomFieldConfig {
  placeholder?: string;
  min?: number;
  max?: number;
  width?: FieldWidth;
  visibleToCustomer?: boolean;
}

export interface CustomFieldDefinition {
  id: string;
  instance_id: string;
  context: string;
  field_type: CustomFieldType;
  label: string;
  required: boolean;
  sort_order: number;
  config: CustomFieldConfig;
}

export type CustomFieldValues = Record<string, unknown>;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
