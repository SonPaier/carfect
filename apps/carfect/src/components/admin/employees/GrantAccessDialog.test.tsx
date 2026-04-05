import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetSupabaseMocks } from '@/test/mocks/supabase';

// ============================================================
// Module mocks
// ============================================================

const mockCreateUser = vi.fn();
vi.mock('@/hooks/useCreateInstanceUser', () => ({
  useCreateInstanceUser: () => ({
    createUser: mockCreateUser,
    isPending: false,
  }),
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'employeeDialog.grantAccess': 'Nadaj dostęp',
        'employeeDialog.usernameLabel': 'Login',
        'employeeDialog.usernamePlaceholder': 'login',
        'employeeDialog.usernameHint': 'Tylko litery i cyfry',
        'employeeDialog.userCreated': 'Użytkownik utworzony',
        'employeeDialog.fixPassword': 'Popraw hasło',
        'addUser.usernameMinLength': 'Login min 3 znaki',
        'addUser.password': 'Hasło',
        'addUser.confirmPassword': 'Powtórz hasło',
        'addUser.role': 'Rola',
        'addUser.roleEmployee': 'Pracownik',
        'addUser.roleHall': 'Hala',
        'addUser.roleSales': 'Sprzedaż',
        'addUser.roleAdmin': 'Admin',
        'addUser.createUser': 'Utwórz użytkownika',
        'common.cancel': 'Anuluj',
        'password.placeholder': 'Hasło',
        'password.req.minLength': 'Min 8 znaków',
        'password.req.hasUppercase': 'Wielka litera',
        'password.req.hasLowercase': 'Mała litera',
        'password.req.hasNumber': 'Cyfra',
        'password.req.hasSpecial': 'Znak specjalny',
        'password.req.noSequence': 'Brak sekwencji',
        'password.req.noRepeating': 'Brak powtórzeń',
        'password.req.notCommon': 'Nie za proste',
        'password.req.noUsername': 'Różne od loginu',
        'password.strength.veryWeak': 'Bardzo słabe',
        'password.strength.weak': 'Słabe',
        'password.strength.medium': 'Średnie',
        'password.strength.strong': 'Silne',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

// ============================================================
// Import after mocks
// ============================================================

import GrantAccessDialog from './GrantAccessDialog';

// ============================================================
// Helpers
// ============================================================

const INSTANCE_ID = 'inst-abc';

const renderDialog = (props: Partial<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeName: string;
}> = {}) => {
  const user = userEvent.setup();
  const onOpenChange = props.onOpenChange ?? vi.fn();
  const result = render(
    <GrantAccessDialog
      open={props.open ?? true}
      onOpenChange={onOpenChange}
      instanceId={INSTANCE_ID}
      employeeName={props.employeeName ?? 'Jan Kowalski'}
    />,
  );
  return { ...result, user, onOpenChange };
};

// Fill in a valid password (meets all requirements)
const VALID_PASSWORD = 'SecurePass1!';

const fillValidForm = async (
  user: ReturnType<typeof userEvent.setup>,
  username = 'jankowalski',
) => {
  const usernameInput = screen.getByRole('textbox', { name: /login/i });
  await user.clear(usernameInput);
  await user.type(usernameInput, username);

  const passwordInputs = document.querySelectorAll('input[type="password"]');
  if (passwordInputs.length >= 2) {
    await user.type(passwordInputs[0] as HTMLElement, VALID_PASSWORD);
    await user.type(passwordInputs[1] as HTMLElement, VALID_PASSWORD);
  }
};

// ============================================================
// Tests
// ============================================================

describe('GrantAccessDialog', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockCreateUser.mockResolvedValue({ userId: 'new-user-id' });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders dialog title with employee name', () => {
      renderDialog({ employeeName: 'Anna Nowak' });
      expect(screen.getByText(/Anna Nowak/)).toBeInTheDocument();
    });

    it('renders username input', () => {
      renderDialog();
      expect(screen.getByRole('textbox', { name: /login/i })).toBeInTheDocument();
    });

    it('renders role selector', () => {
      renderDialog();
      expect(screen.getByText('Pracownik')).toBeInTheDocument();
    });

    it('renders create user button', () => {
      renderDialog();
      expect(screen.getByRole('button', { name: /utwórz użytkownika/i })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      renderDialog();
      expect(screen.getByRole('button', { name: /anuluj/i })).toBeInTheDocument();
    });
  });

  describe('username prefill', () => {
    it('pre-fills username from employee name on open', () => {
      renderDialog({ employeeName: 'Jan Kowalski' });
      const usernameInput = screen.getByRole('textbox', { name: /login/i }) as HTMLInputElement;
      // sanitizeUsername('Jan Kowalski') = 'jankowalski'
      expect(usernameInput.value).toBe('jankowalski');
    });

    it('truncates suggested username to 20 chars', () => {
      renderDialog({ employeeName: 'Bartholomeus Wierzbicki' });
      const usernameInput = screen.getByRole('textbox', { name: /login/i }) as HTMLInputElement;
      expect(usernameInput.value.length).toBeLessThanOrEqual(20);
    });

    it('sanitizes special chars from employee name for prefill', () => {
      renderDialog({ employeeName: 'Łukasz Żółkowski' });
      const usernameInput = screen.getByRole('textbox', { name: /login/i }) as HTMLInputElement;
      // Only a-z, 0-9, . - allowed
      expect(usernameInput.value).toMatch(/^[a-z0-9.\-]*$/);
    });
  });

  describe('username validation', () => {
    it('disables submit button when username is empty (cleared)', async () => {
      const { user } = renderDialog();
      const usernameInput = screen.getByRole('textbox', { name: /login/i });
      await user.clear(usernameInput);

      const submitBtn = screen.getByRole('button', { name: /utwórz użytkownika/i });
      expect(submitBtn).toBeDisabled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('disables submit button when username is shorter than 3 chars and no valid password', async () => {
      const { user } = renderDialog();
      const usernameInput = screen.getByRole('textbox', { name: /login/i });
      await user.clear(usernameInput);
      await user.type(usernameInput, 'ab');

      const submitBtn = screen.getByRole('button', { name: /utwórz użytkownika/i });
      // Button disabled because password is invalid (empty)
      expect(submitBtn).toBeDisabled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('sanitizes username input — strips disallowed chars', async () => {
      const { user } = renderDialog();
      const usernameInput = screen.getByRole('textbox', { name: /login/i });
      await user.clear(usernameInput);
      await user.type(usernameInput, 'jan@test!');

      expect((usernameInput as HTMLInputElement).value).toBe('jantest');
    });
  });

  describe('password validation', () => {
    it('disables submit button when password is not filled (username pre-filled)', () => {
      renderDialog();
      const submitBtn = screen.getByRole('button', { name: /utwórz użytkownika/i });
      // Button disabled because isPasswordValid is false (no password entered)
      expect(submitBtn).toBeDisabled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });

  describe('successful submission', () => {
    it('calls createUser with correct params on valid submit', async () => {
      const { user } = renderDialog({ employeeName: 'Jan Kowalski' });

      await fillValidForm(user, 'jankowalski');

      const submitBtn = screen.getByRole('button', { name: /utwórz użytkownika/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith(
          expect.objectContaining({
            instanceId: INSTANCE_ID,
            username: 'jankowalski',
            password: VALID_PASSWORD,
            role: 'employee',
          }),
        );
      });
    });

    it('shows success toast after successful user creation', async () => {
      const { user } = renderDialog();

      await fillValidForm(user);

      const submitBtn = screen.getByRole('button', { name: /utwórz użytkownika/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Użytkownik utworzony');
      });
    });

    it('calls onOpenChange(false) after successful creation', async () => {
      const { user, onOpenChange } = renderDialog();

      await fillValidForm(user);

      const submitBtn = screen.getByRole('button', { name: /utwórz użytkownika/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('error handling', () => {
    it('shows error toast with message when createUser throws', async () => {
      mockCreateUser.mockRejectedValue(new Error('Username already taken'));

      const { user } = renderDialog();
      await fillValidForm(user);

      const submitBtn = screen.getByRole('button', { name: /utwórz użytkownika/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Username already taken');
      });
    });

    it('does not close dialog on error', async () => {
      mockCreateUser.mockRejectedValue(new Error('Fail'));

      const { user, onOpenChange } = renderDialog();
      await fillValidForm(user);

      const submitBtn = screen.getByRole('button', { name: /utwórz użytkownika/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  describe('cancel button', () => {
    it('calls onOpenChange(false) when cancel is clicked', async () => {
      const { user, onOpenChange } = renderDialog();
      await user.click(screen.getByRole('button', { name: /anuluj/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
