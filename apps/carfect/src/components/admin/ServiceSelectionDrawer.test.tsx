import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import ServiceSelectionDrawer from './ServiceSelectionDrawer';
import { resetSupabaseMocks, mockSupabaseQuery } from '@/test/mocks/supabase';

// ----- Module Mocks -----

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/usePricingMode', () => ({
  usePricingMode: () => 'brutto',
}));

vi.mock('@/utils/pricing', () => ({
  getServiceDisplayPrice: () => 100,
}));

const mockOnSaved = vi.fn();
vi.mock('@/components/admin/ServiceFormDialog', () => ({
  ServiceFormDialog: ({ open, initialName, defaultCategoryId, onSaved }: { open: boolean; initialName?: string; defaultCategoryId?: string; onSaved?: () => void }) => {
    // Store onSaved so tests can trigger it
    if (onSaved) mockOnSaved.mockImplementation(onSaved);
    return open ? (
      <div
        data-testid="service-form-dialog"
        data-initial-name={initialName || ''}
        data-default-category-id={defaultCategoryId || ''}
      >
        <button data-testid="mock-save-button" onClick={onSaved}>Save</button>
      </div>
    ) : null;
  },
}));

// ----- Mock Data -----

const mockServices = [
  {
    id: 'svc-1',
    name: 'Mycie podstawowe',
    short_name: 'MP',
    category_id: 'cat-1',
    duration_minutes: 30,
    duration_small: 25,
    duration_medium: 30,
    duration_large: 40,
    price_from: 50,
    price_small: 40,
    price_medium: 50,
    price_large: 70,
    sort_order: 1,
    station_type: 'washing',
    service_type: 'both',
    visibility: 'everywhere',
  },
  {
    id: 'svc-2',
    name: 'Mycie premium',
    short_name: 'MPREM',
    category_id: 'cat-1',
    duration_minutes: 60,
    duration_small: 50,
    duration_medium: 60,
    duration_large: 80,
    price_from: 100,
    price_small: 80,
    price_medium: 100,
    price_large: 130,
    sort_order: 2,
    station_type: 'washing',
    service_type: 'both',
    visibility: 'everywhere',
  },
];

const mockCategories = [
  {
    id: 'cat-1',
    name: 'Myjnia',
    sort_order: 1,
    prices_are_net: false,
  },
];

// ----- Default Props -----

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  instanceId: 'test-instance',
  carSize: 'medium' as const,
  selectedServiceIds: [],
  onConfirm: vi.fn(),
  hasUnifiedServices: true,
};

// ----- Render Helper -----

const renderDrawer = (props: Partial<typeof defaultProps> = {}) => {
  const user = userEvent.setup();

  const result = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ServiceSelectionDrawer {...defaultProps} {...props} />
      </MemoryRouter>
    </I18nextProvider>,
  );

  return { ...result, user };
};

// ----- Tests -----

describe('ServiceSelectionDrawer', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();

    // Default: return services and categories
    mockSupabaseQuery('unified_services', { data: mockServices, error: null });
    mockSupabaseQuery('unified_categories', { data: mockCategories, error: null });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Empty state when no services', () => {
    it('shows EmptyState with "Brak usług" and "Dodaj nową usługę" button when services list is empty', async () => {
      mockSupabaseQuery('unified_services', { data: [], error: null });
      mockSupabaseQuery('unified_categories', { data: [], error: null });

      renderDrawer();

      await waitFor(() => {
        expect(screen.getByText('Brak usług')).toBeInTheDocument();
      });

      expect(screen.getAllByText('Dodaj nową usługę').length).toBeGreaterThan(0);
    });
  });

  describe('Search no-match empty state', () => {
    it('shows EmptyState with "Nie znaleziono usługi" and "Dodaj usługę" button when search has no matches', async () => {
      renderDrawer();

      // Wait for services to load
      await waitFor(() => {
        expect(screen.getByText('Myjnia')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/wpisz skrót/i);
      await user.type(searchInput, 'XXXXNOTEXIST');

      await waitFor(() => {
        expect(screen.getByText('Nie znaleziono usługi')).toBeInTheDocument();
      });

      expect(screen.getByText('Dodaj usługę')).toBeInTheDocument();
    });
  });

  describe('Footer "Dodaj nową usługę" button', () => {
    it('renders the footer "Dodaj nową usługę" button', async () => {
      renderDrawer();

      await waitFor(() => {
        // There may be multiple "Dodaj nową usługę" buttons (footer + empty state)
        // The footer one is always present
        const buttons = screen.getAllByRole('button', { name: /Dodaj nową usługę/i });
        expect(buttons.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Clicking "Dodaj usługę" from search empty state opens ServiceFormDialog', () => {
    it('opens ServiceFormDialog when "Dodaj usługę" button in search empty state is clicked', async () => {
      renderDrawer();

      // Wait for services to load
      await waitFor(() => {
        expect(screen.getByText('Myjnia')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/wpisz skrót/i);
      await user.type(searchInput, 'XXXXNOTEXIST');

      await waitFor(() => {
        expect(screen.getByText('Nie znaleziono usługi')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /Dodaj usługę/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('service-form-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('State reset on drawer reopen', () => {
    it('resets addServiceOpen to false when drawer is closed and reopened', async () => {
      const { rerender } = renderDrawer();

      // Wait for services to load
      await waitFor(() => {
        expect(screen.getByText('Myjnia')).toBeInTheDocument();
      });

      const user = userEvent.setup();

      // Open ServiceFormDialog via footer button
      const footerAddButton = screen.getAllByRole('button', { name: /Dodaj nową usługę/i })[0];
      await user.click(footerAddButton);

      await waitFor(() => {
        expect(screen.getByTestId('service-form-dialog')).toBeInTheDocument();
      });

      // Close the drawer (open=false)
      rerender(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <ServiceSelectionDrawer {...defaultProps} open={false} />
          </MemoryRouter>
        </I18nextProvider>,
      );

      // Reopen the drawer (open=true)
      rerender(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <ServiceSelectionDrawer {...defaultProps} open={true} />
          </MemoryRouter>
        </I18nextProvider>,
      );

      // ServiceFormDialog should not be visible after reopen
      await waitFor(() => {
        expect(screen.queryByTestId('service-form-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search chips match only by short_name', () => {
    it('shows matching chip when searching by exact short_name', async () => {
      renderDrawer();

      await waitFor(() => {
        expect(screen.getByText('Myjnia')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/wpisz skrót/i);
      await user.type(searchInput, 'MP');

      await waitFor(() => {
        expect(screen.getByText('Pasujące')).toBeInTheDocument();
      });
    });

    it('does NOT show matching chip when search matches only service name (not short_name)', async () => {
      renderDrawer();

      await waitFor(() => {
        expect(screen.getByText('Myjnia')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/wpisz skrót/i);
      // "podstawowe" matches service name but not short_name
      await user.type(searchInput, 'podstawowe');

      // Should NOT show chip, but the service should still appear in the category list
      await waitFor(() => {
        expect(screen.getByText('Mycie podstawowe')).toBeInTheDocument();
      });
      // No "Pasujące" section should appear
      expect(screen.queryByText('Pasujące')).not.toBeInTheDocument();
    });
  });

  describe('Services without category', () => {
    it('shows uncategorized services in "Inne" section', async () => {
      const uncategorizedService = {
        id: 'svc-no-cat',
        name: 'Usługa bez kategorii',
        short_name: 'NOCAT',
        category_id: null,
        duration_minutes: 30,
        duration_small: null,
        duration_medium: null,
        duration_large: null,
        price_from: 50,
        price_small: null,
        price_medium: null,
        price_large: null,
        sort_order: 10,
        station_type: 'washing',
        service_type: 'both',
        visibility: 'everywhere',
      };

      mockSupabaseQuery('unified_services', {
        data: [...mockServices, uncategorizedService],
        error: null,
      });

      renderDrawer();

      await waitFor(() => {
        expect(screen.getByText('Usługa bez kategorii')).toBeInTheDocument();
      });

      expect(screen.getByText('Inne')).toBeInTheDocument();
    });
  });

  describe('ServiceFormDialog receives initialName from search query', () => {
    it('passes search query as initialName when opening from search empty state', async () => {
      renderDrawer();

      await waitFor(() => {
        expect(screen.getByText('Myjnia')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/wpisz skrót/i);
      await user.type(searchInput, 'Nowa usługa');

      await waitFor(() => {
        expect(screen.getByText('Nie znaleziono usługi')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /Dodaj usługę/i });
      await user.click(addButton);

      await waitFor(() => {
        const dialog = screen.getByTestId('service-form-dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('data-initial-name', 'Nowa usługa');
      });
    });
  });

  describe('ServiceFormDialog receives defaultCategoryId', () => {
    it('passes first category id as defaultCategoryId', async () => {
      renderDrawer();

      await waitFor(() => {
        expect(screen.getByText('Myjnia')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      // Open dialog via footer button
      const footerButton = screen.getAllByRole('button', { name: /Dodaj nową usługę/i })[0];
      await user.click(footerButton);

      await waitFor(() => {
        const dialog = screen.getByTestId('service-form-dialog');
        expect(dialog).toHaveAttribute('data-default-category-id', 'cat-1');
      });
    });
  });

  describe('Service list rendering', () => {
    it('renders services grouped by category', async () => {
      renderDrawer();

      await waitFor(() => {
        expect(screen.getByText('Myjnia')).toBeInTheDocument();
      });

      expect(screen.getByText('Mycie podstawowe')).toBeInTheDocument();
      expect(screen.getByText('Mycie premium')).toBeInTheDocument();
    });

    it('shows loading spinner initially', () => {
      renderDrawer();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });

  describe('Service selection', () => {
    it('selects a service when clicked', async () => {
      renderDrawer();

      await waitFor(() => {
        expect(screen.getByText('Mycie podstawowe')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('Mycie podstawowe'));

      // Confirm button should be enabled after selection
      const confirmButton = screen.getByRole('button', { name: /Zatwierdź/i });
      expect(confirmButton).not.toBeDisabled();
    });

    it('confirm button is disabled when no services selected', async () => {
      renderDrawer();

      await waitFor(() => {
        expect(screen.getByText('Mycie podstawowe')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Zatwierdź/i });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Search filtering in category list', () => {
    it('filters services in category list by full search phrase', async () => {
      renderDrawer();

      await waitFor(() => {
        expect(screen.getByText('Mycie podstawowe')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/wpisz skrót/i);
      await user.type(searchInput, 'premium');

      await waitFor(() => {
        expect(screen.getByText('Mycie premium')).toBeInTheDocument();
      });

      expect(screen.queryByText('Mycie podstawowe')).not.toBeInTheDocument();
    });
  });

  describe('Drawer closed state', () => {
    it('does not fetch data when drawer is closed', async () => {
      renderDrawer({ open: false });

      // Should not show any services or loading state
      expect(screen.queryByText('Myjnia')).not.toBeInTheDocument();
      expect(screen.queryByText('Mycie podstawowe')).not.toBeInTheDocument();
    });
  });
});
