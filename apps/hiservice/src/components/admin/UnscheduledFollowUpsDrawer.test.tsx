import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UnscheduledFollowUpsDrawer from './UnscheduledFollowUpsDrawer';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

function renderDrawer(props = {}) {
  const user = userEvent.setup();
  return {
    user,
    ...render(
      <UnscheduledFollowUpsDrawer
        open={true}
        onClose={vi.fn()}
        instanceId="test-instance-id"
        onItemClick={vi.fn()}
        {...props}
      />,
    ),
  };
}

describe('UnscheduledFollowUpsDrawer', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('shows empty state when no follow-ups', async () => {
    mockSupabaseQuery('calendar_items', { data: [], error: null });
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Brak zleceń do dokończenia')).toBeInTheDocument();
    });
  });

  it('renders follow-up items with notes visible', async () => {
    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Ponowna wizyta — Naprawa pieca',
          customer_name: 'Jan Kowalski',
          customer_phone: '500100200',
          admin_notes: 'Brakuje zaworu ciśnieniowego',
          created_at: '2026-03-19T10:00:00Z',
          parent_item_id: 'original-1',
          customer_addresses: { city: 'Warszawa', street: 'Marszałkowska 1', name: null },
        },
      ],
      error: null,
    });

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Ponowna wizyta — Naprawa pieca')).toBeInTheDocument();
    });
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    expect(screen.getByText('Brakuje zaworu ciśnieniowego')).toBeInTheDocument();
  });

  it('calls onItemClick and closes on card click', async () => {
    const onItemClick = vi.fn();
    const onClose = vi.fn();

    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Follow-up task',
          customer_name: null,
          customer_phone: null,
          admin_notes: null,
          created_at: '2026-03-19T10:00:00Z',
          parent_item_id: 'original-1',
          customer_addresses: null,
        },
      ],
      error: null,
    });

    const { user } = renderDrawer({ onItemClick, onClose });

    await waitFor(() => {
      expect(screen.getByText('Follow-up task')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Follow-up task'));
    expect(onItemClick).toHaveBeenCalledWith('fu-1');
    expect(onClose).toHaveBeenCalled();
  });
});
