import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CalendarItemDetailsDrawer from './CalendarItemDetailsDrawer';
import { resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/useInstanceFeatures', () => ({
  useInstanceFeature: () => ({ enabled: false, loading: false, toggle: vi.fn() }),
}));

vi.mock('@/hooks/useEmployees', () => ({
  useEmployees: () => ({ data: [], isLoading: false }),
}));

vi.mock('@shared/invoicing', () => ({
  CreateInvoiceDrawer: () => null,
  useInvoicingSettings: () => ({ data: null }),
}));

vi.mock('@/components/invoicing/InvoiceStatusBadge', () => ({
  InvoiceStatusBadge: () => null,
}));

vi.mock('@/components/invoicing/useInvoices', () => ({
  useInvoices: () => ({ data: [], isLoading: false }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const makeItem = (overrides = {}) => ({
  id: 'item-1',
  title: 'Naprawa pieca',
  item_date: '2026-03-19',
  start_time: '08:00',
  end_time: '16:00',
  status: 'confirmed',
  column_id: 'col-1',
  customer_name: 'Jan Kowalski',
  customer_phone: '500100200',
  customer_email: null,
  admin_notes: null,
  assigned_employee_ids: null,
  price: null,
  end_date: null,
  photo_urls: null,
  media_items: null,
  payment_status: 'not_invoiced',
  order_number: '1/03/2026',
  project_id: null,
  customer_id: null,
  customer_address_id: null,
  priority: null,
  ...overrides,
});

function renderDrawer(props = {}) {
  const user = userEvent.setup();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    user,
    ...render(
      <QueryClientProvider client={queryClient}>
        <CalendarItemDetailsDrawer
          item={makeItem() as any}
          open={true}
          onClose={vi.fn()}
          columns={[{ id: 'col-1', name: 'Serwis', color: '#000' }]}
          onStatusChange={vi.fn()}
          onStartWork={vi.fn()}
          onEndWork={vi.fn()}
          onFollowUpRequest={vi.fn()}
          {...props}
        />
      </QueryClientProvider>,
    ),
  };
}

describe('CalendarItemDetailsDrawer — admin status controls', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('shows split button with "Rozpocznij pracę" for confirmed items', async () => {
    renderDrawer({ item: makeItem({ status: 'confirmed' }) });

    await waitFor(() => {
      expect(screen.getByText('Rozpocznij pracę')).toBeInTheDocument();
    });
  });

  it('calls onStartWork when "Rozpocznij pracę" is clicked', async () => {
    const onStartWork = vi.fn();
    const { user } = renderDrawer({ item: makeItem({ status: 'confirmed' }), onStartWork });

    await user.click(await screen.findByText('Rozpocznij pracę'));
    expect(onStartWork).toHaveBeenCalledWith('item-1');
  });

  it('changes status via onStatusChange when dropdown option selected', async () => {
    const onStatusChange = vi.fn();
    const { user } = renderDrawer({
      item: makeItem({ status: 'completed' }),
      onStatusChange,
    });

    // Find the dropdown trigger button (not the badge)
    const trigger = await screen.findByRole('button', { name: /Zakończone/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Do wykonania')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Do wykonania'));
    expect(onStatusChange).toHaveBeenCalledWith('item-1', 'confirmed');
  });

  it('shows split button with "Zakończ pracę" for in_progress items', async () => {
    renderDrawer({ item: makeItem({ status: 'in_progress' }) });

    await waitFor(() => {
      expect(screen.getByText('Zakończ pracę')).toBeInTheDocument();
    });
  });

  it('opens end work dialog when "Zakończ pracę" clicked (employee view)', async () => {
    const { user } = renderDrawer({
      item: makeItem({ status: 'in_progress' }),
      isEmployee: true,
    });

    await user.click(await screen.findByText('Zakończ pracę'));

    await waitFor(() => {
      expect(screen.getByText('Zakończyłem pracę')).toBeInTheDocument();
      expect(screen.getByText('Potrzebny dodatkowy przyjazd')).toBeInTheDocument();
      expect(screen.getByText('Anuluj')).toBeInTheDocument();
    });
  });

  it('calls onEndWork from end work dialog', async () => {
    const onEndWork = vi.fn();
    const { user } = renderDrawer({
      item: makeItem({ status: 'in_progress' }),
      isEmployee: true,
      onEndWork,
    });

    await user.click(await screen.findByText('Zakończ pracę'));
    await user.click(await screen.findByText('Zakończyłem pracę'));
    expect(onEndWork).toHaveBeenCalledWith('item-1');
  });

  it('calls onFollowUpRequest from end work dialog', async () => {
    const onFollowUpRequest = vi.fn();
    const item = makeItem({ status: 'in_progress' });
    const { user } = renderDrawer({
      item,
      isEmployee: true,
      onFollowUpRequest,
    });

    await user.click(await screen.findByText('Zakończ pracę'));
    await user.click(await screen.findByText('Potrzebny dodatkowy przyjazd'));
    expect(onFollowUpRequest).toHaveBeenCalledWith(item);
  });

  it('shows status dropdown with current label for completed items', async () => {
    renderDrawer({ item: makeItem({ status: 'completed' }) });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Zakończone/i })).toBeInTheDocument();
    });
  });

  it('renders checklist items when item has checklist_items', async () => {
    renderDrawer({
      item: makeItem({
        checklist_items: [
          { id: '1', text: 'Sprawdź ciśnienie', checked: true },
          { id: '2', text: 'Wymień filtr', checked: false },
        ],
      }),
    });

    await waitFor(() => {
      expect(screen.getByText('Sprawdź ciśnienie')).toBeInTheDocument();
      expect(screen.getByText('Wymień filtr')).toBeInTheDocument();
    });
  });

  it('shows "Dodaj zadanie" button when checklist is empty', async () => {
    renderDrawer({ item: makeItem({ checklist_items: [] }) });

    await waitFor(() => {
      expect(screen.getByText('Dodaj zadanie')).toBeInTheDocument();
    });
  });

  it('shows "Dodaj zadanie" button when checklist_items is null', async () => {
    renderDrawer({ item: makeItem({ checklist_items: null }) });

    await waitFor(() => {
      expect(screen.getByText('Dodaj zadanie')).toBeInTheDocument();
    });
  });
});
