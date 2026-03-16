import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ServicesView from './ServicesView';
import { mockSupabase, mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/admin/uslugi', search: '', hash: '' }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockServices = [
  {
    id: 'svc-1',
    name: 'Wymiana opon',
    short_name: 'OPN',
    description: null,
    duration_minutes: 30,
    price: 100,
    prices_are_net: true,
    category_id: null,
    active: true,
    sort_order: 0,
    is_popular: false,
    unit: 'szt',
  },
  {
    id: 'svc-2',
    name: 'Mycie ręczne',
    short_name: 'MYC',
    description: null,
    duration_minutes: 60,
    price: 80,
    prices_are_net: true,
    category_id: null,
    active: true,
    sort_order: 1,
    is_popular: false,
    unit: 'szt',
  },
  {
    id: 'svc-3',
    name: 'Polerowanie',
    short_name: 'POL',
    description: null,
    duration_minutes: 120,
    price: 250,
    prices_are_net: true,
    category_id: null,
    active: true,
    sort_order: 2,
    is_popular: false,
    unit: 'szt',
  },
];

function renderView() {
  const user = userEvent.setup();
  const result = render(<ServicesView instanceId="test-instance-id" />);
  return { user, ...result };
}

describe('ServicesView – delete/deactivate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMocks();

    mockSupabaseQuery('unified_services', { data: mockServices, error: null });
    mockSupabaseQuery('unified_categories', { data: [], error: null });
    mockSupabaseQuery('unified_services', { data: null, error: null }, 'delete');
    mockSupabaseQuery('unified_services', { data: null, error: null }, 'update');
    mockSupabaseQuery('calendar_items', { data: null, error: null });
  });

  async function waitForServicesLoaded() {
    await waitFor(() => {
      expect(screen.getByText('Wymiana opon')).toBeInTheDocument();
    });
  }

  async function openServiceFormAndDelete(
    user: ReturnType<typeof userEvent.setup>,
    serviceName: string,
  ) {
    await user.click(screen.getByText(serviceName));

    const deleteButton = await waitFor(() => {
      return screen.getByRole('button', { name: /usuń/i });
    });
    await user.click(deleteButton);

    const confirmButton = await waitFor(() => {
      return screen.getByRole('button', { name: 'Usuń' });
    });
    await user.click(confirmButton);
  }

  it('renders all services on load', async () => {
    renderView();
    await waitForServicesLoaded();

    expect(screen.getByText('Wymiana opon')).toBeInTheDocument();
    expect(screen.getByText('Mycie ręczne')).toBeInTheDocument();
    expect(screen.getByText('Polerowanie')).toBeInTheDocument();
  });

  it('removes the correct service from list after delete (regression: not the last one)', async () => {
    const { user } = renderView();
    await waitForServicesLoaded();

    await openServiceFormAndDelete(user, 'Mycie ręczne');

    await waitFor(() => {
      expect(screen.queryByText('Mycie ręczne')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Wymiana opon')).toBeInTheDocument();
    expect(screen.getByText('Polerowanie')).toBeInTheDocument();
  });

  it('shows error toast when delete fails', async () => {
    const { toast } = await import('sonner');
    mockSupabaseQuery('unified_services', { data: null, error: { message: 'DB error' } }, 'delete');

    const { user } = renderView();
    await waitForServicesLoaded();

    await openServiceFormAndDelete(user, 'Wymiana opon');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Błąd usuwania usługi');
    });
  });

  it('deleting first service keeps all others intact', async () => {
    const { user } = renderView();
    await waitForServicesLoaded();

    await openServiceFormAndDelete(user, 'Wymiana opon');

    await waitFor(() => {
      expect(screen.queryByText('Wymiana opon')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Mycie ręczne')).toBeInTheDocument();
    expect(screen.getByText('Polerowanie')).toBeInTheDocument();
  });

  it('deleting last service keeps all others intact', async () => {
    const { user } = renderView();
    await waitForServicesLoaded();

    await openServiceFormAndDelete(user, 'Polerowanie');

    await waitFor(() => {
      expect(screen.queryByText('Polerowanie')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Wymiana opon')).toBeInTheDocument();
    expect(screen.getByText('Mycie ręczne')).toBeInTheDocument();
  });
});
