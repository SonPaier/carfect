import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldByType } from './FieldByType';
import type { CustomFieldDefinition } from '../types';

vi.mock('@shared/ui', () => ({
  Checkbox: ({ checked, onCheckedChange, disabled }: { checked?: boolean; onCheckedChange?: (val: boolean) => void; disabled?: boolean }) => (
    <input
      type="checkbox"
      checked={checked ?? false}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      data-testid="checkbox"
    />
  ),
  Input: ({ value, onChange, type, min, max, placeholder, disabled }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      type={type ?? 'text'}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      placeholder={placeholder}
      disabled={disabled}
      data-testid="input"
    />
  ),
  Textarea: ({ value, onChange, placeholder, disabled }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      data-testid="textarea"
    />
  ),
}));

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

describe('FieldByType', () => {
  it('renders Checkbox for checkbox type', () => {
    render(
      <FieldByType
        definition={makeDef({ field_type: 'checkbox' })}
        value={false}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('checkbox')).toBeInTheDocument();
  });

  it('renders Input for text type', () => {
    render(
      <FieldByType
        definition={makeDef({ field_type: 'text' })}
        value="hello"
        onChange={vi.fn()}
      />
    );
    const input = screen.getByTestId('input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders number Input for number type', () => {
    render(
      <FieldByType
        definition={makeDef({ field_type: 'number' })}
        value={42}
        onChange={vi.fn()}
      />
    );
    const input = screen.getByTestId('input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
  });

  it('renders Textarea for textarea type', () => {
    render(
      <FieldByType
        definition={makeDef({ field_type: 'textarea' })}
        value="some text"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('textarea')).toBeInTheDocument();
  });

  it('calls onChange with boolean when checkbox clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FieldByType
        definition={makeDef({ field_type: 'checkbox' })}
        value={false}
        onChange={onChange}
      />
    );
    await user.click(screen.getByTestId('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with string value when text input changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FieldByType
        definition={makeDef({ field_type: 'text' })}
        value=""
        onChange={onChange}
      />
    );
    await user.type(screen.getByTestId('input'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
