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
        onAddClick={vi.fn()}
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

  it('renders without a modal overlay (non-modal sheet)', async () => {
    // Sheet has modal={false} — this means no overlay is rendered and user can
    // interact with content behind the drawer. Verify: no role="dialog" with
    // aria-modal="true", and the drawer content is accessible.
    mockSupabaseQuery('calendar_items', { data: [], error: null });
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Do wykonania')).toBeInTheDocument();
    });

    // When modal=false, shadcn Sheet does not render an overlay element
    // The dialog/region should exist but must NOT have aria-modal="true"
    const dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach((dialog) => {
      expect(dialog.getAttribute('aria-modal')).not.toBe('true');
    });
  });

  it('shows title "Do wykonania"', async () => {
    mockSupabaseQuery('calendar_items', { data: [], error: null });
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Do wykonania')).toBeInTheDocument();
    });
  });

  it('shows "Dodaj" primary button next to title', async () => {
    mockSupabaseQuery('calendar_items', { data: [], error: null });
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Do wykonania')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Dodaj/i });
    expect(addButton).toBeInTheDocument();
  });

  it('calls onAddClick when "Dodaj" button is clicked', async () => {
    const onAddClick = vi.fn();
    mockSupabaseQuery('calendar_items', { data: [], error: null });
    const { user } = renderDrawer({ onAddClick });

    await waitFor(() => {
      expect(screen.getByText('Do wykonania')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Dodaj/i }));
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no follow-ups', async () => {
    mockSupabaseQuery('calendar_items', { data: [], error: null });
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Brak zleceń do wykonania')).toBeInTheDocument();
    });
  });

  it('renders follow-up item cards with title and customer name', async () => {
    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Ponowna wizyta — Naprawa pieca',
          customer_name: 'Jan Kowalski',
          customer_phone: '500100200',
          admin_notes: null,
          created_at: '2026-03-19T10:00:00Z',
          created_by: null,
          parent_item_id: 'original-1',
          customer_addresses: null,
        },
      ],
      error: null,
    });

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Ponowna wizyta — Naprawa pieca')).toBeInTheDocument();
    });
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
  });

  it('shows delete (trash) button on each card', async () => {
    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Zlecenie testowe',
          customer_name: null,
          customer_phone: null,
          admin_notes: null,
          created_at: '2026-03-19T10:00:00Z',
          created_by: null,
          parent_item_id: null,
          customer_addresses: null,
        },
      ],
      error: null,
    });

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Zlecenie testowe')).toBeInTheDocument();
    });

    // The trash icon button should be present on the card
    // It is a button with Trash2 icon — check via lucide svg or button count
    const buttons = screen.getAllByRole('button');
    // Should have: close X button + Dodaj button + trash button per card
    const trashButtons = buttons.filter(
      (btn) => btn.querySelector('svg') !== null && btn.className.includes('rounded-full'),
    );
    // At least one button that's the delete action (inside the card, not the close button)
    // The card trash button has class "rounded-full hover:bg-red-50"
    expect(buttons.some((btn) => btn.className.includes('hover:bg-red-50'))).toBe(true);
  });

  it('shows delete confirmation dialog when trash button is clicked', async () => {
    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Zlecenie do usunięcia',
          customer_name: null,
          customer_phone: null,
          admin_notes: null,
          created_at: '2026-03-19T10:00:00Z',
          created_by: null,
          parent_item_id: null,
          customer_addresses: null,
        },
      ],
      error: null,
    });

    const { user } = renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Zlecenie do usunięcia')).toBeInTheDocument();
    });

    // Click the trash/delete button on the card
    const trashButton = screen
      .getAllByRole('button')
      .find((btn) => btn.className.includes('hover:bg-red-50'));
    expect(trashButton).toBeDefined();
    await user.click(trashButton!);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Usunąć zlecenie?')).toBeInTheDocument();
    });
  });

  it('shows creator name on card when creator_name is available', async () => {
    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Zlecenie z twórcą',
          customer_name: null,
          customer_phone: null,
          admin_notes: null,
          created_at: '2026-03-19T10:00:00Z',
          created_by: 'user-uuid-1',
          parent_item_id: null,
          customer_addresses: null,
        },
      ],
      error: null,
    });
    mockSupabaseQuery('profiles', {
      data: [{ id: 'user-uuid-1', full_name: 'Anna Nowak' }],
      error: null,
    });

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Zlecenie z twórcą')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Anna Nowak/)).toBeInTheDocument();
    });
  });

  it('shows address custom name first, then street/city', async () => {
    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Zlecenie z adresem',
          customer_name: null,
          customer_phone: null,
          admin_notes: null,
          created_at: '2026-03-19T10:00:00Z',
          created_by: null,
          parent_item_id: null,
          customer_addresses: {
            name: 'Dom',
            street: 'ul. Kwiatowa 5',
            city: 'Kraków',
          },
        },
      ],
      error: null,
    });

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Zlecenie z adresem')).toBeInTheDocument();
    });

    // Address should show: "Dom — ul. Kwiatowa 5, Kraków"
    expect(screen.getByText('Dom — ul. Kwiatowa 5, Kraków')).toBeInTheDocument();
  });

  it('shows address street/city when custom name is null', async () => {
    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Zlecenie bez nazwy adresu',
          customer_name: null,
          customer_phone: null,
          admin_notes: null,
          created_at: '2026-03-19T10:00:00Z',
          created_by: null,
          parent_item_id: null,
          customer_addresses: {
            name: null,
            street: 'Marszałkowska 1',
            city: 'Warszawa',
          },
        },
      ],
      error: null,
    });

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Zlecenie bez nazwy adresu')).toBeInTheDocument();
    });

    expect(screen.getByText('Marszałkowska 1, Warszawa')).toBeInTheDocument();
  });

  it('displays notes as plain text without icons', async () => {
    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Zlecenie z notatkami',
          customer_name: null,
          customer_phone: null,
          admin_notes: 'Brakuje zaworu ciśnieniowego',
          created_at: '2026-03-19T10:00:00Z',
          created_by: null,
          parent_item_id: null,
          customer_addresses: null,
        },
      ],
      error: null,
    });

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Brakuje zaworu ciśnieniowego')).toBeInTheDocument();
    });

    // Notes displayed as plain text element, not inside a labeled section
    const noteEl = screen.getByText('Brakuje zaworu ciśnieniowego');
    expect(noteEl.tagName).not.toBe('LABEL');
    // No sibling icon elements — check the parent does not contain icon
    expect(noteEl.parentElement?.querySelector('svg')).toBeNull();
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
          created_by: null,
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
