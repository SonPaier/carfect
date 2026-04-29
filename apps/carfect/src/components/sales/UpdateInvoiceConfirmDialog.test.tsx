import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateInvoiceConfirmDialog } from './UpdateInvoiceConfirmDialog';

describe('UpdateInvoiceConfirmDialog', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    invoiceNumber: 'FV/2026/04/001',
    onUpdateInvoice: vi.fn(),
    onSaveOnly: vi.fn(),
  };

  it('shows invoice number in the title when provided', () => {
    render(<UpdateInvoiceConfirmDialog {...baseProps} />);
    expect(
      screen.getByText(/Faktura FV\/2026\/04\/001 jest powiązana z tym zamówieniem/),
    ).toBeInTheDocument();
  });

  it('falls back to generic title when invoice number is null', () => {
    render(<UpdateInvoiceConfirmDialog {...baseProps} invoiceNumber={null} />);
    expect(screen.getByText('Faktura jest powiązana z tym zamówieniem')).toBeInTheDocument();
  });

  it('renders three action buttons', () => {
    render(<UpdateInvoiceConfirmDialog {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Tak, edytuj fakturę' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tylko zapisz zamówienie' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anuluj' })).toBeInTheDocument();
  });

  it('calls onUpdateInvoice and closes the dialog when confirm is clicked', async () => {
    const user = userEvent.setup();
    const onUpdateInvoice = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <UpdateInvoiceConfirmDialog
        {...baseProps}
        onUpdateInvoice={onUpdateInvoice}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Tak, edytuj fakturę' }));
    expect(onUpdateInvoice).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onSaveOnly and closes the dialog when "save only" is clicked', async () => {
    const user = userEvent.setup();
    const onSaveOnly = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <UpdateInvoiceConfirmDialog
        {...baseProps}
        onSaveOnly={onSaveOnly}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Tylko zapisz zamówienie' }));
    expect(onSaveOnly).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('only closes the dialog (no save action) when "Anuluj" is clicked', async () => {
    const user = userEvent.setup();
    const onUpdateInvoice = vi.fn();
    const onSaveOnly = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <UpdateInvoiceConfirmDialog
        {...baseProps}
        onUpdateInvoice={onUpdateInvoice}
        onSaveOnly={onSaveOnly}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));
    expect(onUpdateInvoice).not.toHaveBeenCalled();
    expect(onSaveOnly).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
