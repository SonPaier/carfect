import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HallPickerField from './HallPickerField';

const halls = [
  { id: 'hall-1', name: 'Sala A' },
  { id: 'hall-2', name: 'Sala B' },
];

describe('HallPickerField', () => {
  it('returns null when halls array is empty', () => {
    const { container } = render(
      <HallPickerField value="" onChange={vi.fn()} halls={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders label when halls exist', () => {
    render(<HallPickerField value="" onChange={vi.fn()} halls={halls} />);
    expect(screen.getByText('Przypisany kalendarz')).toBeInTheDocument();
  });

  it('renders hint text when halls exist', () => {
    render(<HallPickerField value="" onChange={vi.fn()} halls={halls} />);
    expect(
      screen.getByText('Użytkownik po zalogowaniu zobaczy wybrany kalendarz'),
    ).toBeInTheDocument();
  });

  it('shows placeholder when no value is selected', () => {
    render(<HallPickerField value="" onChange={vi.fn()} halls={halls} />);
    expect(screen.getByText('Wybierz kalendarz...')).toBeInTheDocument();
  });

  it('calls onChange when a hall is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<HallPickerField value="" onChange={onChange} halls={halls} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Sala A'));

    expect(onChange).toHaveBeenCalledWith('hall-1');
  });
});
