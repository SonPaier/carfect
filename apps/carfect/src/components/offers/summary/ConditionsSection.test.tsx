import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { ConditionsSection } from './ConditionsSection';
import type { OfferState } from '@/hooks/useOfferTypes';
import type { ConditionTemplate } from '@/hooks/useConditionTemplates';

const mockByType = vi.fn().mockReturnValue([]);

vi.mock('@/hooks/useConditionTemplates', () => ({
  useConditionTemplates: () => ({
    templates: [],
    loading: false,
    byType: mockByType,
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    refetch: vi.fn(),
  }),
}));

const makeOffer = (overrides: Partial<OfferState> = {}): OfferState => ({
  instanceId: 'instance-1',
  customerData: {
    name: '',
    email: '',
    phone: '',
    company: '',
    nip: '',
    companyAddress: '',
    companyPostalCode: '',
    companyCity: '',
    notes: '',
    inquiryContent: '',
  },
  vehicleData: { brandModel: '', plate: '', paintColor: '', paintType: '' },
  selectedScopeIds: [],
  options: [],
  additions: [],
  vatRate: 23,
  hideUnitPrices: false,
  status: 'draft',
  validUntil: '2026-06-30',
  warranty: 'Warranty text',
  paymentTerms: 'Payment terms text',
  serviceInfo: 'Service info text',
  notes: 'Notes text',
  ...overrides,
});

const getTextareaRows = (value: string | undefined | null, minRows = 2) => {
  if (!value) return minRows;
  const lines = value.split('\n').length;
  return Math.max(minRows, lines);
};

const renderComponent = (
  offer: OfferState = makeOffer(),
  onUpdateOffer = vi.fn(),
) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ConditionsSection
        offer={offer}
        open={true}
        onOpenChange={vi.fn()}
        onUpdateOffer={onUpdateOffer}
        getTextareaRows={getTextareaRows}
      />
    </I18nextProvider>,
  );

describe('ConditionsSection', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockByType.mockReturnValue([]);
  });

  describe('renders all 5 fields', () => {
    it('renders validUntil date input', () => {
      renderComponent();
      expect(screen.getByLabelText(/oferta ważna do/i)).toBeInTheDocument();
    });

    it('renders warranty textarea', () => {
      renderComponent();
      expect(screen.getByLabelText(/gwarancja/i)).toBeInTheDocument();
    });

    it('renders paymentTerms textarea', () => {
      renderComponent();
      expect(screen.getByLabelText(/warunki płatności/i)).toBeInTheDocument();
    });

    it('renders serviceInfo textarea', () => {
      renderComponent();
      expect(screen.getByLabelText(/informacje o serwisie/i)).toBeInTheDocument();
    });

    it('renders notes textarea', () => {
      renderComponent();
      expect(screen.getByLabelText(/uwagi/i)).toBeInTheDocument();
    });
  });

  describe('shows current values from offer prop', () => {
    it('shows validUntil value', () => {
      renderComponent();
      const input = screen.getByLabelText(/oferta ważna do/i) as HTMLInputElement;
      expect(input.value).toBe('2026-06-30');
    });

    it('shows warranty value', () => {
      renderComponent();
      const textarea = screen.getByLabelText(/gwarancja/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Warranty text');
    });

    it('shows paymentTerms value', () => {
      renderComponent();
      const textarea = screen.getByLabelText(/warunki płatności/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Payment terms text');
    });

    it('shows serviceInfo value', () => {
      renderComponent();
      const textarea = screen.getByLabelText(/informacje o serwisie/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Service info text');
    });

    it('shows notes value', () => {
      renderComponent();
      const textarea = screen.getByLabelText(/uwagi/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Notes text');
    });

    it('shows empty string when field is undefined', () => {
      renderComponent(makeOffer({ warranty: undefined }));
      const textarea = screen.getByLabelText(/gwarancja/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });
  });

  describe('calls onUpdateOffer with correct key on change', () => {
    it('calls onUpdateOffer with validUntil when date input changes', async () => {
      const onUpdateOffer = vi.fn();
      renderComponent(makeOffer(), onUpdateOffer);
      const input = screen.getByLabelText(/oferta ważna do/i);
      await user.clear(input);
      await user.type(input, '2026-12-31');
      expect(onUpdateOffer).toHaveBeenCalledWith(
        expect.objectContaining({ validUntil: expect.any(String) }),
      );
    });

    it('calls onUpdateOffer with warranty key when warranty textarea changes', async () => {
      const onUpdateOffer = vi.fn();
      renderComponent(makeOffer({ warranty: '' }), onUpdateOffer);
      const textarea = screen.getByLabelText(/gwarancja/i);
      await user.type(textarea, 'New warranty');
      expect(onUpdateOffer).toHaveBeenCalledWith({ warranty: expect.stringContaining('N') });
    });

    it('calls onUpdateOffer with paymentTerms key when paymentTerms textarea changes', async () => {
      const onUpdateOffer = vi.fn();
      renderComponent(makeOffer({ paymentTerms: '' }), onUpdateOffer);
      const textarea = screen.getByLabelText(/warunki płatności/i);
      await user.type(textarea, 'New terms');
      expect(onUpdateOffer).toHaveBeenCalledWith({ paymentTerms: expect.stringContaining('N') });
    });

    it('calls onUpdateOffer with serviceInfo key when serviceInfo textarea changes', async () => {
      const onUpdateOffer = vi.fn();
      renderComponent(makeOffer({ serviceInfo: '' }), onUpdateOffer);
      const textarea = screen.getByLabelText(/informacje o serwisie/i);
      await user.type(textarea, 'Service details');
      expect(onUpdateOffer).toHaveBeenCalledWith({ serviceInfo: expect.stringContaining('S') });
    });

    it('calls onUpdateOffer with notes key when notes textarea changes', async () => {
      const onUpdateOffer = vi.fn();
      renderComponent(makeOffer({ notes: '' }), onUpdateOffer);
      const textarea = screen.getByLabelText(/uwagi/i);
      await user.type(textarea, 'A note');
      expect(onUpdateOffer).toHaveBeenCalledWith({ notes: expect.stringContaining('A') });
    });
  });

  describe('template picker', () => {
    const makeConditionTemplate = (overrides: Partial<ConditionTemplate> = {}): ConditionTemplate => ({
      id: 'tpl-1',
      instance_id: 'instance-1',
      template_type: 'warranty',
      name: 'Standard warranty',
      content: '12 months warranty',
      sort_order: 0,
      ...overrides,
    });

    it('renders template picker placeholder for each field when templates exist', () => {
      const templates = [makeConditionTemplate()];
      mockByType.mockReturnValue(templates);

      renderComponent();

      // TemplatePicker renders a SelectTrigger with "z szablonu" placeholder — one per field
      const pickers = screen.getAllByText('z szablonu');
      expect(pickers).toHaveLength(4);
    });

    it('does not render template picker when no templates exist', () => {
      // mockByType already returns [] from beforeEach
      renderComponent();

      expect(screen.queryByText('z szablonu')).not.toBeInTheDocument();
    });
  });

  describe('no Card or Collapsible wrapper elements', () => {
    it('does not render a Card element', () => {
      const { container } = renderComponent();
      // shadcn Card renders with data-slot="card" or class "rounded-xl border"
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeNull();
    });

    it('does not render a Collapsible element', () => {
      const { container } = renderComponent();
      // Collapsible renders with data-slot="collapsible"
      const collapsible = container.querySelector('[data-slot="collapsible"]');
      expect(collapsible).toBeNull();
    });

    it('renders as a plain div without card-like border classes', () => {
      const { container } = renderComponent();
      const root = container.firstChild as HTMLElement;
      expect(root.tagName).toBe('DIV');
      expect(root.className).not.toContain('border');
      expect(root.className).not.toContain('card');
    });
  });
});
