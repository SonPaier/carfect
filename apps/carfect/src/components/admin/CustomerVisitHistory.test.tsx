import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerVisitHistory } from './CustomerVisitHistory';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/usePricingMode', () => ({
  usePricingMode: () => 'brutto',
}));

const makeReservation = (overrides: Record<string, unknown> = {}) => ({
  id: 'res-1',
  reservation_date: '2026-03-15',
  start_time: '09:00:00',
  vehicle_plate: 'WA 12345',
  price: 250,
  price_netto: null,
  status: 'completed',
  service_ids: null,
  service_items: [{ service_id: 'svc-1', short_name: 'MP', name: 'Mycie Premium' }],
  admin_notes: null,
  started_at: null,
  completed_at: null,
  ...overrides,
});

describe('CustomerVisitHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMocks();
  });

  it('shows loading state initially', () => {
    mockSupabaseQuery('reservations', { data: [], error: null });
    render(
      <CustomerVisitHistory customerPhone="+48500100200" instanceId="inst-1" />,
    );
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
  });

  it('shows empty state when no visits exist', async () => {
    mockSupabaseQuery('reservations', { data: [], error: null });
    render(
      <CustomerVisitHistory customerPhone="+48500100200" instanceId="inst-1" />,
    );
    await waitFor(() => {
      expect(screen.getByText('Brak historii wizyt')).toBeInTheDocument();
    });
  });

  it('renders visit card with date, time, vehicle, service and price', async () => {
    mockSupabaseQuery('reservations', {
      data: [makeReservation()],
      error: null,
    });
    render(
      <CustomerVisitHistory customerPhone="+48500100200" instanceId="inst-1" />,
    );
    await waitFor(() => {
      expect(screen.getByText(/15 marca 2026/)).toBeInTheDocument();
    });
    expect(screen.getByText(/09:00/)).toBeInTheDocument();
    expect(screen.getByText('WA 12345')).toBeInTheDocument();
    expect(screen.getByText('MP')).toBeInTheDocument();
    expect(screen.getByText('250 zł')).toBeInTheDocument();
  });

  it('shows "Nieobecny" badge for no_show status', async () => {
    mockSupabaseQuery('reservations', {
      data: [makeReservation({ status: 'no_show' })],
      error: null,
    });
    render(
      <CustomerVisitHistory customerPhone="+48500100200" instanceId="inst-1" />,
    );
    await waitFor(() => {
      expect(screen.getByText('Nieobecny')).toBeInTheDocument();
    });
  });

  it('does not show "Nieobecny" for completed status', async () => {
    mockSupabaseQuery('reservations', {
      data: [makeReservation({ status: 'completed' })],
      error: null,
    });
    render(
      <CustomerVisitHistory customerPhone="+48500100200" instanceId="inst-1" />,
    );
    await waitFor(() => {
      expect(screen.getByText('WA 12345')).toBeInTheDocument();
    });
    expect(screen.queryByText('Nieobecny')).not.toBeInTheDocument();
  });

  it('shows admin notes when showNotes is true', async () => {
    mockSupabaseQuery('reservations', {
      data: [makeReservation({ admin_notes: 'Klient prosił o dodatkowe woskowanie' })],
      error: null,
    });
    render(
      <CustomerVisitHistory
        customerPhone="+48500100200"
        instanceId="inst-1"
        showNotes={true}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Klient prosił o dodatkowe woskowanie')).toBeInTheDocument();
    });
  });

  it('hides admin notes when showNotes is false (default)', async () => {
    mockSupabaseQuery('reservations', {
      data: [makeReservation({ admin_notes: 'Notatka ukryta' })],
      error: null,
    });
    render(
      <CustomerVisitHistory customerPhone="+48500100200" instanceId="inst-1" />,
    );
    await waitFor(() => {
      expect(screen.getByText('WA 12345')).toBeInTheDocument();
    });
    expect(screen.queryByText('Notatka ukryta')).not.toBeInTheDocument();
  });

  it('shows duration when showDuration is true and both timestamps exist', async () => {
    mockSupabaseQuery('reservations', {
      data: [
        makeReservation({
          started_at: '2026-03-15T09:00:00Z',
          completed_at: '2026-03-15T10:35:00Z',
        }),
      ],
      error: null,
    });
    render(
      <CustomerVisitHistory
        customerPhone="+48500100200"
        instanceId="inst-1"
        showDuration={true}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Czas wykonania: 1h 35min')).toBeInTheDocument();
    });
  });

  it('does not show duration when only started_at is set', async () => {
    mockSupabaseQuery('reservations', {
      data: [
        makeReservation({
          started_at: '2026-03-15T09:00:00Z',
          completed_at: null,
        }),
      ],
      error: null,
    });
    render(
      <CustomerVisitHistory
        customerPhone="+48500100200"
        instanceId="inst-1"
        showDuration={true}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('WA 12345')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Czas wykonania/)).not.toBeInTheDocument();
  });

  it('calls onOpenReservation when a visit card is clicked', async () => {
    const user = userEvent.setup();
    const onOpenReservation = vi.fn();
    mockSupabaseQuery('reservations', {
      data: [makeReservation({ id: 'res-clicked' })],
      error: null,
    });
    render(
      <CustomerVisitHistory
        customerPhone="+48500100200"
        instanceId="inst-1"
        onOpenReservation={onOpenReservation}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('WA 12345')).toBeInTheDocument();
    });
    await user.click(screen.getByText('WA 12345'));
    expect(onOpenReservation).toHaveBeenCalledWith('res-clicked');
  });

  it('renders multiple visits in order', async () => {
    mockSupabaseQuery('reservations', {
      data: [
        makeReservation({ id: 'res-1', reservation_date: '2026-03-15', vehicle_plate: 'BMW 1' }),
        makeReservation({ id: 'res-2', reservation_date: '2026-03-10', vehicle_plate: 'BMW 2' }),
      ],
      error: null,
    });
    render(
      <CustomerVisitHistory customerPhone="+48500100200" instanceId="inst-1" />,
    );
    await waitFor(() => {
      expect(screen.getByText('BMW 1')).toBeInTheDocument();
      expect(screen.getByText('BMW 2')).toBeInTheDocument();
    });
  });

  it('resolves service names from service_ids via unified_services lookup', async () => {
    mockSupabaseQuery('reservations', {
      data: [
        makeReservation({
          service_items: null,
          service_ids: ['svc-1', 'svc-2'],
        }),
      ],
      error: null,
    });
    mockSupabaseQuery('unified_services', {
      data: [
        { id: 'svc-1', name: 'Mycie', short_name: 'MYC' },
        { id: 'svc-2', name: 'Polerowanie', short_name: null },
      ],
      error: null,
    });
    render(
      <CustomerVisitHistory customerPhone="+48500100200" instanceId="inst-1" />,
    );
    await waitFor(() => {
      expect(screen.getByText('MYC, Polerowanie')).toBeInTheDocument();
    });
  });
});
