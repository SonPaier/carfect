import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BuiltInFieldsSection } from './BuiltInFieldsSection';
import type { BuiltInFieldsConfig } from '../types';

const defaultConfig: BuiltInFieldsConfig = {
  nip: { enabled: true, visibleToCustomer: true },
  vin: { enabled: false, visibleToCustomer: true },
  fuelLevel: { enabled: true, visibleToCustomer: true },
  odometer: { enabled: true, visibleToCustomer: true },
  serviceItems: {
    enabled: false,
    visibleToCustomer: true,
    allowManualEntry: true,
    loadFromOffer: false,
    loadFromReservation: false,
  },
  releaseSection: {
    enabled: false,
    declarationText: 'Oświadczam, że odbieram pojazd bez zastrzeżeń',
    visibleToCustomer: true,
  },
  valuableItemsClause: { enabled: false, visibleToCustomer: true },
};

describe('BuiltInFieldsSection', () => {
  it('renders a toggle for each built-in field', () => {
    render(<BuiltInFieldsSection config={defaultConfig} onChange={vi.fn()} />);

    expect(screen.getByText('NIP firmy')).toBeInTheDocument();
    expect(screen.getByText('VIN')).toBeInTheDocument();
    expect(screen.getByText('Poziom paliwa')).toBeInTheDocument();
    expect(screen.getByText('Przebieg (km)')).toBeInTheDocument();
    expect(screen.getByText('Lista usług')).toBeInTheDocument();
    expect(screen.getByText('Sekcja odbioru pojazdu')).toBeInTheDocument();
    expect(screen.getByText('Przedmioty wartościowe')).toBeInTheDocument();
  });

  it('calls onChange when nip toggle switched', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<BuiltInFieldsSection config={defaultConfig} onChange={onChange} />);

    // nip is enabled=true, its switch should be checked
    // Find all switches — the nip enabled switch is the first one in the document
    const switches = screen.getAllByRole('switch');
    // The first switch belongs to the nip card (enabled toggle)
    await user.click(switches[0]);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nip: expect.objectContaining({ enabled: false }),
      }),
    );
  });

  it('calls onChange when vin toggle switched', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<BuiltInFieldsSection config={defaultConfig} onChange={onChange} />);

    // vin card's enabled switch is the second one
    const switches = screen.getAllByRole('switch');
    await user.click(switches[1]);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        vin: expect.objectContaining({ enabled: true }),
      }),
    );
  });

  it('shows declaration text input for releaseSection when expanded', async () => {
    const user = userEvent.setup();

    render(<BuiltInFieldsSection config={defaultConfig} onChange={vi.fn()} />);

    // The declaration textarea should not be visible initially (collapsible closed)
    expect(screen.queryByPlaceholderText('Domyślna etykieta')).not.toBeInTheDocument();

    // Click the releaseSection card trigger to expand it
    const releaseTrigger = screen.getByText('Sekcja odbioru pojazdu');
    await user.click(releaseTrigger);

    // After expanding, the declaration textarea should appear
    const textarea = screen.getByRole('textbox', { name: /tekst deklaracji/i });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Oświadczam, że odbieram pojazd bez zastrzeżeń');
  });
});
