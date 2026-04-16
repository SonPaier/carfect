import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsentClausesSection } from './ConsentClausesSection';
import type { ConsentClauseDef } from '../types';

function makeClause(overrides: Partial<ConsentClauseDef> = {}): ConsentClauseDef {
  return {
    id: 'clause-1',
    text: 'I agree to the terms',
    required: false,
    requiresSignature: false,
    visibleToCustomer: true,
    order: 0,
    ...overrides,
  };
}

describe('ConsentClausesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no clauses', () => {
    render(<ConsentClausesSection clauses={[]} onChange={vi.fn()} />);
    expect(screen.queryByPlaceholderText('Treść zgody...')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dodaj zgodę/i })).toBeInTheDocument();
  });

  it('renders a card for each clause', () => {
    const clauses = [
      makeClause({ id: 'c1', text: 'First clause', order: 0 }),
      makeClause({ id: 'c2', text: 'Second clause', order: 1 }),
    ];
    render(<ConsentClausesSection clauses={clauses} onChange={vi.fn()} />);
    const textareas = screen.getAllByPlaceholderText('Treść zgody...');
    expect(textareas).toHaveLength(2);
    expect(textareas[0]).toHaveValue('First clause');
    expect(textareas[1]).toHaveValue('Second clause');
  });

  it('adds a new clause when add button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConsentClausesSection clauses={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Dodaj zgodę/i }));

    expect(onChange).toHaveBeenCalledOnce();
    const [newClauses] = onChange.mock.calls[0];
    expect(newClauses).toHaveLength(1);
    expect(newClauses[0].text).toBe('');
    expect(newClauses[0].required).toBe(false);
    expect(newClauses[0].requiresSignature).toBe(false);
    expect(newClauses[0].visibleToCustomer).toBe(true);
    expect(newClauses[0].order).toBe(0);
    expect(newClauses[0].id).toBeTruthy();
  });

  it('calls onChange when clause text changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const clause = makeClause({ id: 'c1', text: '' });
    render(<ConsentClausesSection clauses={[clause]} onChange={onChange} />);

    const textarea = screen.getByPlaceholderText('Treść zgody...');
    await user.type(textarea, 'X');

    expect(onChange).toHaveBeenCalled();
    const firstCall = onChange.mock.calls[0][0];
    expect(firstCall[0].text).toBe('X');
  });

  it('calls onChange when required toggle switched', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const clause = makeClause({ id: 'c1', required: false });
    render(<ConsentClausesSection clauses={[clause]} onChange={onChange} />);

    const switches = screen.getAllByRole('switch');
    // First switch is "Wymagane"
    await user.click(switches[0]);

    expect(onChange).toHaveBeenCalledOnce();
    const [updated] = onChange.mock.calls[0];
    expect(updated[0].required).toBe(true);
  });

  it('removes clause when delete button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const clauses = [
      makeClause({ id: 'c1', text: 'First clause', order: 0 }),
      makeClause({ id: 'c2', text: 'Second clause', order: 1 }),
    ];
    render(<ConsentClausesSection clauses={clauses} onChange={onChange} />);

    const deleteButtons = screen.getAllByRole('button', { name: /Usuń zgodę/i });
    await user.click(deleteButtons[0]);

    expect(onChange).toHaveBeenCalledOnce();
    const [updated] = onChange.mock.calls[0];
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('c2');
  });
});
