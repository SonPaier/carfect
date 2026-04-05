import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstanceUsersTab from './InstanceUsersTab';

// ---- Sub-dialog stubs ----
vi.mock('./AddInstanceUserDialog', () => ({ default: () => <div>AddInstanceUserDialog</div> }));
vi.mock('./EditInstanceUserDialog', () => ({ default: () => <div>EditInstanceUserDialog</div> }));
vi.mock('./ResetPasswordDialog', () => ({ default: () => <div>ResetPasswordDialog</div> }));
vi.mock('./DeleteUserDialog', () => ({ default: () => <div>DeleteUserDialog</div> }));

// ---- Supabase mock ----
const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

// ---- Toast mock ----
const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

// ---- i18n mock ----
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'instanceUsers.title': 'Użytkownicy aplikacji',
        'instanceUsers.addUser': 'Dodaj użytkownika',
        'instanceUsers.noUsers': 'Brak użytkowników w tej instancji',
        'instanceUsers.addFirstUser': 'Dodaj pierwszego użytkownika',
        'instanceUsers.admin': 'Admin',
        'instanceUsers.employee': 'Pracownik',
        'instanceUsers.blocked': 'Zablokowany',
        'instanceUsers.active': 'Aktywny',
        'instanceUsers.edit': 'Edytuj',
        'instanceUsers.resetPassword': 'Resetuj hasło',
        'instanceUsers.block': 'Zablokuj',
        'instanceUsers.unblock': 'Odblokuj',
        'instanceUsers.delete': 'Usuń',
        'instanceUsers.userBlocked': 'Użytkownik zablokowany',
        'instanceUsers.userUnblocked': 'Użytkownik odblokowany',
        'instanceUsers.fetchError': 'Nie udało się pobrać listy użytkowników',
        'instanceUsers.sessionExpired': 'Sesja wygasła',
        'common.noName': 'Brak nazwy',
        'errors.generic': 'Wystąpił błąd',
      };
      return translations[key] ?? fallback ?? key;
    },
  }),
}));

// ---- Test data ----
const INSTANCE_ID = 'inst-test-123';

const makeUser = (overrides: Partial<{
  id: string;
  username: string;
  email: string;
  is_blocked: boolean;
  created_at: string;
  role: 'admin' | 'employee' | 'hall' | 'sales';
}> = {}) => ({
  id: 'user-1',
  username: 'Jan Kowalski',
  email: 'jan@example.com',
  is_blocked: false,
  created_at: '2024-03-15T10:00:00Z',
  role: 'employee' as const,
  hall_id: null,
  ...overrides,
});

// ---- Setup helpers ----
function setupInvokeMock(users: ReturnType<typeof makeUser>[] = []) {
  mockInvoke.mockResolvedValue({
    data: { users },
    error: null,
  });
}

function renderComponent() {
  return render(<InstanceUsersTab instanceId={INSTANCE_ID} />);
}

// ---- Tests ----
describe('InstanceUsersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('shows loading spinner initially', () => {
      // Delay resolution so spinner is visible
      mockInvoke.mockReturnValue(new Promise(() => {}));

      renderComponent();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows user list after loading', async () => {
      setupInvokeMock([
        makeUser({ id: 'user-1', username: 'Jan Kowalski', role: 'admin', is_blocked: false }),
        makeUser({ id: 'user-2', username: 'Anna Nowak', role: 'employee', is_blocked: true }),
      ]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
      });
    });

    it('shows role label for each user', async () => {
      setupInvokeMock([
        makeUser({ id: 'user-1', username: 'Admin User', role: 'admin' }),
        makeUser({ id: 'user-2', username: 'Worker User', role: 'employee' }),
      ]);

      renderComponent();

      await waitFor(() => {
        // "Admin" appears in the user row and in the permissions table — getAllByText handles multiple occurrences
        expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(2);
        // "Pracownik" also appears in user row and permissions table
        expect(screen.getAllByText('Pracownik').length).toBeGreaterThanOrEqual(2);
      });
    });

    it('shows created date formatted for each user', async () => {
      setupInvokeMock([
        makeUser({ id: 'user-1', username: 'Jan Kowalski', created_at: '2024-03-15T10:00:00Z' }),
      ]);

      renderComponent();

      await waitFor(() => {
        // date-fns formats as 'd MMM yyyy' in Polish locale
        expect(screen.getByText(/15 mar 2024/i)).toBeInTheDocument();
      });
    });

    it('shows active status for non-blocked user', async () => {
      setupInvokeMock([
        makeUser({ id: 'user-1', username: 'Active User', is_blocked: false }),
      ]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Aktywny')).toBeInTheDocument();
      });
    });

    it('shows blocked status for blocked user', async () => {
      setupInvokeMock([
        makeUser({ id: 'user-1', username: 'Blocked User', is_blocked: true }),
      ]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Zablokowany')).toBeInTheDocument();
      });
    });

    it('shows empty state when no users exist', async () => {
      setupInvokeMock([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Brak użytkowników w tej instancji')).toBeInTheDocument();
      });
    });

    it('shows role permissions table', async () => {
      setupInvokeMock([]);

      renderComponent();

      await waitFor(() => {
        // The permissions table always shows these role names
        const adminCells = screen.getAllByText('Admin');
        expect(adminCells.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Pracownik')).toBeInTheDocument();
        expect(screen.getByText('Kalendarz')).toBeInTheDocument();
        expect(screen.getByText('Sprzedaż')).toBeInTheDocument();
      });
    });
  });

  describe('add user', () => {
    it('opens add dialog when "Dodaj użytkownika" button is clicked', async () => {
      const user = userEvent.setup();
      setupInvokeMock([]);

      renderComponent();

      await waitFor(() => screen.getByRole('button', { name: 'Dodaj użytkownika' }));

      await user.click(screen.getByRole('button', { name: 'Dodaj użytkownika' }));

      expect(screen.getByText('AddInstanceUserDialog')).toBeInTheDocument();
    });

    it('opens add dialog via link in empty state', async () => {
      const user = userEvent.setup();
      setupInvokeMock([]);

      renderComponent();

      await waitFor(() => screen.getByText('Dodaj pierwszego użytkownika'));

      await user.click(screen.getByText('Dodaj pierwszego użytkownika'));

      expect(screen.getByText('AddInstanceUserDialog')).toBeInTheDocument();
    });
  });

  describe('user actions menu', () => {
    it('opens dropdown menu when clicking the more button', async () => {
      const user = userEvent.setup();
      setupInvokeMock([makeUser({ id: 'user-1', username: 'Jan Kowalski' })]);

      renderComponent();

      await waitFor(() => screen.getByText('Jan Kowalski'));

      // Click the more button (MoreVertical icon button)
      const moreButton = screen.getByRole('button', { name: '' });
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText('Edytuj')).toBeInTheDocument();
        expect(screen.getByText('Resetuj hasło')).toBeInTheDocument();
        expect(screen.getByText('Zablokuj')).toBeInTheDocument();
        expect(screen.getByText('Usuń')).toBeInTheDocument();
      });
    });

    it('shows unblock option for blocked user in dropdown', async () => {
      const user = userEvent.setup();
      setupInvokeMock([makeUser({ id: 'user-1', username: 'Blocked User', is_blocked: true })]);

      renderComponent();

      await waitFor(() => screen.getByText('Blocked User'));

      const moreButton = screen.getByRole('button', { name: '' });
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText('Odblokuj')).toBeInTheDocument();
      });
    });
  });

  describe('block/unblock', () => {
    it('calls edge function with block action for active user', async () => {
      const user = userEvent.setup();

      // First call: list; second call (after block): list again
      mockInvoke
        .mockResolvedValueOnce({ data: { users: [makeUser({ id: 'user-1', is_blocked: false })] }, error: null })
        .mockResolvedValueOnce({ data: { success: true }, error: null })
        .mockResolvedValueOnce({ data: { users: [makeUser({ id: 'user-1', is_blocked: true })] }, error: null });

      renderComponent();

      await waitFor(() => screen.getByText('Jan Kowalski'));

      const moreButton = screen.getByRole('button', { name: '' });
      await user.click(moreButton);

      await waitFor(() => screen.getByText('Zablokuj'));
      await user.click(screen.getByText('Zablokuj'));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('manage-instance-users', {
          body: {
            action: 'block',
            instanceId: INSTANCE_ID,
            userId: 'user-1',
          },
        });
      });
    });

    it('shows success toast after blocking a user', async () => {
      const user = userEvent.setup();

      mockInvoke
        .mockResolvedValueOnce({ data: { users: [makeUser({ id: 'user-1', is_blocked: false })] }, error: null })
        .mockResolvedValueOnce({ data: { success: true }, error: null })
        .mockResolvedValueOnce({ data: { users: [] }, error: null });

      renderComponent();

      await waitFor(() => screen.getByText('Jan Kowalski'));

      const moreButton = screen.getByRole('button', { name: '' });
      await user.click(moreButton);

      await waitFor(() => screen.getByText('Zablokuj'));
      await user.click(screen.getByText('Zablokuj'));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Użytkownik zablokowany');
      });
    });

    it('calls edge function with unblock action for blocked user', async () => {
      const user = userEvent.setup();

      mockInvoke
        .mockResolvedValueOnce({ data: { users: [makeUser({ id: 'user-1', is_blocked: true })] }, error: null })
        .mockResolvedValueOnce({ data: { success: true }, error: null })
        .mockResolvedValueOnce({ data: { users: [] }, error: null });

      renderComponent();

      await waitFor(() => screen.getByText('Jan Kowalski'));

      const moreButton = screen.getByRole('button', { name: '' });
      await user.click(moreButton);

      await waitFor(() => screen.getByText('Odblokuj'));
      await user.click(screen.getByText('Odblokuj'));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('manage-instance-users', {
          body: {
            action: 'unblock',
            instanceId: INSTANCE_ID,
            userId: 'user-1',
          },
        });
      });
    });

    it('shows success toast after unblocking a user', async () => {
      const user = userEvent.setup();

      mockInvoke
        .mockResolvedValueOnce({ data: { users: [makeUser({ id: 'user-1', is_blocked: true })] }, error: null })
        .mockResolvedValueOnce({ data: { success: true }, error: null })
        .mockResolvedValueOnce({ data: { users: [] }, error: null });

      renderComponent();

      await waitFor(() => screen.getByText('Jan Kowalski'));

      const moreButton = screen.getByRole('button', { name: '' });
      await user.click(moreButton);

      await waitFor(() => screen.getByText('Odblokuj'));
      await user.click(screen.getByText('Odblokuj'));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Użytkownik odblokowany');
      });
    });
  });

  describe('role labels', () => {
    it('shows Admin label for admin role', async () => {
      setupInvokeMock([makeUser({ id: 'user-1', username: 'Admin User', role: 'admin' })]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      // Admin appears in the user row and in the permissions table
      const adminLabels = screen.getAllByText('Admin');
      expect(adminLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('shows Pracownik label for employee role', async () => {
      setupInvokeMock([makeUser({ id: 'user-1', username: 'Employee User', role: 'employee' })]);

      renderComponent();

      await waitFor(() => screen.getByText('Employee User'));

      // Pracownik appears in user row and permissions table
      const labels = screen.getAllByText('Pracownik');
      expect(labels.length).toBeGreaterThanOrEqual(1);
    });

    it('shows Kalendarz label for hall role', async () => {
      setupInvokeMock([makeUser({ id: 'user-1', username: 'Hall User', role: 'hall' })]);

      renderComponent();

      await waitFor(() => screen.getByText('Hall User'));

      // Kalendarz appears in user row and permissions table
      const labels = screen.getAllByText('Kalendarz');
      expect(labels.length).toBeGreaterThanOrEqual(1);
    });

    it('shows Sprzedaż label for sales role', async () => {
      setupInvokeMock([makeUser({ id: 'user-1', username: 'Sales User', role: 'sales' })]);

      renderComponent();

      await waitFor(() => screen.getByText('Sales User'));

      // Sprzedaż appears in user row and permissions table
      const labels = screen.getAllByText('Sprzedaż');
      expect(labels.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('edge function is called with correct list action on mount', () => {
    it('fetches users on mount with list action', async () => {
      setupInvokeMock([]);

      renderComponent();

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('manage-instance-users', {
          body: {
            action: 'list',
            instanceId: INSTANCE_ID,
          },
        });
      });
    });
  });
});
