import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomFieldsRenderer } from './CustomFieldsRenderer';
import type { CustomFieldDefinition } from '../types';

vi.mock('@shared/ui', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
  Label: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <label className={className}>{children}</label>
  ),
}));

vi.mock('./FieldByType', () => ({
  FieldByType: ({
    definition,
    value,
    onChange,
    disabled,
  }: {
    definition: CustomFieldDefinition;
    value: unknown;
    onChange: (val: unknown) => void;
    disabled?: boolean;
  }) => (
    <input
      data-testid={`field-${definition.id}`}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}));

const makeDef = (overrides: Partial<CustomFieldDefinition> = {}): CustomFieldDefinition => ({
  id: 'field-1',
  instance_id: 'inst-1',
  context: 'protocol',
  field_type: 'text',
  label: 'My Field',
  required: false,
  sort_order: 0,
  config: {},
  ...overrides,
});

describe('CustomFieldsRenderer', () => {
  it('renders nothing when definitions is empty', () => {
    const { container } = render(
      <CustomFieldsRenderer definitions={[]} values={{}} onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a label and input for each definition', () => {
    const defs = [
      makeDef({ id: 'f1', label: 'First Field' }),
      makeDef({ id: 'f2', label: 'Second Field' }),
    ];
    render(<CustomFieldsRenderer definitions={defs} values={{}} onChange={vi.fn()} />);
    expect(screen.getByText('First Field')).toBeInTheDocument();
    expect(screen.getByText('Second Field')).toBeInTheDocument();
    expect(screen.getByTestId('field-f1')).toBeInTheDocument();
    expect(screen.getByTestId('field-f2')).toBeInTheDocument();
  });

  it('applies full width class by default', () => {
    const defs = [makeDef({ id: 'f1', config: {} })];
    const { container } = render(
      <CustomFieldsRenderer definitions={defs} values={{}} onChange={vi.fn()} />
    );
    const fieldWrapper = container.querySelector('[class*="w-full"]');
    expect(fieldWrapper).toBeInTheDocument();
  });

  it('applies half width class when config.width is half', () => {
    const defs = [makeDef({ id: 'f1', config: { width: 'half' } })];
    const { container } = render(
      <CustomFieldsRenderer definitions={defs} values={{}} onChange={vi.fn()} />
    );
    const fieldWrapper = container.querySelector('[class*="w-\\[calc\\(50\\%-0\\.5rem\\)\\]"]');
    expect(fieldWrapper).toBeInTheDocument();
  });

  it('calls onChange with updated values when field changes', () => {
    const onChange = vi.fn();
    const defs = [makeDef({ id: 'f1' })];
    render(
      <CustomFieldsRenderer definitions={defs} values={{ f1: 'old' }} onChange={onChange} />
    );
    const input = screen.getByTestId('field-f1');
    fireEvent.change(input, { target: { value: 'new' } });
    expect(onChange).toHaveBeenCalledWith({ f1: 'new' });
  });

  it('passes disabled prop to field components', () => {
    const defs = [makeDef({ id: 'f1' })];
    render(
      <CustomFieldsRenderer definitions={defs} values={{}} onChange={vi.fn()} disabled />
    );
    expect(screen.getByTestId('field-f1')).toBeDisabled();
  });
});
