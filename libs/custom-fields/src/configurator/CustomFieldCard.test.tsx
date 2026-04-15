import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CustomFieldCard } from './CustomFieldCard';
import type { CustomFieldDefinition } from '../types';

const makeDefinition = (overrides: Partial<CustomFieldDefinition> = {}): CustomFieldDefinition => ({
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

const defaultProps = {
  onUpdate: vi.fn(),
  onRemove: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  isFirst: false,
  isLast: false,
};

describe('CustomFieldCard', () => {
  it('renders label input with current value', () => {
    render(<CustomFieldCard definition={makeDefinition({ label: 'Test Label' })} {...defaultProps} />);
    expect(screen.getByDisplayValue('Test Label')).toBeInTheDocument();
  });

  it('calls onUpdate when label changes', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <CustomFieldCard
        definition={makeDefinition({ label: 'Old' })}
        {...defaultProps}
        onUpdate={onUpdate}
      />,
    );
    const input = screen.getByDisplayValue('Old');
    await user.clear(input);
    await user.type(input, 'New');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ label: expect.any(String) }));
  });

  it('calls onUpdate when type changes', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <CustomFieldCard
        definition={makeDefinition({ field_type: 'text' })}
        {...defaultProps}
        onUpdate={onUpdate}
      />,
    );
    // Open the select and pick 'Checkbox'
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Checkbox' }));
    expect(onUpdate).toHaveBeenCalledWith({ field_type: 'checkbox' });
  });

  it('calls onRemove when delete button clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <CustomFieldCard definition={makeDefinition()} {...defaultProps} onRemove={onRemove} />,
    );
    await user.click(screen.getByRole('button', { name: 'Usuń pole' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('disables move up button when isFirst is true', () => {
    render(<CustomFieldCard definition={makeDefinition()} {...defaultProps} isFirst={true} />);
    expect(screen.getByRole('button', { name: 'Przesuń w górę' })).toBeDisabled();
  });

  it('disables move down button when isLast is true', () => {
    render(<CustomFieldCard definition={makeDefinition()} {...defaultProps} isLast={true} />);
    expect(screen.getByRole('button', { name: 'Przesuń w dół' })).toBeDisabled();
  });
});
