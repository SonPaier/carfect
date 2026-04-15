import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsentClauseRenderer } from './ConsentClauseRenderer';
import type { ConsentClauseDef } from '../types';

vi.mock('@shared/ui', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: Record<string, unknown>) => (
    <input
      type="checkbox"
      checked={checked as boolean}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        (onCheckedChange as (v: boolean) => void)(e.target.checked)
      }
      data-testid="checkbox"
      {...props}
    />
  ),
  Button: ({ children, onClick, ...props }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} {...props}>
      {children as React.ReactNode}
    </button>
  ),
}));

const makeClause = (overrides: Partial<ConsentClauseDef> = {}): ConsentClauseDef => ({
  id: 'clause-1',
  text: 'I agree to terms',
  required: false,
  requiresSignature: false,
  visibleToCustomer: true,
  order: 0,
  ...overrides,
});

describe('ConsentClauseRenderer', () => {
  const user = userEvent.setup();

  it('renders nothing when clauses is empty', () => {
    const { container } = render(
      <ConsentClauseRenderer
        clauses={[]}
        values={{}}
        onChange={vi.fn()}
        onRequestSignature={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders clause text for each clause', () => {
    render(
      <ConsentClauseRenderer
        clauses={[makeClause(), makeClause({ id: 'clause-2', text: 'Second clause', order: 1 })]}
        values={{}}
        onChange={vi.fn()}
        onRequestSignature={vi.fn()}
      />
    );
    expect(screen.getByText('I agree to terms')).toBeInTheDocument();
    expect(screen.getByText('Second clause')).toBeInTheDocument();
  });

  it('calls onChange with clause id when checkbox toggled', async () => {
    const onChange = vi.fn();
    render(
      <ConsentClauseRenderer
        clauses={[makeClause()]}
        values={{}}
        onChange={onChange}
        onRequestSignature={vi.fn()}
      />
    );
    await user.click(screen.getByTestId('checkbox'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ 'clause-1': true }));
  });

  it('shows sign button when clause requires signature and is checked', () => {
    render(
      <ConsentClauseRenderer
        clauses={[makeClause({ requiresSignature: true })]}
        values={{ 'clause-1': true }}
        onChange={vi.fn()}
        onRequestSignature={vi.fn()}
      />
    );
    expect(screen.getByText('Podpisz')).toBeInTheDocument();
  });

  it('does not show sign button when clause is unchecked', () => {
    render(
      <ConsentClauseRenderer
        clauses={[makeClause({ requiresSignature: true })]}
        values={{ 'clause-1': false }}
        onChange={vi.fn()}
        onRequestSignature={vi.fn()}
      />
    );
    expect(screen.queryByText('Podpisz')).not.toBeInTheDocument();
  });

  it('calls onRequestSignature when sign button clicked', async () => {
    const onRequestSignature = vi.fn();
    render(
      <ConsentClauseRenderer
        clauses={[makeClause({ requiresSignature: true })]}
        values={{ 'clause-1': true }}
        onChange={vi.fn()}
        onRequestSignature={onRequestSignature}
      />
    );
    await user.click(screen.getByText('Podpisz'));
    expect(onRequestSignature).toHaveBeenCalledWith('clause-1', expect.any(Function));
  });
});
