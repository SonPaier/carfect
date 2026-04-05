import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrainingTypesSettings from './TrainingTypesSettings';

// ---- Supabase mock ----
const mockFrom = vi.fn();

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select', 'eq', 'neq', 'or', 'order', 'limit', 'single', 'maybeSingle',
    'insert', 'update', 'delete', 'match', 'ilike', 'in', 'upsert',
  ];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ---- Test data ----
const INSTANCE_ID = 'inst-test-123';

const makeTrainingType = (overrides: Partial<{
  id: string;
  name: string;
  duration_days: number;
  sort_order: number;
  active: boolean;
  instance_id: string;
}> = {}) => ({
  id: 'type-1',
  instance_id: INSTANCE_ID,
  name: 'Grupowe podstawowe',
  duration_days: 1,
  sort_order: 0,
  active: true,
  ...overrides,
});

// ---- Setup helpers ----

// Simple fetch: mockFrom always resolves with given list
function setupFetchMock(trainingTypes: ReturnType<typeof makeTrainingType>[] = []) {
  mockFrom.mockImplementation(() => createChainMock(trainingTypes, null));
}

// Tracks the insert spy so tests can assert on it
function setupInsertMock(initialData: ReturnType<typeof makeTrainingType>[] = []) {
  const insertSpy = vi.fn();

  mockFrom.mockImplementation(() => {
    // Create a fresh chain each time so fetch and mutation each get their own
    const chain = createChainMock(initialData, null);
    // Override insert to track the call and return a success chain
    (chain.insert as ReturnType<typeof vi.fn>).mockImplementation((data: unknown) => {
      insertSpy(data);
      return createChainMock(null, null);
    });
    return chain;
  });

  return { insertSpy };
}

// Tracks the update spy so tests can assert on it
function setupUpdateMock(initialData: ReturnType<typeof makeTrainingType>[] = []) {
  const updateSpy = vi.fn();

  mockFrom.mockImplementation(() => {
    const chain = createChainMock(initialData, null);
    (chain.update as ReturnType<typeof vi.fn>).mockImplementation((data: unknown) => {
      updateSpy(data);
      return createChainMock(null, null);
    });
    return chain;
  });

  return { updateSpy };
}

function renderComponent() {
  return render(<TrainingTypesSettings instanceId={INSTANCE_ID} />);
}

// Helper to open the edit dialog for the first training type in the list
async function openEditDialog(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => screen.getAllByRole('button'));

  const allButtons = screen.getAllByRole('button');
  // The pencil (edit) button is the first icon-only button that is NOT the "Dodaj typ" button
  // and NOT a destructive (delete) button
  const pencilButton = allButtons.find(
    (btn) =>
      !btn.textContent?.includes('Dodaj typ') &&
      !btn.classList.contains('text-destructive') &&
      btn.querySelector('svg') !== null,
  );
  if (pencilButton) {
    await user.click(pencilButton);
  }
  await waitFor(() => screen.getByRole('dialog'));
}

// Helper to open the confirm (delete) dialog for the first training type
async function openDeleteDialog(user: ReturnType<typeof userEvent.setup>) {
  const deleteButton = screen.getAllByRole('button').find(
    (btn) => btn.classList.contains('text-destructive'),
  );
  if (deleteButton) {
    await user.click(deleteButton);
  }
  // ConfirmDialog renders as AlertDialog on desktop
  await waitFor(() => screen.getByRole('alertdialog'));
}

// Helper to click the confirm button inside the ConfirmDialog ("Potwierdź" by default)
async function clickConfirmButton(user: ReturnType<typeof userEvent.setup>) {
  const confirmButton = screen.getByRole('button', { name: 'Potwierdź' });
  await user.click(confirmButton);
}

// ---- Tests ----
describe('TrainingTypesSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----
  describe('rendering', () => {
    it('shows loading spinner initially', () => {
      // Keep the promise pending so loading state is maintained
      mockFrom.mockImplementation(() => {
        const chain: Record<string, unknown> = {};
        const methods = [
          'select', 'eq', 'neq', 'or', 'order', 'limit', 'single', 'maybeSingle',
          'insert', 'update', 'delete', 'match', 'ilike', 'in', 'upsert',
        ];
        methods.forEach((method) => {
          chain[method] = vi.fn(() => chain);
        });
        chain.then = vi.fn(() => new Promise(() => {}));
        return chain;
      });

      renderComponent();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows empty state when no training types exist', async () => {
      setupFetchMock([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Brak typów szkoleń')).toBeInTheDocument();
      });
    });

    it('shows empty state hint text when no training types exist', async () => {
      setupFetchMock([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Dodaj pierwszy typ szkolenia')).toBeInTheDocument();
      });
    });

    it('shows training type name after loading', async () => {
      setupFetchMock([makeTrainingType({ name: 'Grupowe zaawansowane' })]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Grupowe zaawansowane')).toBeInTheDocument();
      });
    });

    it('shows duration label for training type with 2 days', async () => {
      setupFetchMock([makeTrainingType({ name: 'Dwudniowe', duration_days: 2 })]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('2 dni')).toBeInTheDocument();
      });
    });

    it('shows duration label for half-day training type', async () => {
      setupFetchMock([makeTrainingType({ name: 'Krótkie', duration_days: 1.5 })]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('1,5 dnia')).toBeInTheDocument();
      });
    });

    it('shows multiple training types', async () => {
      setupFetchMock([
        makeTrainingType({ id: 'type-1', name: 'Typ A', sort_order: 0 }),
        makeTrainingType({ id: 'type-2', name: 'Typ B', sort_order: 1 }),
      ]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Typ A')).toBeInTheDocument();
        expect(screen.getByText('Typ B')).toBeInTheDocument();
      });
    });

    it('shows the "Dodaj typ" button', async () => {
      setupFetchMock([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Dodaj typ' })).toBeInTheDocument();
      });
    });
  });

  // ---- Add training type ----
  describe('add training type', () => {
    it('opens add dialog when "Dodaj typ" is clicked', async () => {
      const user = userEvent.setup();
      setupFetchMock([]);

      renderComponent();

      await waitFor(() => screen.getByRole('button', { name: 'Dodaj typ' }));
      await user.click(screen.getByRole('button', { name: 'Dodaj typ' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Dodaj typ szkolenia')).toBeInTheDocument();
      });
    });

    it('save button is disabled when name is empty', async () => {
      const user = userEvent.setup();
      setupFetchMock([]);

      renderComponent();

      await waitFor(() => screen.getByRole('button', { name: 'Dodaj typ' }));
      await user.click(screen.getByRole('button', { name: 'Dodaj typ' }));

      await waitFor(() => screen.getByRole('dialog'));

      const addButton = screen.getByRole('button', { name: 'Dodaj' });
      expect(addButton).toBeDisabled();
    });

    it('save button becomes enabled when name is typed', async () => {
      const user = userEvent.setup();
      setupFetchMock([]);

      renderComponent();

      await waitFor(() => screen.getByRole('button', { name: 'Dodaj typ' }));
      await user.click(screen.getByRole('button', { name: 'Dodaj typ' }));

      await waitFor(() => screen.getByRole('dialog'));

      const nameInput = screen.getByPlaceholderText('np. Grupowe podstawowe');
      await user.type(nameInput, 'Nowy typ');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Dodaj' })).not.toBeDisabled();
      });
    });

    it('calls supabase insert with correct data on save', async () => {
      const user = userEvent.setup();
      const { insertSpy } = setupInsertMock([]);

      renderComponent();

      await waitFor(() => screen.getByRole('button', { name: 'Dodaj typ' }));
      await user.click(screen.getByRole('button', { name: 'Dodaj typ' }));

      await waitFor(() => screen.getByRole('dialog'));

      const nameInput = screen.getByPlaceholderText('np. Grupowe podstawowe');
      await user.type(nameInput, 'Nowe szkolenie');

      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      await waitFor(() => {
        expect(insertSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            instance_id: INSTANCE_ID,
            name: 'Nowe szkolenie',
            duration_days: 1,
          }),
        );
      });
    });

    it('shows success toast after adding training type', async () => {
      const user = userEvent.setup();
      setupInsertMock([]);

      renderComponent();

      await waitFor(() => screen.getByRole('button', { name: 'Dodaj typ' }));
      await user.click(screen.getByRole('button', { name: 'Dodaj typ' }));

      await waitFor(() => screen.getByRole('dialog'));

      const nameInput = screen.getByPlaceholderText('np. Grupowe podstawowe');
      await user.type(nameInput, 'Nowy typ szkolenia');

      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Typ szkolenia dodany');
      });
    });

    it('closes dialog after successful save', async () => {
      const user = userEvent.setup();
      setupInsertMock([]);

      renderComponent();

      await waitFor(() => screen.getByRole('button', { name: 'Dodaj typ' }));
      await user.click(screen.getByRole('button', { name: 'Dodaj typ' }));

      await waitFor(() => screen.getByRole('dialog'));

      const nameInput = screen.getByPlaceholderText('np. Grupowe podstawowe');
      await user.type(nameInput, 'Nowy typ');

      await user.click(screen.getByRole('button', { name: 'Dodaj' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('cancel button closes the dialog', async () => {
      const user = userEvent.setup();
      setupFetchMock([]);

      renderComponent();

      await waitFor(() => screen.getByRole('button', { name: 'Dodaj typ' }));
      await user.click(screen.getByRole('button', { name: 'Dodaj typ' }));

      await waitFor(() => screen.getByRole('dialog'));

      await user.click(screen.getByRole('button', { name: 'Anuluj' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  // ---- Edit training type ----
  describe('edit training type', () => {
    it('opens edit dialog with pre-filled name when edit button is clicked', async () => {
      const user = userEvent.setup();
      setupFetchMock([makeTrainingType({ id: 'type-1', name: 'Stara nazwa', duration_days: 2 })]);

      renderComponent();

      await waitFor(() => screen.getByText('Stara nazwa'));
      await openEditDialog(user);

      expect(screen.getByText('Edytuj typ szkolenia')).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText('np. Grupowe podstawowe');
      expect(nameInput).toHaveValue('Stara nazwa');
    });

    it('shows correct title "Edytuj typ szkolenia" in edit mode', async () => {
      const user = userEvent.setup();
      setupFetchMock([makeTrainingType({ id: 'type-1', name: 'Dowolny typ' })]);

      renderComponent();

      await waitFor(() => screen.getByText('Dowolny typ'));
      await openEditDialog(user);

      expect(screen.getByText('Edytuj typ szkolenia')).toBeInTheDocument();
    });

    it('shows "Zapisz" button in edit mode', async () => {
      const user = userEvent.setup();
      setupFetchMock([makeTrainingType({ id: 'type-1', name: 'Typ do edycji' })]);

      renderComponent();

      await waitFor(() => screen.getByText('Typ do edycji'));
      await openEditDialog(user);

      expect(screen.getByRole('button', { name: 'Zapisz' })).toBeInTheDocument();
    });

    it('calls supabase update with new name on save', async () => {
      const user = userEvent.setup();
      const { updateSpy } = setupUpdateMock([
        makeTrainingType({ id: 'type-1', name: 'Stara nazwa' }),
      ]);

      renderComponent();

      await waitFor(() => screen.getByText('Stara nazwa'));
      await openEditDialog(user);

      const nameInput = screen.getByPlaceholderText('np. Grupowe podstawowe');
      await user.clear(nameInput);
      await user.type(nameInput, 'Nowa nazwa');

      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Nowa nazwa' }),
        );
      });
    });

    it('shows success toast "Typ szkolenia zaktualizowany" after updating', async () => {
      const user = userEvent.setup();
      setupUpdateMock([makeTrainingType({ id: 'type-1', name: 'Istniejący typ' })]);

      renderComponent();

      await waitFor(() => screen.getByText('Istniejący typ'));
      await openEditDialog(user);

      const nameInput = screen.getByPlaceholderText('np. Grupowe podstawowe');
      await user.clear(nameInput);
      await user.type(nameInput, 'Zaktualizowany typ');

      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Typ szkolenia zaktualizowany');
      });
    });
  });

  // ---- Delete training type ----
  describe('delete training type', () => {
    it('opens confirm dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      setupFetchMock([makeTrainingType({ id: 'type-1', name: 'Typ do usunięcia' })]);

      renderComponent();

      await waitFor(() => screen.getByText('Typ do usunięcia'));
      await openDeleteDialog(user);

      expect(screen.getByText('Usuń typ szkolenia')).toBeInTheDocument();
    });

    it('shows type name in confirm dialog description', async () => {
      const user = userEvent.setup();
      setupFetchMock([makeTrainingType({ id: 'type-1', name: 'Szkolenie XYZ' })]);

      renderComponent();

      // Wait for list to load, then open delete confirm
      await waitFor(() => screen.getByText('Szkolenie XYZ'));
      await openDeleteDialog(user);

      // The ConfirmDialog description contains the type name in quotes
      const alertDialog = screen.getByRole('alertdialog');
      expect(alertDialog.textContent).toContain('Szkolenie XYZ');
    });

    it('calls supabase update with active=false on confirm (soft delete)', async () => {
      const user = userEvent.setup();
      const { updateSpy } = setupUpdateMock([
        makeTrainingType({ id: 'type-1', name: 'Typ do usunięcia' }),
      ]);

      renderComponent();

      await waitFor(() => screen.getByText('Typ do usunięcia'));
      await openDeleteDialog(user);
      await clickConfirmButton(user);

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({ active: false }),
        );
      });
    });

    it('shows success toast "Typ szkolenia usunięty" after deleting', async () => {
      const user = userEvent.setup();
      setupUpdateMock([makeTrainingType({ id: 'type-1', name: 'Do usunięcia' })]);

      renderComponent();

      await waitFor(() => screen.getByText('Do usunięcia'));
      await openDeleteDialog(user);
      await clickConfirmButton(user);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Typ szkolenia usunięty');
      });
    });
  });

  // ---- Duration select ----
  describe('duration select', () => {
    // Helper: open dialog and open the select dropdown
    async function openDurationSelect(user: ReturnType<typeof userEvent.setup>) {
      setupFetchMock([]);
      renderComponent();

      await waitFor(() => screen.getByRole('button', { name: 'Dodaj typ' }));
      await user.click(screen.getByRole('button', { name: 'Dodaj typ' }));

      await waitFor(() => screen.getByRole('dialog'));

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
    }

    it('duration select shows "2 dni" option', async () => {
      const user = userEvent.setup();
      await openDurationSelect(user);

      await waitFor(() => {
        expect(screen.getAllByText('2 dni').length).toBeGreaterThan(0);
      });
    });

    it('duration select shows "3 dni" option', async () => {
      const user = userEvent.setup();
      await openDurationSelect(user);

      await waitFor(() => {
        expect(screen.getAllByText('3 dni').length).toBeGreaterThan(0);
      });
    });

    it('duration select shows "5 dni" option', async () => {
      const user = userEvent.setup();
      await openDurationSelect(user);

      await waitFor(() => {
        expect(screen.getAllByText('5 dni').length).toBeGreaterThan(0);
      });
    });

    it('duration select shows "1 dzień" option', async () => {
      const user = userEvent.setup();
      await openDurationSelect(user);

      await waitFor(() => {
        expect(screen.getAllByText('1 dzień').length).toBeGreaterThan(0);
      });
    });

    it('duration select shows half-day options "1,5 dnia" and "2,5 dnia"', async () => {
      const user = userEvent.setup();
      await openDurationSelect(user);

      await waitFor(() => {
        expect(screen.getAllByText('1,5 dnia').length).toBeGreaterThan(0);
        expect(screen.getAllByText('2,5 dnia').length).toBeGreaterThan(0);
      });
    });

    it('pre-fills duration when editing existing training type with 3-day duration', async () => {
      const user = userEvent.setup();
      setupFetchMock([makeTrainingType({ id: 'type-1', name: 'Typ 3-dniowy', duration_days: 3 })]);

      renderComponent();

      await waitFor(() => screen.getByText('Typ 3-dniowy'));
      await openEditDialog(user);

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toHaveTextContent('3 dni');
    });
  });

  // ---- instanceId null guard ----
  describe('instanceId null guard', () => {
    it('does not call supabase when instanceId is null', () => {
      render(<TrainingTypesSettings instanceId={null} />);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
