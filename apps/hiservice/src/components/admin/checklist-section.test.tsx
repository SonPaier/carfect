import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChecklistSection, type ChecklistItem } from '@shared/ui';

const makeItems = (): ChecklistItem[] => [
  { id: '1', text: 'Sprawdź ciśnienie', checked: false },
  { id: '2', text: 'Wymień filtr', checked: true },
  { id: '3', text: 'Test szczelności', checked: false },
];

describe('ChecklistSection', () => {
  describe('execute mode', () => {
    it('renders items with checkboxes', () => {
      render(<ChecklistSection items={makeItems()} onChange={vi.fn()} mode="execute" />);

      expect(screen.getByText('Sprawdź ciśnienie')).toBeInTheDocument();
      expect(screen.getByText('Wymień filtr')).toBeInTheDocument();
      expect(screen.getByText('Test szczelności')).toBeInTheDocument();
    });

    it('toggles checkbox on click', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<ChecklistSection items={makeItems()} onChange={onChange} mode="execute" />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: '1', checked: true })]),
      );
    });

    it('shows checked items with line-through', () => {
      render(<ChecklistSection items={makeItems()} onChange={vi.fn()} mode="execute" />);

      const checkedItem = screen.getByText('Wymień filtr');
      expect(checkedItem.className).toContain('line-through');
    });

    it('does not show delete buttons in execute mode', () => {
      render(<ChecklistSection items={makeItems()} onChange={vi.fn()} mode="execute" />);

      // Only the "Dodaj punkt" button should be present; no trash buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent('Dodaj punkt');
    });

    it('adds new item via "Dodaj punkt" button', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<ChecklistSection items={makeItems()} onChange={onChange} mode="execute" />);

      await user.click(screen.getByText('Dodaj punkt'));
      const input = screen.getByPlaceholderText('Wpisz treść...');
      await user.type(input, 'Nowy punkt');
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          ...makeItems(),
          expect.objectContaining({ text: 'Nowy punkt', checked: false }),
        ]),
      );
    });
  });

  describe('edit mode', () => {
    it('renders items with numbers instead of checkboxes', () => {
      render(<ChecklistSection items={makeItems()} onChange={vi.fn()} mode="edit" />);

      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
      expect(screen.getByText('3.')).toBeInTheDocument();
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });

    it('allows editing text on click', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<ChecklistSection items={makeItems()} onChange={onChange} mode="edit" />);

      await user.click(screen.getByText('Sprawdź ciśnienie'));
      const input = screen.getByDisplayValue('Sprawdź ciśnienie');
      await user.clear(input);
      await user.type(input, 'Zmieniony tekst');
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: '1', text: 'Zmieniony tekst' })]),
      );
    });
  });

  describe('empty state', () => {
    it('shows "Dodaj listę zadań" when empty', () => {
      render(<ChecklistSection items={[]} onChange={vi.fn()} mode="execute" />);

      expect(screen.getByText('Dodaj listę zadań')).toBeInTheDocument();
    });

    it('shows input after clicking "Dodaj listę zadań"', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection items={[]} onChange={vi.fn()} mode="execute" />);

      await user.click(screen.getByText('Dodaj listę zadań'));
      expect(screen.getByPlaceholderText('Wpisz treść...')).toBeInTheDocument();
    });
  });

  describe('adding items', () => {
    it('generates a unique id for new items even when crypto.randomUUID is unavailable', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      // Simulate non-secure context where randomUUID is absent
      const originalRandomUUID = crypto.randomUUID;
      // @ts-expect-error intentionally removing for test
      delete crypto.randomUUID;

      render(<ChecklistSection items={[]} onChange={onChange} mode="edit" />);
      await user.click(screen.getByText('Dodaj listę zadań'));
      const input = screen.getByPlaceholderText('Wpisz treść...');
      await user.type(input, 'Test item');
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ text: 'Test item', id: expect.any(String) }),
        ]),
      );
      const newItem = onChange.mock.calls[0][0][0];
      expect(newItem.id).toBeTruthy();
      expect(newItem.id.length).toBeGreaterThan(0);

      // Restore
      crypto.randomUUID = originalRandomUUID;
    });

    it('does not add item when input is empty and Enter is pressed', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<ChecklistSection items={makeItems()} onChange={onChange} mode="edit" />);

      await user.click(screen.getByText('Dodaj punkt'));
      await user.keyboard('{Enter}');

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
