import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConditionTemplatesSection } from './ConditionTemplatesSection';
import type { ConditionTemplate } from '@/hooks/useConditionTemplates';

// Mock hook
const mockCreateTemplate = vi.fn();
const mockUpdateTemplate = vi.fn();
const mockDeleteTemplate = vi.fn();
const mockByType = vi.fn();

vi.mock('@/hooks/useConditionTemplates', () => ({
  useConditionTemplates: vi.fn(() => ({
    templates: [],
    loading: false,
    byType: mockByType,
    createTemplate: mockCreateTemplate,
    updateTemplate: mockUpdateTemplate,
    deleteTemplate: mockDeleteTemplate,
    refetch: vi.fn(),
  })),
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.stubGlobal('confirm', vi.fn(() => true));

// Import after mocks
import { useConditionTemplates } from '@/hooks/useConditionTemplates';

const INSTANCE_ID = 'test-instance-123';

const makeTemplate = (overrides: Partial<ConditionTemplate> = {}): ConditionTemplate => ({
  id: 'tmpl-1',
  instance_id: INSTANCE_ID,
  template_type: 'warranty',
  name: 'Standardowa gwarancja',
  content: 'Oferujemy 12 miesięcy gwarancji na wszystkie usterki mechaniczne.',
  sort_order: 0,
  ...overrides,
});

function renderComponent() {
  return render(<ConditionTemplatesSection instanceId={INSTANCE_ID} />);
}

function setupHookMock(overrides: Partial<ReturnType<typeof useConditionTemplates>> = {}) {
  const defaults = {
    templates: [],
    loading: false,
    byType: mockByType,
    createTemplate: mockCreateTemplate,
    updateTemplate: mockUpdateTemplate,
    deleteTemplate: mockDeleteTemplate,
    refetch: vi.fn(),
  };
  vi.mocked(useConditionTemplates).mockReturnValue({ ...defaults, ...overrides });
}

describe('ConditionTemplatesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockByType.mockReturnValue([]);
    mockCreateTemplate.mockResolvedValue(true);
    mockUpdateTemplate.mockResolvedValue(true);
    mockDeleteTemplate.mockResolvedValue(true);
    vi.mocked(confirm).mockReturnValue(true);
    setupHookMock();
  });

  describe('Loading state', () => {
    it('shows loader when loading is true', () => {
      setupHookMock({ loading: true });
      renderComponent();
      expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
    });

    it('does not show loader when loading is false', () => {
      renderComponent();
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows "Brak szablonów" for each template type when no templates exist', () => {
      mockByType.mockReturnValue([]);
      renderComponent();
      // There are 4 template types, each should show "Brak szablonów"
      const emptyMessages = screen.getAllByText('Brak szablonów');
      expect(emptyMessages).toHaveLength(4);
    });

    it('renders all four template type section labels', () => {
      renderComponent();
      expect(screen.getByText('Gwarancja')).toBeInTheDocument();
      expect(screen.getByText('Warunki płatności')).toBeInTheDocument();
      expect(screen.getByText('Informacje o usłudze')).toBeInTheDocument();
      expect(screen.getByText('Uwagi')).toBeInTheDocument();
    });
  });

  describe('Renders templates', () => {
    it('shows template name and content preview for existing templates', () => {
      const template = makeTemplate();
      mockByType.mockImplementation((type) => (type === 'warranty' ? [template] : []));
      setupHookMock({ templates: [template] });

      renderComponent();

      expect(screen.getByText('Standardowa gwarancja')).toBeInTheDocument();
      expect(
        screen.getByText('Oferujemy 12 miesięcy gwarancji na wszystkie usterki mechaniczne.'),
      ).toBeInTheDocument();
    });

    it('shows multiple templates in the same section', () => {
      const t1 = makeTemplate({ id: 'tmpl-1', name: 'Szablon A', content: 'Treść A' });
      const t2 = makeTemplate({ id: 'tmpl-2', name: 'Szablon B', content: 'Treść B' });
      mockByType.mockImplementation((type) => (type === 'warranty' ? [t1, t2] : []));
      setupHookMock({ templates: [t1, t2] });

      renderComponent();

      expect(screen.getByText('Szablon A')).toBeInTheDocument();
      expect(screen.getByText('Szablon B')).toBeInTheDocument();
    });
  });

  describe('Add template flow', () => {
    it('shows form with name input and textarea after clicking "Dodaj"', async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButtons = screen.getAllByRole('button', { name: /Dodaj/i });
      await user.click(addButtons[0]);

      expect(screen.getByPlaceholderText('Nazwa szablonu...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Treść szablonu...')).toBeInTheDocument();
    });

    it('calls createTemplate with correct type, name and content on save', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Click "Dodaj" for "Gwarancja" (first section)
      const addButtons = screen.getAllByRole('button', { name: /Dodaj/i });
      await user.click(addButtons[0]);

      const nameInput = screen.getByPlaceholderText('Nazwa szablonu...');
      const contentTextarea = screen.getByPlaceholderText('Treść szablonu...');

      await user.type(nameInput, 'Nowy szablon');
      await user.type(contentTextarea, 'Treść nowego szablonu');

      const saveButton = screen.getByRole('button', { name: /Zapisz/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith(
          'warranty',
          'Nowy szablon',
          'Treść nowego szablonu',
        );
      });
    });

    it('hides form after successful save', async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButtons = screen.getAllByRole('button', { name: /Dodaj/i });
      await user.click(addButtons[0]);

      const nameInput = screen.getByPlaceholderText('Nazwa szablonu...');
      const contentTextarea = screen.getByPlaceholderText('Treść szablonu...');

      await user.type(nameInput, 'Nowy szablon');
      await user.type(contentTextarea, 'Treść nowego szablonu');

      await user.click(screen.getByRole('button', { name: /Zapisz/i }));

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Nazwa szablonu...')).not.toBeInTheDocument();
      });
    });

    it('disables save button when name is empty', async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButtons = screen.getAllByRole('button', { name: /Dodaj/i });
      await user.click(addButtons[0]);

      const contentTextarea = screen.getByPlaceholderText('Treść szablonu...');
      await user.type(contentTextarea, 'Treść nowego szablonu');

      const saveButton = screen.getByRole('button', { name: /Zapisz/i });
      expect(saveButton).toBeDisabled();
    });

    it('disables save button when content is empty', async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButtons = screen.getAllByRole('button', { name: /Dodaj/i });
      await user.click(addButtons[0]);

      const nameInput = screen.getByPlaceholderText('Nazwa szablonu...');
      await user.type(nameInput, 'Nowy szablon');

      const saveButton = screen.getByRole('button', { name: /Zapisz/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Edit template flow', () => {
    it('shows form pre-filled with template data after clicking edit', async () => {
      const user = userEvent.setup();
      const template = makeTemplate();
      mockByType.mockImplementation((type) => (type === 'warranty' ? [template] : []));
      setupHookMock({ templates: [template] });

      renderComponent();

      // The template item has two icon buttons: pencil (first) and trash (second)
      // "Dodaj" buttons are not icon-only (size="sm" with text), so icon buttons have h-7 w-7 class
      const iconButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.classList.contains('h-7') && btn.classList.contains('w-7'));
      // First icon button is the pencil (edit)
      const pencilButton = iconButtons[0];
      expect(pencilButton).toBeDefined();
      await user.click(pencilButton);

      const nameInput = screen.getByPlaceholderText('Nazwa szablonu...');
      const contentTextarea = screen.getByPlaceholderText('Treść szablonu...');

      expect(nameInput).toHaveValue('Standardowa gwarancja');
      expect(contentTextarea).toHaveValue(
        'Oferujemy 12 miesięcy gwarancji na wszystkie usterki mechaniczne.',
      );
    });

    it('calls updateTemplate with id and changed name on save', async () => {
      const user = userEvent.setup();
      const template = makeTemplate();
      mockByType.mockImplementation((type) => (type === 'warranty' ? [template] : []));
      setupHookMock({ templates: [template] });

      renderComponent();

      const iconButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.classList.contains('h-7') && btn.classList.contains('w-7'));
      const pencilButton = iconButtons[0];
      await user.click(pencilButton);

      const nameInput = screen.getByPlaceholderText('Nazwa szablonu...');
      await user.clear(nameInput);
      await user.type(nameInput, 'Zaktualizowana gwarancja');

      await user.click(screen.getByRole('button', { name: /Zapisz/i }));

      await waitFor(() => {
        expect(mockUpdateTemplate).toHaveBeenCalledWith('tmpl-1', {
          name: 'Zaktualizowana gwarancja',
          content: 'Oferujemy 12 miesięcy gwarancji na wszystkie usterki mechaniczne.',
        });
      });
    });
  });

  describe('Delete template', () => {
    it('calls deleteTemplate with correct id after confirm', async () => {
      const user = userEvent.setup();
      const template = makeTemplate();
      mockByType.mockImplementation((type) => (type === 'warranty' ? [template] : []));
      setupHookMock({ templates: [template] });

      renderComponent();

      // The template item has two icon buttons: pencil (first) and trash (second)
      const iconButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.classList.contains('h-7') && btn.classList.contains('w-7'));
      const trashButton = iconButtons[1];
      expect(trashButton).toBeDefined();
      await user.click(trashButton);

      expect(vi.mocked(confirm)).toHaveBeenCalledWith(
        'Czy na pewno chcesz usunąć ten szablon?',
      );
      await waitFor(() => {
        expect(mockDeleteTemplate).toHaveBeenCalledWith('tmpl-1');
      });
    });

    it('does not call deleteTemplate when confirm returns false', async () => {
      const user = userEvent.setup();
      vi.mocked(confirm).mockReturnValue(false);
      const template = makeTemplate();
      mockByType.mockImplementation((type) => (type === 'warranty' ? [template] : []));
      setupHookMock({ templates: [template] });

      renderComponent();

      const iconButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.classList.contains('h-7') && btn.classList.contains('w-7'));
      const trashButton = iconButtons[1];
      await user.click(trashButton);

      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
  });

  describe('Cancel add', () => {
    it('hides form when "Anuluj" is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButtons = screen.getAllByRole('button', { name: /Dodaj/i });
      await user.click(addButtons[0]);

      expect(screen.getByPlaceholderText('Nazwa szablonu...')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /Anuluj/i });
      await user.click(cancelButton);

      expect(screen.queryByPlaceholderText('Nazwa szablonu...')).not.toBeInTheDocument();
    });

    it('re-enables "Dodaj" buttons after cancel', async () => {
      const user = userEvent.setup();
      renderComponent();

      const addButtons = screen.getAllByRole('button', { name: /Dodaj/i });
      await user.click(addButtons[0]);

      await user.click(screen.getByRole('button', { name: /Anuluj/i }));

      const refreshedAddButtons = screen.getAllByRole('button', { name: /Dodaj/i });
      refreshedAddButtons.forEach((btn) => expect(btn).not.toBeDisabled());
    });
  });
});
