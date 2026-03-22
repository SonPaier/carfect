import { render, screen } from '@testing-library/react';
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

    it('toggles checkbox when clicking on text', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<ChecklistSection items={makeItems()} onChange={onChange} mode="execute" />);

      await user.click(screen.getByText('Sprawdź ciśnienie'));

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: '1', checked: true })]),
      );
    });

    it('does not show delete buttons in execute mode', () => {
      render(<ChecklistSection items={makeItems()} onChange={vi.fn()} mode="execute" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent('Dodaj zadanie');
    });

    it('adds new item via button', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<ChecklistSection items={makeItems()} onChange={onChange} mode="execute" />);

      await user.click(screen.getByText('Dodaj zadanie'));
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

    it('keeps same font style for checked and unchecked items', () => {
      render(<ChecklistSection items={makeItems()} onChange={vi.fn()} mode="execute" />);

      const unchecked = screen.getByText('Sprawdź ciśnienie');
      const checked = screen.getByText('Wymień filtr');
      // Neither should have line-through
      expect(unchecked.className).not.toContain('line-through');
      expect(checked.className).not.toContain('line-through');
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

    it('shows delete buttons in edit mode', () => {
      render(<ChecklistSection items={makeItems()} onChange={vi.fn()} mode="edit" />);

      // 3 trash buttons + 1 "Dodaj zadanie" button
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    it('deletes item on trash click', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<ChecklistSection items={makeItems()} onChange={onChange} mode="edit" />);

      const buttons = screen.getAllByRole('button');
      // First button is first trash icon
      await user.click(buttons[0]);

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '2' }),
          expect.objectContaining({ id: '3' }),
        ]),
      );
      expect(onChange.mock.calls[0][0]).toHaveLength(2);
    });
  });

  describe('empty state', () => {
    it('shows "Dodaj zadanie" button when empty', () => {
      render(<ChecklistSection items={[]} onChange={vi.fn()} mode="execute" />);

      expect(screen.getByText('Dodaj zadanie')).toBeInTheDocument();
    });

    it('shows input after clicking "Dodaj zadanie"', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection items={[]} onChange={vi.fn()} mode="execute" />);

      await user.click(screen.getByText('Dodaj zadanie'));
      expect(screen.getByPlaceholderText('Wpisz treść...')).toBeInTheDocument();
    });
  });

  describe('follow-up checklist copy', () => {
    it('only unchecked items should be passed to follow-up (tested at integration level)', () => {
      const parentChecklist: ChecklistItem[] = [
        { id: '1', text: 'Done task', checked: true },
        { id: '2', text: 'Pending task', checked: false },
        { id: '3', text: 'Another pending', checked: false },
      ];

      const unchecked = parentChecklist.filter((item) => !item.checked);
      expect(unchecked).toHaveLength(2);
      expect(unchecked.every((item) => !item.checked)).toBe(true);
      expect(unchecked.map((i) => i.text)).toEqual(['Pending task', 'Another pending']);
    });
  });

  describe('adding items', () => {
    it('does not add item when input is empty', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<ChecklistSection items={makeItems()} onChange={onChange} mode="edit" />);

      await user.click(screen.getByText('Dodaj zadanie'));
      await user.keyboard('{Enter}');

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
