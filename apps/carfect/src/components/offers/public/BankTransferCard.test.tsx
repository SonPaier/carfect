import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TooltipProvider } from '@shared/ui';
import { BankTransferCard } from './BankTransferCard';

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

// Mock clipboard
const writeTextMock = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: writeTextMock },
});

describe('BankTransferCard', () => {
  it('renders nothing when no bank data', () => {
    const { container } = render(<BankTransferCard instance={{}} offerNumber="OFF-001" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders bank details', () => {
    renderWithProviders(
      <BankTransferCard
        instance={{
          name: 'Test Studio',
          offer_bank_company_name: 'Test Studio Sp. z o.o.',
          offer_bank_account_number: 'PL 12 3456 7890',
          offer_bank_name: 'mBank',
          address: 'ul. Testowa 1, Warszawa',
        }}
        vehicleModel="BMW M3"
        offerNumber="OFF-001"
      />,
    );

    expect(screen.getByText('Dane do płatności')).toBeInTheDocument();
    expect(screen.getByText('Test Studio Sp. z o.o.')).toBeInTheDocument();
    expect(screen.getByText('PL 12 3456 7890')).toBeInTheDocument();
    expect(screen.getByText('mBank')).toBeInTheDocument();
    expect(screen.getByText('ul. Testowa 1, Warszawa')).toBeInTheDocument();
  });

  it('renders nothing when only company name but no account number', () => {
    const { container } = renderWithProviders(
      <BankTransferCard
        instance={{ offer_bank_company_name: 'Test' }}
        vehicleModel="Audi A4"
        offerNumber="OFF-123"
      />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('builds transfer title from vehicle and offer number', () => {
    renderWithProviders(
      <BankTransferCard
        instance={{ offer_bank_company_name: 'Test', offer_bank_account_number: '123' }}
        vehicleModel="Audi A4"
        offerNumber="OFF-123"
      />,
    );

    expect(screen.getByText('Usługa Audi A4, oferta OFF-123')).toBeInTheDocument();
  });

  it('renders copy buttons for each field', () => {
    renderWithProviders(
      <BankTransferCard
        instance={{
          offer_bank_company_name: 'CopyMe Corp',
          offer_bank_account_number: '1234567890',
          address: 'ul. Testowa',
        }}
        offerNumber="OFF-001"
      />,
    );

    // 4 copy buttons: company, account, address, transfer title
    const copyButtons = screen.getAllByRole('button');
    expect(copyButtons).toHaveLength(4);
  });

  it('falls back to instance name when no bank company name', () => {
    renderWithProviders(
      <BankTransferCard
        instance={{
          name: 'Fallback Name',
          offer_bank_company_name: '',
          offer_bank_account_number: '999',
        }}
        offerNumber="OFF-001"
      />,
    );

    // The company name field should show the fallback
    expect(screen.getByText('Fallback Name')).toBeInTheDocument();
  });
});
