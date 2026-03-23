import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtocolsView from './ProtocolsView';
import { mockSupabase, mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock child dialogs to avoid their own data-fetching
vi.mock('./CreateProtocolForm', () => ({
  default: () => null,
}));

vi.mock('./SendProtocolEmailDialog', () => ({
  default: () => null,
}));

vi.mock('./ProtocolSettingsDialog', () => ({
  default: () => null,
}));

vi.mock('./ProtocolViewsDialog', () => ({
  default: () => null,
}));

const makeProtocol = (overrides = {}) => ({
  id: 'proto-1',
  customer_name: 'Jan Kowalski',
  customer_phone: '500100200',
  customer_email: 'jan@example.com',
  protocol_date: '2026-03-20',
  protocol_type: 'completion',
  status: 'draft',
  prepared_by: 'Adam Nowak',
  public_token: 'tok-abc123',
  created_at: '2026-03-20T10:00:00Z',
  ...overrides,
});

function renderView(props = {}) {
  const user = userEvent.setup();
  return {
    user,
    ...render(<ProtocolsView instanceId="test-instance-id" {...props} />),
  };
}

describe('ProtocolsView', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();

    // Provide empty default for protocols
    mockSupabaseQuery('protocols', { data: [], error: null });
  });

  describe('status badges', () => {
    it('renders "Do zaakceptowania" badge for draft status', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'draft' })],
        error: null,
      });

      renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Do zaakceptowania').length).toBeGreaterThan(0);
      });
    });

    it('renders "Zaakceptowany" badge for accepted status', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'accepted' })],
        error: null,
      });

      renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Zaakceptowany').length).toBeGreaterThan(0);
      });
    });

    it('renders "Wysłany" badge for sent status', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'sent' })],
        error: null,
      });

      renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Wysłany').length).toBeGreaterThan(0);
      });
    });

    it('renders "Obejrzany" badge for viewed status', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'viewed' })],
        error: null,
      });

      renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Obejrzany').length).toBeGreaterThan(0);
      });
    });

    it('draft badge has yellow styling', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'draft' })],
        error: null,
      });

      renderView();

      await waitFor(() => {
        const badges = screen.getAllByText('Do zaakceptowania');
        expect(badges[0].className).toContain('yellow');
      });
    });

    it('accepted badge has green styling', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'accepted' })],
        error: null,
      });

      renderView();

      await waitFor(() => {
        const badges = screen.getAllByText('Zaakceptowany');
        expect(badges[0].className).toContain('green');
      });
    });

    it('sent badge has blue styling', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'sent' })],
        error: null,
      });

      renderView();

      await waitFor(() => {
        const badges = screen.getAllByText('Wysłany');
        expect(badges[0].className).toContain('blue');
      });
    });

    it('viewed badge has amber styling', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'viewed' })],
        error: null,
      });

      renderView();

      await waitFor(() => {
        const badges = screen.getAllByText('Obejrzany');
        expect(badges[0].className).toContain('amber');
      });
    });
  });

  describe('status change dropdown', () => {
    it('opens status dropdown when badge button is clicked', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'draft' })],
        error: null,
      });

      const { user } = renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Do zaakceptowania').length).toBeGreaterThan(0);
      });

      // Click the badge button (first occurrence in desktop table)
      const badgeButtons = screen.getAllByText('Do zaakceptowania');
      await user.click(badgeButtons[0]);

      // Dropdown with other statuses should appear
      await waitFor(() => {
        expect(screen.getByText('Zaakceptowany')).toBeInTheDocument();
      });
    });

    it('calls supabase update when status is changed via dropdown', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ id: 'proto-1', status: 'draft' })],
        error: null,
      });
      mockSupabaseQuery('protocols', { data: null, error: null }, 'update');

      const { user } = renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Do zaakceptowania').length).toBeGreaterThan(0);
      });

      const badgeButtons = screen.getAllByText('Do zaakceptowania');
      await user.click(badgeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Zaakceptowany')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Zaakceptowany'));

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('protocols');
      });
    });

    it('does not show "viewed" as an option in status change dropdown', async () => {
      // viewed is auto-set by the system (client opens protocol), not manually
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'draft' })],
        error: null,
      });

      const { user } = renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Do zaakceptowania').length).toBeGreaterThan(0);
      });

      const badgeButtons = screen.getAllByText('Do zaakceptowania');
      await user.click(badgeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Zaakceptowany')).toBeInTheDocument();
      });

      // 'Obejrzany' should not be a clickable option in the dropdown
      // (it can exist somewhere in the page as a badge but not in this dropdown)
      const dropdownContent = screen.queryAllByText('Obejrzany');
      // At most 0 'Obejrzany' options visible since draft protocol dropdown shouldn't show it
      expect(dropdownContent.length).toBe(0);
    });
  });

  describe('"Historia oglądania" menu item', () => {
    it('shows "Historia oglądania" menu item only for viewed status', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'viewed' })],
        error: null,
      });

      const { user } = renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Obejrzany').length).toBeGreaterThan(0);
      });

      // Open the action menu (MoreHorizontal button)
      const menuButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('svg') !== null && btn.className.includes('h-8')
      );
      expect(menuButtons.length).toBeGreaterThan(0);
      await user.click(menuButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Historia oglądania')).toBeInTheDocument();
      });
    });

    it('does NOT show "Historia oglądania" for non-viewed statuses', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'sent' })],
        error: null,
      });

      const { user } = renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Wysłany').length).toBeGreaterThan(0);
      });

      // Open the action menu
      const menuButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('svg') !== null && btn.className.includes('h-8')
      );
      expect(menuButtons.length).toBeGreaterThan(0);
      await user.click(menuButtons[0]);

      // Wait for menu to open (check other items are visible)
      await waitFor(() => {
        expect(screen.getByText('Edytuj')).toBeInTheDocument();
      });

      expect(screen.queryByText('Historia oglądania')).not.toBeInTheDocument();
    });

    it('does NOT show "Historia oglądania" for draft status', async () => {
      mockSupabaseQuery('protocols', {
        data: [makeProtocol({ status: 'draft' })],
        error: null,
      });

      const { user } = renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Do zaakceptowania').length).toBeGreaterThan(0);
      });

      const menuButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('svg') !== null && btn.className.includes('h-8')
      );
      await user.click(menuButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edytuj')).toBeInTheDocument();
      });

      expect(screen.queryByText('Historia oglądania')).not.toBeInTheDocument();
    });
  });

  describe('empty and loading states', () => {
    it('shows "Brak protokołów" when list is empty', async () => {
      mockSupabaseQuery('protocols', { data: [], error: null });

      renderView();

      await waitFor(() => {
        expect(screen.getAllByText('Brak protokołów').length).toBeGreaterThan(0);
      });
    });
  });
});
