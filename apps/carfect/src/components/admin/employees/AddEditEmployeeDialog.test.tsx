import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetSupabaseMocks } from '@/test/mocks/supabase';
import type { Employee } from '@/hooks/useEmployees';

// ============================================================
// Module mocks
// ============================================================

const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();

vi.mock('@/hooks/useEmployees', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/useEmployees')>();
  return {
    ...original,
    useCreateEmployee: vi.fn(() => ({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    })),
    useUpdateEmployee: vi.fn(() => ({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    })),
    useDeleteEmployee: vi.fn(() => ({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    })),
  };
});

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
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'employeeDialog.editTitle': 'Edytuj pracownika',
        'employeeDialog.addTitle': 'Dodaj pracownika',
        'employeeDialog.nameLabel': 'Imię i nazwisko',
        'employeeDialog.namePlaceholder': 'Jan Kowalski',
        'employeeDialog.nameRequired': 'Imię jest wymagane',
        'employeeDialog.grantAccess': 'Nadaj dostęp',
        'employeeDialog.usernameLabel': 'Login',
        'employeeDialog.usernamePlaceholder': 'login',
        'employeeDialog.usernameHint': 'Tylko litery i cyfry',
        'employeeDialog.usernameMinLength': 'Login min 3 znaki',
        'employeeDialog.fixPassword': 'Popraw hasło',
        'employeeDialog.employeeAdded': 'Pracownik dodany',
        'employeeDialog.employeeUpdated': 'Pracownik zaktualizowany',
        'employeeDialog.employeeDeleted': 'Pracownik usunięty',
        'employeeDialog.userCreated': 'Użytkownik utworzony',
        'employeeDialog.userCreateError': `Błąd tworzenia: ${opts?.error ?? ''}`,
        'employeeDialog.submitError': 'Błąd zapisu',
        'employeeDialog.deleteError': 'Błąd usunięcia',
        'employeeDialog.deleteTitle': 'Usuń pracownika',
        'employeeDialog.deleteDescription': `Usuń ${opts?.name ?? ''}?`,
        'employeeDialog.photoHint': 'Kliknij, aby dodać zdjęcie',
        'employeeDialog.photoOnlyImages': 'Tylko obrazy',
        'employeeDialog.photoMaxSize': 'Zbyt duży plik',
        'employeeDialog.photoUploadError': 'Błąd uploadu',
        'employeeDialog.photoSaved': 'Zdjęcie zapisane',
        'employeeDialog.photoUploaded': 'Zdjęcie dodane',
        'addUser.password': 'Hasło',
        'addUser.confirmPassword': 'Powtórz hasło',
        'common.cancel': 'Anuluj',
        'common.save': 'Zapisz',
        'common.add': 'Dodaj',
        'common.delete': 'Usuń',
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

// Mock compressImage to avoid canvas issues in jsdom
vi.mock('@shared/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@shared/utils')>();
  return {
    ...original,
    compressImage: vi.fn().mockResolvedValue(new Blob(['image'], { type: 'image/jpeg' })),
  };
});

// ============================================================
// Import after mocks
// ============================================================

import AddEditEmployeeDialog from './AddEditEmployeeDialog';

// ============================================================
// Test data
// ============================================================

const INSTANCE_ID = 'inst-test-111';
const VALID_PASSWORD = 'SecurePass1!';

const mockEmployee: Employee = {
  id: 'emp-1',
  instance_id: INSTANCE_ID,
  name: 'Anna Nowak',
  photo_url: null,
  hourly_rate: null,
  active: true,
  sort_order: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// ============================================================
// Helpers
// ============================================================

const renderAddDialog = (overrides: { isAdmin?: boolean; onOpenChange?: (v: boolean) => void } = {}) => {
  const user = userEvent.setup();
  const onOpenChange = overrides.onOpenChange ?? vi.fn();
  const result = render(
    <AddEditEmployeeDialog
      open={true}
      onOpenChange={onOpenChange}
      instanceId={INSTANCE_ID}
      employee={null}
      isAdmin={overrides.isAdmin ?? true}
    />,
  );
  return { ...result, user, onOpenChange };
};

const renderEditDialog = (emp: Employee = mockEmployee, overrides: { onOpenChange?: (v: boolean) => void } = {}) => {
  const user = userEvent.setup();
  const onOpenChange = overrides.onOpenChange ?? vi.fn();
  const result = render(
    <AddEditEmployeeDialog
      open={true}
      onOpenChange={onOpenChange}
      instanceId={INSTANCE_ID}
      employee={emp}
      isAdmin={true}
    />,
  );
  return { ...result, user, onOpenChange };
};

const fillPassword = async (user: ReturnType<typeof userEvent.setup>) => {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  if (passwordInputs.length >= 2) {
    await user.type(passwordInputs[0] as HTMLElement, VALID_PASSWORD);
    await user.type(passwordInputs[1] as HTMLElement, VALID_PASSWORD);
  }
};

// ============================================================
// Tests
// ============================================================

describe('AddEditEmployeeDialog', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue({ id: 'new-emp-id', name: 'New Employee' });
    mockUpdateMutateAsync.mockResolvedValue({ id: 'emp-1', name: 'Updated' });
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    mockCreateUser.mockResolvedValue({ userId: 'user-new' });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering — add mode', () => {
    it('shows add title when no employee prop', () => {
      renderAddDialog();
      expect(screen.getByText('Dodaj pracownika')).toBeInTheDocument();
    });

    it('shows grant access toggle for new employee when isAdmin', () => {
      renderAddDialog();
      expect(screen.getByText('Nadaj dostęp')).toBeInTheDocument();
    });

    it('does not show grant access toggle when isAdmin is false', () => {
      renderAddDialog({ isAdmin: false });
      expect(screen.queryByText('Nadaj dostęp')).not.toBeInTheDocument();
    });

    it('shows Add button (not Save) in add mode', () => {
      renderAddDialog();
      expect(screen.getByRole('button', { name: /^dodaj$/i })).toBeInTheDocument();
    });

    it('does not show delete button in add mode', () => {
      renderAddDialog();
      // Delete button is only for editing
      const deleteButtons = document.querySelectorAll('button[class*="destructive"]');
      expect(deleteButtons.length).toBe(0);
    });
  });

  describe('rendering — edit mode', () => {
    it('shows edit title when employee prop provided', () => {
      renderEditDialog();
      expect(screen.getByText('Edytuj pracownika')).toBeInTheDocument();
    });

    it('does NOT show grant access toggle for existing employee', () => {
      renderEditDialog();
      expect(screen.queryByText('Nadaj dostęp')).not.toBeInTheDocument();
    });

    it('pre-fills name field with employee name', () => {
      renderEditDialog();
      const nameInput = screen.getByLabelText(/imię i nazwisko/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Anna Nowak');
    });

    it('shows Save button in edit mode', () => {
      renderEditDialog();
      expect(screen.getByRole('button', { name: /^zapisz$/i })).toBeInTheDocument();
    });
  });

  describe('name validation', () => {
    it('shows error toast when name is empty on submit', async () => {
      const { user } = renderAddDialog();
      const submitBtn = screen.getByRole('button', { name: /^dodaj$/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Imię jest wymagane');
      });
      expect(mockCreateMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('creating a new employee without access', () => {
    it('calls createEmployee with trimmed name', async () => {
      const { user } = renderAddDialog();
      const nameInput = screen.getByLabelText(/imię i nazwisko/i);
      await user.type(nameInput, '  Jan Kowalski  ');

      await user.click(screen.getByRole('button', { name: /^dodaj$/i }));

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Jan Kowalski' }),
        );
      });
    });

    it('shows success toast after creating employee', async () => {
      const { user } = renderAddDialog();
      const nameInput = screen.getByLabelText(/imię i nazwisko/i);
      await user.type(nameInput, 'Jan Kowalski');

      await user.click(screen.getByRole('button', { name: /^dodaj$/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Pracownik dodany');
      });
    });

    it('does not call createUser when grant access toggle is off', async () => {
      const { user } = renderAddDialog();
      const nameInput = screen.getByLabelText(/imię i nazwisko/i);
      await user.type(nameInput, 'Jan Kowalski');

      await user.click(screen.getByRole('button', { name: /^dodaj$/i }));

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalled();
      });
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('closes dialog after successful employee creation', async () => {
      const { user, onOpenChange } = renderAddDialog();
      const nameInput = screen.getByLabelText(/imię i nazwisko/i);
      await user.type(nameInput, 'Jan Kowalski');

      await user.click(screen.getByRole('button', { name: /^dodaj$/i }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('grant access toggle', () => {
    it('shows username and password fields when grant access is toggled on', async () => {
      const { user } = renderAddDialog();

      const toggle = screen.getByRole('switch', { name: /nadaj dostęp/i });
      await user.click(toggle);

      expect(screen.getByRole('textbox', { name: /login/i })).toBeInTheDocument();
    });

    it('disables submit when grant access is on but password is invalid', async () => {
      const { user } = renderAddDialog();

      const toggle = screen.getByRole('switch', { name: /nadaj dostęp/i });
      await user.click(toggle);

      const usernameInput = screen.getByRole('textbox', { name: /login/i });
      await user.clear(usernameInput);
      await user.type(usernameInput, 'ab');

      const submitBtn = screen.getByRole('button', { name: /^dodaj$/i });
      expect(submitBtn).toBeDisabled();
      expect(mockCreateMutateAsync).not.toHaveBeenCalled();
    });

    it('sanitizes username typed in the grant access form', async () => {
      const { user } = renderAddDialog();

      const toggle = screen.getByRole('switch', { name: /nadaj dostęp/i });
      await user.click(toggle);

      const usernameInput = screen.getByRole('textbox', { name: /login/i });
      await user.clear(usernameInput);
      await user.type(usernameInput, 'jan@test!');

      expect((usernameInput as HTMLInputElement).value).toBe('jantest');
    });

    it('calls createUser after employee creation when grant access is on', async () => {
      const { user } = renderAddDialog();

      const nameInput = screen.getByLabelText(/imię i nazwisko/i);
      await user.type(nameInput, 'Jan Kowalski');

      const toggle = screen.getByRole('switch', { name: /nadaj dostęp/i });
      await user.click(toggle);

      const usernameInput = screen.getByRole('textbox', { name: /login/i });
      await user.clear(usernameInput);
      await user.type(usernameInput, 'jankowalski');

      await fillPassword(user);

      await user.click(screen.getByRole('button', { name: /^dodaj$/i }));

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalled();
        expect(mockCreateUser).toHaveBeenCalledWith(
          expect.objectContaining({
            instanceId: INSTANCE_ID,
            username: 'jankowalski',
            role: 'employee',
          }),
        );
      });
    });

    it('shows user created toast when createUser succeeds', async () => {
      const { user } = renderAddDialog();

      const nameInput = screen.getByLabelText(/imię i nazwisko/i);
      await user.type(nameInput, 'Jan Kowalski');

      const toggle = screen.getByRole('switch', { name: /nadaj dostęp/i });
      await user.click(toggle);

      const usernameInput = screen.getByRole('textbox', { name: /login/i });
      await user.clear(usernameInput);
      await user.type(usernameInput, 'jankowalski');

      await fillPassword(user);

      await user.click(screen.getByRole('button', { name: /^dodaj$/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Użytkownik utworzony');
      });
    });
  });

  describe('editing employee', () => {
    it('calls updateEmployee with updated name', async () => {
      const { user } = renderEditDialog();

      const nameInput = screen.getByLabelText(/imię i nazwisko/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Anna Zmieniona');

      await user.click(screen.getByRole('button', { name: /^zapisz$/i }));

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'emp-1', name: 'Anna Zmieniona' }),
        );
      });
    });

    it('shows success toast after updating employee', async () => {
      const { user } = renderEditDialog();

      const nameInput = screen.getByLabelText(/imię i nazwisko/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Anna Zmieniona');

      await user.click(screen.getByRole('button', { name: /^zapisz$/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Pracownik zaktualizowany');
      });
    });
  });

  describe('error handling', () => {
    it('shows error toast when createEmployee throws', async () => {
      mockCreateMutateAsync.mockRejectedValue(new Error('DB error'));

      const { user } = renderAddDialog();
      const nameInput = screen.getByLabelText(/imię i nazwisko/i);
      await user.type(nameInput, 'Jan Kowalski');

      await user.click(screen.getByRole('button', { name: /^dodaj$/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Błąd zapisu');
      });
    });
  });
});
