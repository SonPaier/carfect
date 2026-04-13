import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceDataForm } from './InvoiceDataForm';
import type { BillingData } from './billing.types';

const emptyBillingData: BillingData = {
  billing_nip: null,
  billing_name: null,
  billing_street: null,
  billing_postal_code: null,
  billing_city: null,
};

const filledBillingData: BillingData = {
  billing_nip: '1234567890',
  billing_name: 'Test Company Sp. z o.o.',
  billing_street: 'ul. Testowa 1',
  billing_postal_code: '00-001',
  billing_city: 'Warszawa',
};

const mockGusResult = {
  name: 'GUS Company Sp. z o.o.',
  street: 'ul. GUS 5',
  postalCode: '01-234',
  city: 'Kraków',
};

function createGusLookup(overrides?: Partial<{ result: typeof mockGusResult | null; loading: boolean }>) {
  return {
    lookupNip: vi.fn().mockResolvedValue(overrides?.result !== undefined ? overrides.result : mockGusResult),
    loading: overrides?.loading ?? false,
  };
}

describe('InvoiceDataForm', () => {
  it('renders all form fields with labels', () => {
    render(
      <InvoiceDataForm
        initialData={emptyBillingData}
        onSave={vi.fn()}
        gusLookup={createGusLookup()}
      />,
    );

    expect(screen.getByLabelText('NIP *')).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa firmy *')).toBeInTheDocument();
    expect(screen.getByLabelText('Ulica *')).toBeInTheDocument();
    expect(screen.getByLabelText('Kod pocztowy *')).toBeInTheDocument();
    expect(screen.getByLabelText('Miasto *')).toBeInTheDocument();
  });

  it('renders card heading', () => {
    render(
      <InvoiceDataForm
        initialData={emptyBillingData}
        onSave={vi.fn()}
        gusLookup={createGusLookup()}
      />,
    );

    expect(screen.getByText('Dane do faktury')).toBeInTheDocument();
  });

  it('renders "Pobierz z GUS" button', () => {
    render(
      <InvoiceDataForm
        initialData={emptyBillingData}
        onSave={vi.fn()}
        gusLookup={createGusLookup()}
      />,
    );

    expect(screen.getByRole('button', { name: /Pobierz z GUS/ })).toBeInTheDocument();
  });

  it('calls gusLookup.lookupNip when GUS button clicked', async () => {
    const user = userEvent.setup();
    const gusLookup = createGusLookup();

    render(
      <InvoiceDataForm
        initialData={{ ...emptyBillingData, billing_nip: '1234567890' }}
        onSave={vi.fn()}
        gusLookup={gusLookup}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Pobierz z GUS/ }));

    expect(gusLookup.lookupNip).toHaveBeenCalledWith('1234567890');
  });

  it('populates fields after successful GUS lookup', async () => {
    const user = userEvent.setup();

    render(
      <InvoiceDataForm
        initialData={{ ...emptyBillingData, billing_nip: '1234567890' }}
        onSave={vi.fn()}
        gusLookup={createGusLookup()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Pobierz z GUS/ }));

    await waitFor(() => {
      expect(screen.getByLabelText('Nazwa firmy *')).toHaveValue(mockGusResult.name);
      expect(screen.getByLabelText('Ulica *')).toHaveValue(mockGusResult.street);
      expect(screen.getByLabelText('Kod pocztowy *')).toHaveValue(mockGusResult.postalCode);
      expect(screen.getByLabelText('Miasto *')).toHaveValue(mockGusResult.city);
    });
  });

  it('shows loading state during GUS lookup', () => {
    render(
      <InvoiceDataForm
        initialData={emptyBillingData}
        onSave={vi.fn()}
        gusLookup={createGusLookup({ loading: true })}
      />,
    );

    const gusButton = screen.getByRole('button', { name: /Pobierz z GUS/ });
    expect(gusButton).toBeDisabled();
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <InvoiceDataForm
        initialData={filledBillingData}
        onSave={onSave}
        gusLookup={createGusLookup()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Zapisz dane do faktury/ }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          billing_nip: '1234567890',
          billing_name: 'Test Company Sp. z o.o.',
          billing_street: 'ul. Testowa 1',
          billing_postal_code: '00-001',
          billing_city: 'Warszawa',
        }),
      );
    });
  });

  it('validates NIP format — shows error for non-10-digit input', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <InvoiceDataForm
        initialData={emptyBillingData}
        onSave={onSave}
        gusLookup={createGusLookup()}
      />,
    );

    const nipInput = screen.getByLabelText('NIP *');
    await user.type(nipInput, '123');

    await user.click(screen.getByRole('button', { name: /Zapisz dane do faktury/ }));

    await waitFor(() => {
      expect(screen.getByText('NIP musi mieć 10 cyfr')).toBeInTheDocument();
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows required field errors when submitting empty form', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <InvoiceDataForm
        initialData={emptyBillingData}
        onSave={onSave}
        gusLookup={createGusLookup()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Zapisz dane do faktury/ }));

    await waitFor(() => {
      expect(screen.getByText('NIP jest wymagany')).toBeInTheDocument();
      expect(screen.getByText('Nazwa firmy jest wymagana')).toBeInTheDocument();
      expect(screen.getByText('Ulica jest wymagana')).toBeInTheDocument();
      expect(screen.getByText('Kod pocztowy jest wymagany')).toBeInTheDocument();
      expect(screen.getByText('Miasto jest wymagane')).toBeInTheDocument();
    });

    expect(onSave).not.toHaveBeenCalled();
  });
});
