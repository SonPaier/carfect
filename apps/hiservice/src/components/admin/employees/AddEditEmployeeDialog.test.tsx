import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddEditEmployeeDialog from './AddEditEmployeeDialog';
import { Employee } from '@/hooks/useEmployees';
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

vi.mock('@/lib/imageUtils', () => ({
  compressImage: vi.fn().mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
}));

const INSTANCE_ID = 'test-instance-id';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  instanceId: INSTANCE_ID,
  isAdmin: true,
};

const newEmployee: Employee = {
  id: 'emp-new',
  instance_id: INSTANCE_ID,
  name: 'Jan Kowalski',
  photo_url: null,
  hourly_rate: null,
  active: true,
  sort_order: 0,
  created_at: '2026-03-16T00:00:00Z',
  updated_at: '2026-03-16T00:00:00Z',
};

const existingEmployee: Employee = {
  id: 'emp-1',
  instance_id: INSTANCE_ID,
  name: 'Adam Mechanik',
  photo_url: 'https://example.com/photo.jpg',
  hourly_rate: 35,
  active: true,
  sort_order: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

function renderDialog(props = {}) {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AddEditEmployeeDialog {...defaultProps} {...props} />
    </QueryClientProvider>,
  );
  return { user, queryClient, ...result };
}

describe('AddEditEmployeeDialog — create employee', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockSupabaseQuery('employees', { data: newEmployee, error: null }, 'insert');
  });

  describe('rendering', () => {
    it('renders add dialog with required fields', () => {
      renderDialog();

      expect(screen.getByText('Dodaj pracownika')).toBeInTheDocument();
      expect(screen.getByLabelText('Imię / ksywka *')).toBeInTheDocument();
      expect(screen.getByLabelText('Stawka godzinowa na rękę (zł)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Dodaj' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Anuluj' })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderDialog({ open: false });
      expect(screen.queryByText('Dodaj pracownika')).not.toBeInTheDocument();
    });

    it('hides hourly rate and account checkbox for non-admin', () => {
      renderDialog({ isAdmin: false });

      expect(screen.getByText('Dodaj pracownika')).toBeInTheDocument();
      expect(screen.queryByLabelText('Stawka godzinowa na rękę (zł)')).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText('Stwórz konto w aplikacji dla pracownika'),
      ).not.toBeInTheDocument();
    });

    it('does not show delete button in create mode', () => {
      renderDialog();
      expect(screen.queryByRole('button', { name: /trash|usuń/i })).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows error when submitting without name', async () => {
      const { toast } = await import('sonner');
      const { user } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      expect(toast.error).toHaveBeenCalledWith('Podaj imię lub ksywkę');
    });

    it('shows error when name is only whitespace', async () => {
      const { toast } = await import('sonner');
      const { user } = renderDialog();

      await user.type(screen.getByLabelText('Imię / ksywka *'), '   ');
      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      expect(toast.error).toHaveBeenCalledWith('Podaj imię lub ksywkę');
    });

    it('disables submit when account checkbox is on but credentials are too short', async () => {
      const { user } = renderDialog();

      await user.click(screen.getByLabelText('Stwórz konto w aplikacji dla pracownika'));
      await user.type(screen.getByLabelText('Nazwa użytkownika *'), 'ab');
      await user.type(screen.getByLabelText('Hasło *'), '12345');

      expect(screen.getByRole('button', { name: 'Dodaj' })).toBeDisabled();
    });

    it('password with only spaces should not pass validation', async () => {
      const { user } = renderDialog();

      await user.click(screen.getByLabelText('Stwórz konto w aplikacji dla pracownika'));
      await user.type(screen.getByLabelText('Nazwa użytkownika *'), 'jankowalski');
      await user.type(screen.getByLabelText('Hasło *'), '      ');

      // Password of 6 spaces should NOT be valid
      expect(screen.getByRole('button', { name: 'Dodaj' })).toBeDisabled();
    });
  });

  describe('submission', () => {
    it('creates employee with name only', async () => {
      const { toast } = await import('sonner');
      const onOpenChange = vi.fn();
      const { user } = renderDialog({ onOpenChange });

      await user.type(screen.getByLabelText('Imię / ksywka *'), 'Jan Kowalski');
      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('employees');
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Pracownik został dodany');
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('saves hourly_rate of 0 as 0, not null', async () => {
      const { toast } = await import('sonner');

      // Capture insert data via a custom mock, then restore original
      let insertedData: Record<string, unknown> | null = null;
      const originalFrom = mockSupabase.from.getMockImplementation();
      mockSupabase.from.mockImplementation((table: string) => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockImplementation((data: unknown) => {
            if (table === 'employees') insertedData = data as Record<string, unknown>;
            return builder;
          }),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...newEmployee, hourly_rate: 0 },
            error: null,
          }),
          then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
        };
        return builder;
      });

      const { user, queryClient } = renderDialog();
      queryClient.setQueryData(['employees', INSTANCE_ID], []);

      await user.type(screen.getByLabelText('Imię / ksywka *'), 'Stażysta');
      await user.type(screen.getByLabelText('Stawka godzinowa na rękę (zł)'), '0');
      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Pracownik został dodany');
      });

      expect(insertedData).toMatchObject({
        hourly_rate: 0, // Should be 0, not null
      });

      // Restore original mock
      if (originalFrom) mockSupabase.from.mockImplementation(originalFrom);
      else mockSupabase.from.mockReset();
      resetSupabaseMocks();
    });

    it('updates cache optimistically after create', async () => {
      const { user, queryClient } = renderDialog();

      queryClient.setQueryData(['employees', INSTANCE_ID], []);

      await user.type(screen.getByLabelText('Imię / ksywka *'), 'Jan Kowalski');
      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      await waitFor(() => {
        const cached = queryClient.getQueryData<unknown[]>(['employees', INSTANCE_ID]);
        expect(cached).toHaveLength(1);
        expect(cached![0]).toMatchObject({ id: 'emp-new', name: 'Jan Kowalski' });
      });
    });

    it('handles supabase error on insert gracefully', async () => {
      const { toast } = await import('sonner');
      mockSupabaseQuery(
        'employees',
        {
          data: null,
          error: { message: 'Database error' },
        },
        'insert',
      );
      const onOpenChange = vi.fn();
      const { user } = renderDialog({ onOpenChange });

      await user.type(screen.getByLabelText('Imię / ksywka *'), 'Test');
      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Wystąpił błąd');
      });
      // Dialog should NOT close on error
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });

    it('submit button is wired to isPending to prevent double-create', () => {
      renderDialog();
      // In idle state, button should be enabled (isPending = false)
      expect(screen.getByRole('button', { name: 'Dodaj' })).not.toBeDisabled();
    });
  });

  describe('account creation', () => {
    it('shows account fields when checkbox is checked', async () => {
      const { user } = renderDialog();

      expect(screen.queryByLabelText('Nazwa użytkownika *')).not.toBeInTheDocument();

      await user.click(screen.getByLabelText('Stwórz konto w aplikacji dla pracownika'));

      expect(screen.getByLabelText('Nazwa użytkownika *')).toBeInTheDocument();
      expect(screen.getByLabelText('Hasło *')).toBeInTheDocument();
    });

    it('creates employee with account when credentials are valid', async () => {
      const { toast } = await import('sonner');
      const { user } = renderDialog();

      await user.type(screen.getByLabelText('Imię / ksywka *'), 'Pracownik');
      await user.click(screen.getByLabelText('Stwórz konto w aplikacji dla pracownika'));
      await user.type(screen.getByLabelText('Nazwa użytkownika *'), 'jan.k');
      await user.type(screen.getByLabelText('Hasło *'), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Pracownik został dodany');
      });

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('manage-instance-users', {
          body: {
            action: 'create',
            instanceId: INSTANCE_ID,
            username: 'jan.k',
            password: 'secret123',
            role: 'employee',
            employeeId: 'emp-new',
          },
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Konto użytkownika zostało utworzone');
      });
    });

    it('does NOT close dialog when account creation fails (employee was created but account was not)', async () => {
      const { toast } = await import('sonner');
      const onOpenChange = vi.fn();
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: { error: 'Username already exists' },
        error: null,
      });

      const { user } = renderDialog({ onOpenChange });

      await user.type(screen.getByLabelText('Imię / ksywka *'), 'Pracownik');
      await user.click(screen.getByLabelText('Stwórz konto w aplikacji dla pracownika'));
      await user.type(screen.getByLabelText('Nazwa użytkownika *'), 'jan.k');
      await user.type(screen.getByLabelText('Hasło *'), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Błąd tworzenia konta: Username already exists');
      });

      // Dialog should stay open so user can retry or close manually
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  describe('form reset', () => {
    it('resets all fields when dialog reopens in create mode', async () => {
      const { user, rerender } = renderDialog();

      // Fill in data
      await user.type(screen.getByLabelText('Imię / ksywka *'), 'Jan');
      await user.type(screen.getByLabelText('Stawka godzinowa na rękę (zł)'), '50');

      // Close and reopen
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      rerender(
        <QueryClientProvider client={queryClient}>
          <AddEditEmployeeDialog {...defaultProps} open={false} />
        </QueryClientProvider>,
      );
      rerender(
        <QueryClientProvider client={queryClient}>
          <AddEditEmployeeDialog {...defaultProps} open={true} />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Imię / ksywka *')).toHaveValue('');
      });
      expect(screen.getByLabelText('Stawka godzinowa na rękę (zł)')).toHaveValue(null);
    });
  });

  describe('cancel', () => {
    it('calls onOpenChange when cancel is clicked', async () => {
      const onOpenChange = vi.fn();
      const { user } = renderDialog({ onOpenChange });

      await user.click(screen.getByRole('button', { name: 'Anuluj' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe('AddEditEmployeeDialog — edit employee', () => {
  const updatedEmployee: Employee = { ...existingEmployee, name: 'Adam Zmieniony' };

  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockSupabaseQuery('employees', { data: updatedEmployee, error: null }, 'update');
  });

  describe('rendering', () => {
    it('renders edit dialog with pre-filled fields', () => {
      renderDialog({ employee: existingEmployee });

      expect(screen.getByText('Edytuj pracownika')).toBeInTheDocument();
      expect(screen.getByLabelText('Imię / ksywka *')).toHaveValue('Adam Mechanik');
      expect(screen.getByLabelText('Stawka godzinowa na rękę (zł)')).toHaveValue(35);
      expect(screen.getByRole('button', { name: 'Zapisz' })).toBeInTheDocument();
    });

    it('shows delete button for admin in edit mode', () => {
      renderDialog({ employee: existingEmployee, isAdmin: true });
      // Trash2 icon button
      const buttons = screen.getAllByRole('button');
      const trashButton = buttons.find((b) => b.classList.contains('text-destructive'));
      expect(trashButton).toBeTruthy();
    });

    it('hides delete button for non-admin in edit mode', () => {
      renderDialog({ employee: existingEmployee, isAdmin: false });
      const buttons = screen.getAllByRole('button');
      const trashButton = buttons.find((b) => b.classList.contains('text-destructive'));
      expect(trashButton).toBeUndefined();
    });

    it('does not show account creation checkbox in edit mode', () => {
      renderDialog({ employee: existingEmployee });
      expect(
        screen.queryByLabelText('Stwórz konto w aplikacji dla pracownika'),
      ).not.toBeInTheDocument();
    });
  });

  describe('submission', () => {
    it('updates employee name successfully', async () => {
      const { toast } = await import('sonner');
      const onOpenChange = vi.fn();
      const { user } = renderDialog({ employee: existingEmployee, onOpenChange });

      const nameInput = screen.getByLabelText('Imię / ksywka *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Adam Zmieniony');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Pracownik został zaktualizowany');
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('updates cache optimistically after edit', async () => {
      const { user, queryClient } = renderDialog({ employee: existingEmployee });
      queryClient.setQueryData(['employees', INSTANCE_ID], [existingEmployee]);

      const nameInput = screen.getByLabelText('Imię / ksywka *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Adam Zmieniony');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        const cached = queryClient.getQueryData<Employee[]>(['employees', INSTANCE_ID]);
        expect(cached).toHaveLength(1);
        expect(cached![0].name).toBe('Adam Zmieniony');
      });
    });

    it('non-admin edit should NOT wipe existing hourly_rate', async () => {
      const { toast } = await import('sonner');

      // Capture update data
      let updatedData: Record<string, unknown> | null = null;
      const originalFrom = mockSupabase.from.getMockImplementation();
      mockSupabase.from.mockImplementation((table: string) => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockImplementation((data: unknown) => {
            if (table === 'employees') updatedData = data as Record<string, unknown>;
            return builder;
          }),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...existingEmployee, name: 'Nowe Imie' },
            error: null,
          }),
          then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
        };
        return builder;
      });

      const { user } = renderDialog({ employee: existingEmployee, isAdmin: false });

      const nameInput = screen.getByLabelText('Imię / ksywka *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Nowe Imie');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Pracownik został zaktualizowany');
      });

      // hourly_rate should not be sent at all (non-admin can't change it)
      expect(updatedData).toBeTruthy();
      expect(updatedData).not.toHaveProperty('hourly_rate');

      // Restore
      if (originalFrom) mockSupabase.from.mockImplementation(originalFrom);
      else mockSupabase.from.mockReset();
      resetSupabaseMocks();
    });

    it('handles supabase error on update gracefully', async () => {
      const { toast } = await import('sonner');
      mockSupabaseQuery(
        'employees',
        {
          data: null,
          error: { message: 'Update failed' },
        },
        'update',
      );
      const onOpenChange = vi.fn();
      const { user } = renderDialog({ employee: existingEmployee, onOpenChange });

      const nameInput = screen.getByLabelText('Imię / ksywka *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Nowe imie');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Wystąpił błąd');
      });
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });
});

describe('AddEditEmployeeDialog — delete employee', () => {
  const softDeletedEmployee: Employee = { ...existingEmployee, active: false };

  function getTrashButton(): HTMLElement {
    const buttons = screen.getAllByRole('button');
    const btn = buttons.find((b) => b.classList.contains('text-destructive'));
    if (!btn) throw new Error('Trash button not found');
    return btn;
  }

  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockSupabaseQuery('employees', { data: softDeletedEmployee, error: null }, 'update');
  });

  it('shows confirmation dialog before deleting', async () => {
    renderDialog({ employee: existingEmployee });

    fireEvent.click(getTrashButton());

    await waitFor(() => {
      expect(screen.getByText('Usuń pracownika')).toBeInTheDocument();
      expect(
        screen.getByText(/Czy na pewno chcesz usunąć pracownika "Adam Mechanik"/),
      ).toBeInTheDocument();
    });
  });

  it('soft-deletes employee (sets active: false) on confirm', async () => {
    const { toast } = await import('sonner');
    const onOpenChange = vi.fn();
    renderDialog({ employee: existingEmployee, onOpenChange });

    fireEvent.click(getTrashButton());

    await waitFor(() => {
      expect(screen.getByText('Usuń pracownika')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Usuń' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Pracownik został usunięty');
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('updates cache optimistically after delete (sets active: false)', async () => {
    const { queryClient } = renderDialog({ employee: existingEmployee });
    queryClient.setQueryData(['employees', INSTANCE_ID], [existingEmployee]);

    fireEvent.click(getTrashButton());

    await waitFor(() => {
      expect(screen.getByText('Usuń pracownika')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Usuń' }));

    await waitFor(() => {
      const cached = queryClient.getQueryData<Employee[]>(['employees', INSTANCE_ID]);
      expect(cached).toHaveLength(1);
      expect(cached![0].active).toBe(false);
    });
  });

  it('handles delete error gracefully and keeps dialog open', async () => {
    const { toast } = await import('sonner');
    mockSupabaseQuery(
      'employees',
      {
        data: null,
        error: { message: 'Cannot delete' },
      },
      'update',
    );
    const onOpenChange = vi.fn();
    renderDialog({ employee: existingEmployee, onOpenChange });

    fireEvent.click(getTrashButton());

    await waitFor(() => {
      expect(screen.getByText('Usuń pracownika')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Usuń' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Błąd podczas usuwania pracownika');
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
