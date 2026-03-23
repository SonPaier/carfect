import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WidgetSettingsTab } from './WidgetSettingsTab';

// ---- Supabase mock ----
const mockFrom = vi.fn();
const mockUpdate = vi.fn();

const createChain = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'is',
    'order',
    'single',
    'insert',
    'update',
    'delete',
    'match',
  ];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

// Stub heavy child components
vi.mock('./EmbedLeadFormPreview', () => ({
  default: () => <div data-testid="embed-preview">Preview</div>,
}));

vi.mock('./WidgetBrandingSettings', () => ({
  WidgetBrandingSettings: () => <div data-testid="widget-branding">BrandingSettings</div>,
}));

vi.mock('../services/ScopeProductSelectionDrawer', () => ({
  ScopeProductSelectionDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="extras-drawer">ExtrasDrawer</div> : null,
}));

vi.mock('@shared/utils', async () => {
  const actual = await vi.importActual('@shared/utils');
  return {
    ...actual,
    DEFAULT_BRANDING: {
      offer_bg_color: '#f8fafc',
      offer_section_bg_color: '#ffffff',
      offer_section_text_color: '#1e293b',
      offer_primary_color: '#2563eb',
    },
    DEFAULT_WIDGET_BRANDING: {
      widget_bg_color: '#f8fafc',
      widget_section_bg_color: '#ffffff',
      widget_section_text_color: '#1e293b',
      widget_primary_color: '#2563eb',
    },
  };
});

// ---- Sample data ----
const mockInstance = {
  slug: 'teststudio',
  widget_config: {
    visible_templates: [],
    extras: [],
  },
  offer_branding_enabled: false,
  offer_bg_color: null,
  offer_section_bg_color: null,
  offer_section_text_color: null,
  offer_primary_color: null,
  widget_branding_enabled: false,
  widget_bg_color: null,
  widget_section_bg_color: null,
  widget_section_text_color: null,
  widget_primary_color: null,
};

const mockTemplates = [
  {
    id: 'tpl-1',
    name: 'Ceramika Premium',
    short_name: 'CER',
    description: null,
    price_from: 2000,
  },
  {
    id: 'tpl-2',
    name: 'PPF Folia',
    short_name: 'PPF',
    description: null,
    price_from: 3500,
  },
];

const defaultProps = {
  instanceId: 'inst-1',
  instanceSlug: 'teststudio',
  onChange: vi.fn(),
};

describe('WidgetSettingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: instance, templates, no scope products, no services, no categories
    mockFrom.mockImplementation((table: string) => {
      if (table === 'instances') {
        return createChain(mockInstance);
      }
      if (table === 'offer_scopes') {
        return createChain(mockTemplates);
      }
      if (table === 'offer_scope_products') {
        return createChain([]);
      }
      if (table === 'unified_services') {
        return createChain([]);
      }
      if (table === 'unified_categories') {
        return createChain([]);
      }
      return createChain([]);
    });

    // Mock update for auto-save
    mockUpdate.mockResolvedValue({ data: null, error: null });
  });

  it('renders template list after loading', async () => {
    render(<WidgetSettingsTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Ceramika Premium')).toBeInTheDocument();
    });

    expect(screen.getByText('PPF Folia')).toBeInTheDocument();
  });

  it('toggles template visibility when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<WidgetSettingsTab {...defaultProps} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByText('Ceramika Premium')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    // Initially all unchecked (visible_templates: [])
    expect(checkboxes[0]).not.toBeChecked();

    await user.click(checkboxes[0]);

    // After click the checkbox becomes checked
    expect(checkboxes[0]).toBeChecked();
    // onChange callback was called
    expect(onChange).toHaveBeenCalled();
  });

  it('shows embed URL containing the instance slug', async () => {
    render(<WidgetSettingsTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Ceramika Premium')).toBeInTheDocument();
    });

    // The embed URL is rendered in a <code> element
    const embedUrlEl = document.querySelector('code');
    expect(embedUrlEl).toBeInTheDocument();
    expect(embedUrlEl!.textContent).toContain('teststudio.carfect.pl/embed');
  });

  it('copies iframe code to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();

    // Mock clipboard — must use defineProperty because navigator.clipboard is getter-only
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<WidgetSettingsTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Ceramika Premium')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Kopiuj kod iframe/i }));

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('teststudio.carfect.pl/embed'),
    );

    // Button text changes to "Skopiowano" after copy
    await waitFor(() => {
      expect(screen.getByText(/Skopiowano/)).toBeInTheDocument();
    });

    expect(mockToast.success).toHaveBeenCalledWith('Kod skopiowany');
  });
});
