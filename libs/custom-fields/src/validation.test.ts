import { describe, it, expect } from 'vitest';
import { validateCustomFieldValues } from './validation';
import type { CustomFieldDefinition } from './types';

const makeDef = (overrides: Partial<CustomFieldDefinition> = {}): CustomFieldDefinition => ({
  id: 'field-1',
  instance_id: 'inst-1',
  context: 'protocol',
  field_type: 'text',
  label: 'Test Field',
  required: false,
  sort_order: 0,
  config: {},
  ...overrides,
});

describe('validateCustomFieldValues', () => {
  it('returns valid for empty definitions', () => {
    const result = validateCustomFieldValues([], { random: 'value' });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns error for missing required field', () => {
    const defs = [makeDef({ required: true })];
    const result = validateCustomFieldValues(defs, {});
    expect(result.valid).toBe(false);
    expect(result.errors['field-1']).toBe('To pole jest wymagane');
  });

  it('returns error for number below min', () => {
    const defs = [makeDef({ id: 'num', field_type: 'number', config: { min: 5 } })];
    const result = validateCustomFieldValues(defs, { num: 3 });
    expect(result.valid).toBe(false);
    expect(result.errors['num']).toContain('co najmniej 5');
  });

  it('returns error for number above max', () => {
    const defs = [makeDef({ id: 'num', field_type: 'number', config: { max: 10 } })];
    const result = validateCustomFieldValues(defs, { num: 15 });
    expect(result.valid).toBe(false);
    expect(result.errors['num']).toContain('nie może przekraczać 10');
  });

  it('returns valid when all required fields are filled', () => {
    const defs = [
      makeDef({ id: 'f1', field_type: 'text', required: true }),
      makeDef({ id: 'f2', field_type: 'checkbox', required: true }),
      makeDef({ id: 'f3', field_type: 'number', required: true, config: { min: 0, max: 100 } }),
    ];
    const values = { f1: 'hello', f2: true, f3: 50 };
    const result = validateCustomFieldValues(defs, values);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns error for required checkbox with false value', () => {
    const defs = [makeDef({ id: 'cb', field_type: 'checkbox', required: true })];
    const result = validateCustomFieldValues(defs, { cb: false });
    expect(result.valid).toBe(false);
    expect(result.errors['cb']).toBe('To pole jest wymagane');
  });

  it('returns valid for required checkbox with true value', () => {
    const defs = [makeDef({ id: 'cb', field_type: 'checkbox', required: true })];
    const result = validateCustomFieldValues(defs, { cb: true });
    expect(result.valid).toBe(true);
  });

  it('ignores extra values with no matching definition', () => {
    const defs = [makeDef({ id: 'f1', field_type: 'text' })];
    const result = validateCustomFieldValues(defs, { f1: 'ok', unknown_field: 'whatever' });
    expect(result.valid).toBe(true);
  });
});
