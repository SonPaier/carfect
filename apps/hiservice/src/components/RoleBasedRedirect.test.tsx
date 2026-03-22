import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

const mockSignOut = vi.fn();

let authMock = {
  user: null as { id: string } | null,
  roles: [] as { role: string; instance_id: string | null; hall_id: string | null }[],
  loading: false,
  signOut: mockSignOut,
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authMock,
}));

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

// Capture Navigate destinations
const navigatedTo: string[] = [];
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      navigatedTo.push(to);
      return <div data-testid="navigate" data-to={to} />;
    },
  };
});

import RoleBasedRedirect from './RoleBasedRedirect';

const renderComponent = () =>
  render(
    <MemoryRouter>
      <RoleBasedRedirect />
    </MemoryRouter>,
  );

describe('RoleBasedRedirect', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    navigatedTo.length = 0;
    mockSignOut.mockReset();
    authMock = {
      user: null,
      roles: [],
      loading: false,
      signOut: mockSignOut,
    };
  });

  it('shows loader when auth is loading', () => {
    authMock.loading = true;
    renderComponent();
    expect(screen.queryByTestId('navigate')).toBeNull();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /login when no user', () => {
    renderComponent();
    expect(navigatedTo).toContain('/login');
  });

  describe('employee-only user', () => {
    beforeEach(() => {
      authMock.user = { id: 'emp-user-id' };
      authMock.roles = [{ role: 'employee', instance_id: 'inst-1', hall_id: null }];
    });

    it('redirects to employee calendar when config exists', async () => {
      mockSupabaseQuery('employee_calendar_configs', {
        data: { id: 'config-123' },
        error: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(navigatedTo).toContain('/employee-calendars/config-123');
      });
    });

    it('shows no-config message instead of infinite loop when config not found', async () => {
      mockSupabaseQuery('employee_calendar_configs', {
        data: null,
        error: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('Brak przypisanego kalendarza. Skontaktuj się z administratorem.'),
        ).toBeInTheDocument();
      });
    });

    it('allows logout from no-config screen', async () => {
      const user = userEvent.setup();
      mockSupabaseQuery('employee_calendar_configs', {
        data: null,
        error: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Wyloguj')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Wyloguj'));
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('does not redirect to admin dashboard (regression: infinite loop)', async () => {
      mockSupabaseQuery('employee_calendar_configs', {
        data: null,
        error: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('Brak przypisanego kalendarza. Skontaktuj się z administratorem.'),
        ).toBeInTheDocument();
      });

      // Must NOT navigate to "/" or "/admin" which would cause infinite redirect loop
      expect(navigatedTo).not.toContain('/');
      expect(navigatedTo).not.toContain('/admin');
      expect(navigatedTo).not.toContain('/login');
    });
  });

  describe('employee with admin role', () => {
    it('does not fetch employee config and redirects as admin', () => {
      authMock.user = { id: 'admin-emp-user' };
      authMock.roles = [
        { role: 'employee', instance_id: 'inst-1', hall_id: null },
        { role: 'admin', instance_id: 'inst-1', hall_id: null },
      ];

      renderComponent();

      // Admin with employee role should go to admin dashboard, not employee calendar
      expect(navigatedTo.some((to) => to === '/' || to === '/admin')).toBe(true);
    });
  });

  describe('hall role', () => {
    it('redirects to hall view with hall_id', () => {
      authMock.user = { id: 'hall-user' };
      authMock.roles = [{ role: 'hall', instance_id: 'inst-1', hall_id: 'hall-42' }];

      renderComponent();
      expect(navigatedTo).toContain('/halls/hall-42');
    });

    it('redirects to /halls/1 when no hall_id', () => {
      authMock.user = { id: 'hall-user' };
      authMock.roles = [{ role: 'hall', instance_id: 'inst-1', hall_id: null }];

      renderComponent();
      expect(navigatedTo).toContain('/halls/1');
    });
  });

  describe('super_admin role', () => {
    it('redirects to /super-admin', () => {
      authMock.user = { id: 'sa-user' };
      authMock.roles = [{ role: 'super_admin', instance_id: null, hall_id: null }];

      renderComponent();
      expect(navigatedTo).toContain('/super-admin');
    });
  });

  describe('sales-only role', () => {
    it('redirects to /sales', () => {
      authMock.user = { id: 'sales-user' };
      authMock.roles = [{ role: 'sales', instance_id: 'inst-1', hall_id: null }];

      renderComponent();
      expect(navigatedTo).toContain('/sales');
    });
  });

  describe('admin role', () => {
    it('redirects to /admin on non-subdomain hostname', () => {
      authMock.user = { id: 'admin-user' };
      authMock.roles = [{ role: 'admin', instance_id: 'inst-1', hall_id: null }];

      renderComponent();
      expect(navigatedTo).toContain('/admin');
    });
  });
});
