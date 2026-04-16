import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../useProtocolConfig', () => ({
  useProtocolConfig: () => ({
    config: {
      builtInFields: {
        nip: { enabled: true, visibleToCustomer: true },
        vin: { enabled: false, visibleToCustomer: true },
        fuelLevel: { enabled: true, visibleToCustomer: true },
        odometer: { enabled: true, visibleToCustomer: true },
        serviceItems: { enabled: false, visibleToCustomer: true, allowManualEntry: true, loadFromOffer: false, loadFromReservation: false },
        releaseSection: { enabled: false, visibleToCustomer: true },
        valuableItemsClause: { enabled: false, visibleToCustomer: true },
      },
      consentClauses: [],
      serviceColumns: [{ id: 'c1', label: 'OPIS', order: 0 }],
      sectionOrder: ['header', 'customerInfo', 'customerSignature'],
    },
    isLoading: false,
    saveConfig: vi.fn(),
    isSaving: false,
  }),
}));

vi.mock('@shared/custom-fields', () => ({
  useCustomFields: () => ({ definitions: [], isLoading: false }),
  CustomFieldsConfigurator: () => <div data-testid="custom-fields-configurator" />,
}));

vi.mock('@shared/ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} disabled={disabled as boolean} {...props}>
      {children as React.ReactNode}
    </button>
  ),
  Tabs: ({ children, ...props }: Record<string, unknown>) => <div {...props}>{children as React.ReactNode}</div>,
  TabsContent: ({ children, value, ...props }: Record<string, unknown>) => (
    <div data-testid={`tab-${value}`} {...props}>{children as React.ReactNode}</div>
  ),
  TabsList: ({ children, ...props }: Record<string, unknown>) => <div {...props}>{children as React.ReactNode}</div>,
  TabsTrigger: ({ children, value, ...props }: Record<string, unknown>) => (
    <button data-testid={`trigger-${value}`} {...props}>{children as React.ReactNode}</button>
  ),
  Textarea: (props: Record<string, unknown>) => <textarea {...props} />,
  ScrollArea: ({ children }: Record<string, unknown>) => <div>{children as React.ReactNode}</div>,
  useIsMobile: () => false,
}));

vi.mock('./SectionOrderTab', () => ({
  SectionOrderTab: () => <div data-testid="section-order-tab" />,
}));

vi.mock('./BuiltInFieldsSection', () => ({
  BuiltInFieldsSection: () => <div data-testid="built-in-fields" />,
}));

vi.mock('./ConsentClausesSection', () => ({
  ConsentClausesSection: () => <div data-testid="consent-clauses" />,
}));

vi.mock('./ServiceColumnsSection', () => ({
  ServiceColumnsSection: () => <div data-testid="service-columns" />,
}));

vi.mock('./ProtocolPreview', () => ({
  ProtocolPreview: () => <div data-testid="protocol-preview" />,
}));

const { ProtocolConfiguratorView } = await import('./ProtocolConfiguratorView');

describe('ProtocolConfiguratorView', () => {
  const defaultProps = {
    instanceId: 'inst-1',
    supabase: {} as never,
    onBack: vi.fn(),
  };

  it('renders protocol type toggle', () => {
    render(<ProtocolConfiguratorView {...defaultProps} />);
    expect(screen.getByText('Protokół przyjęcia')).toBeInTheDocument();
    expect(screen.getByText('Protokół wydania')).toBeInTheDocument();
  });

  it('renders all 5 tab triggers', () => {
    render(<ProtocolConfiguratorView {...defaultProps} />);
    expect(screen.getByTestId('trigger-sections')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-custom-fields')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-consents')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-services')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-email')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<ProtocolConfiguratorView {...defaultProps} />);
    expect(screen.getByText('Zapisz')).toBeInTheDocument();
  });

  it('renders preview panel on desktop', () => {
    render(<ProtocolConfiguratorView {...defaultProps} />);
    expect(screen.getByTestId('protocol-preview')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<ProtocolConfiguratorView {...defaultProps} onBack={onBack} />);
    // Back button is the first button with ArrowLeft
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onBack).toHaveBeenCalled();
  });
});
