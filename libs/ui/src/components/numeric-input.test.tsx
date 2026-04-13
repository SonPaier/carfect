import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NumericInput } from './numeric-input';

describe('NumericInput', () => {
  it('displays initial value', () => {
    render(<NumericInput value={42} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('42');
  });

  it('displays empty string when value is undefined', () => {
    render(<NumericInput value={undefined} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('calls onChange with number after typing digits', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumericInput value={undefined} onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), '5');
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('calls onChange with undefined after clearing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumericInput value={10} onChange={onChange} />);
    await user.clear(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('displays 0 when value is 0', () => {
    render(<NumericInput value={0} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('0');
  });

  it('accepts comma as decimal separator', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumericInput value={undefined} onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), '2,5');
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it('accepts dot as decimal separator', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumericInput value={undefined} onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), '2.5');
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it('normalizes comma to dot on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumericInput value={undefined} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '3,14');
    await user.tab(); // trigger blur
    expect(input).toHaveValue('3.14');
  });

  it('rejects non-numeric characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumericInput value={undefined} onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('allows only one decimal separator', async () => {
    const user = userEvent.setup();
    render(<NumericInput value={undefined} onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '2.5.3');
    // Second dot rejected, value stays at "2.5" + "3" = "2.53"
    expect(input).toHaveValue('2.53');
  });

  it('has inputMode="decimal" for mobile keyboard', () => {
    render(<NumericInput value={undefined} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('inputMode', 'decimal');
  });
});
