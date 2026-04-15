import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceColumnsSection } from './ServiceColumnsSection';
import type { ServiceColumnDef } from '../types';

function makeColumn(overrides: Partial<ServiceColumnDef> = {}): ServiceColumnDef {
  return {
    id: 'col-1',
    label: 'OPIS',
    order: 0,
    ...overrides,
  };
}

describe('ServiceColumnsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders each column with label input', () => {
    const columns = [
      makeColumn({ id: 'col-1', label: 'OPIS', order: 0 }),
      makeColumn({ id: 'col-2', label: 'CENA', order: 1 }),
    ];
    render(<ServiceColumnsSection columns={columns} onChange={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox', { name: /Nazwa kolumny/i });
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue('OPIS');
    expect(inputs[1]).toHaveValue('CENA');
  });

  it('adds new column when add button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ServiceColumnsSection columns={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Dodaj kolumnę/i }));

    expect(onChange).toHaveBeenCalledOnce();
    const [newColumns] = onChange.mock.calls[0];
    expect(newColumns).toHaveLength(1);
    expect(newColumns[0].label).toBe('Nowa kolumna');
    expect(newColumns[0].order).toBe(0);
    expect(newColumns[0].id).toBeTruthy();
  });

  it('removes column when delete clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const columns = [
      makeColumn({ id: 'col-1', label: 'OPIS', order: 0 }),
      makeColumn({ id: 'col-2', label: 'CENA', order: 1 }),
    ];
    render(<ServiceColumnsSection columns={columns} onChange={onChange} />);

    const deleteButtons = screen.getAllByRole('button', { name: /Usuń kolumnę/i });
    await user.click(deleteButtons[0]);

    expect(onChange).toHaveBeenCalledOnce();
    const [updated] = onChange.mock.calls[0];
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('col-2');
  });

  it('calls onChange when label changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const columns = [makeColumn({ id: 'col-1', label: 'OPIS', order: 0 })];
    render(<ServiceColumnsSection columns={columns} onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: /Nazwa kolumny/i });
    await user.type(input, 'X');

    expect(onChange).toHaveBeenCalled();
    const firstCall = onChange.mock.calls[0][0];
    expect(firstCall[0].label).toBe('OPISX');
  });
});
