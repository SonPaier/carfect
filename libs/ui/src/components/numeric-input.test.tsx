import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NumericInput } from './numeric-input';

describe('NumericInput', () => {
  it('wyświetla wartość początkową', () => {
    render(<NumericInput value={42} onChange={vi.fn()} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(42);
  });

  it('wyświetla pusty string gdy value=undefined', () => {
    render(<NumericInput value={undefined} onChange={vi.fn()} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(null);
  });

  it('wywołuje onChange z liczbą po wpisaniu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumericInput value={undefined} onChange={onChange} />);
    await user.type(screen.getByRole('spinbutton'), '5');
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('wywołuje onChange z undefined po wyczyszczeniu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumericInput value={10} onChange={onChange} />);
    await user.clear(screen.getByRole('spinbutton'));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('wyświetla 0 gdy value=0', () => {
    render(<NumericInput value={0} onChange={vi.fn()} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(0);
  });
});
