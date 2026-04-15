import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProtocolPreview } from './ProtocolPreview';
import type { ProtocolConfig } from '../types';
import type { CustomFieldDefinition } from '@shared/custom-fields';
import { DEFAULT_PROTOCOL_CONFIG } from '../defaults';

const baseConfig: ProtocolConfig = {
  ...DEFAULT_PROTOCOL_CONFIG,
  builtInFields: {
    ...DEFAULT_PROTOCOL_CONFIG.builtInFields,
    fuelLevel: { enabled: true, visibleToCustomer: true },
    odometer: { enabled: true, visibleToCustomer: true },
    nip: { enabled: true, visibleToCustomer: true },
    vin: { enabled: false, visibleToCustomer: true },
    serviceItems: {
      enabled: true,
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
  },
  consentClauses: [
    {
      id: 'clause-1',
      text: 'Wyrażam zgodę na przetwarzanie danych osobowych',
      required: true,
      requiresSignature: false,
      visibleToCustomer: true,
      order: 0,
    },
    {
      id: 'clause-2',
      text: 'Akceptuję regulamin serwisu',
      required: false,
      requiresSignature: false,
      visibleToCustomer: true,
      order: 1,
    },
  ],
  serviceColumns: [
    { id: 'col-desc', label: 'OPIS', order: 0 },
    { id: 'col-price', label: 'CENA NETTO', order: 1 },
  ],
  sectionOrder: [
    'header',
    'customerInfo',
    'vehicleInfo',
    'vehicleDiagram',
    'fuelOdometer',
    'valuableItems',
    'customFields',
    'serviceItems',
    'consentClauses',
    'customerSignature',
    'releaseSection',
  ],
};

const noDefinitions: CustomFieldDefinition[] = [];

const sampleDefinitions: CustomFieldDefinition[] = [
  {
    id: 'field-1',
    instance_id: 'inst-1',
    context: 'protocol',
    field_type: 'text',
    label: 'Numer zlecenia',
    required: false,
    sort_order: 0,
    config: { width: 'half' },
  },
  {
    id: 'field-2',
    instance_id: 'inst-1',
    context: 'protocol',
    field_type: 'checkbox',
    label: 'Kluczyki oddane',
    required: false,
    sort_order: 1,
    config: { width: 'full' },
  },
];

describe('ProtocolPreview', () => {
  it('renders sections in sectionOrder order', () => {
    render(<ProtocolPreview config={baseConfig} definitions={noDefinitions} />);

    const header = screen.getByText('Dokument przyjęcia samochodu');
    const customer = screen.getByText('Jan Kowalski', { exact: false });
    const vehicle = screen.getByText('BMW 320d', { exact: false });

    expect(header).toBeInTheDocument();
    expect(customer).toBeInTheDocument();
    expect(vehicle).toBeInTheDocument();

    // Verify header appears before customer info in the DOM
    expect(header.compareDocumentPosition(customer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('skips disabled sections', () => {
    render(<ProtocolPreview config={baseConfig} definitions={noDefinitions} />);

    // valuableItemsClause is disabled
    expect(
      screen.queryByText('Przedmioty wartościowe nie znajdują się w samochodzie'),
    ).not.toBeInTheDocument();

    // releaseSection is disabled
    expect(screen.queryByText('Pokwitowanie odbioru')).not.toBeInTheDocument();
  });

  it('renders custom field labels from definitions', () => {
    render(<ProtocolPreview config={baseConfig} definitions={sampleDefinitions} />);

    expect(screen.getByText('Numer zlecenia')).toBeInTheDocument();
    expect(screen.getByText('Kluczyki oddane')).toBeInTheDocument();
  });

  it('renders service column headers', () => {
    render(<ProtocolPreview config={baseConfig} definitions={noDefinitions} />);

    expect(screen.getByText('OPIS')).toBeInTheDocument();
    expect(screen.getByText('CENA NETTO')).toBeInTheDocument();
  });

  it('renders consent clause text', () => {
    render(<ProtocolPreview config={baseConfig} definitions={noDefinitions} />);

    expect(
      screen.getByText('Wyrażam zgodę na przetwarzanie danych osobowych'),
    ).toBeInTheDocument();
    expect(screen.getByText('Akceptuję regulamin serwisu')).toBeInTheDocument();
  });
});
