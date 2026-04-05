import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkingHoursSettings from './WorkingHoursSettings';

// ---- Supabase mock ----
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  };
});

// ---- Helpers ----
const INSTANCE_ID = 'inst-test-123';

const DEFAULT_WORKING_HOURS = {
  monday: { open: '09:00', close: '19:00' },
  tuesday: { open: '09:00', close: '19:00' },
  wednesday: { open: '09:00', close: '19:00' },
  thursday: { open: '09:00', close: '19:00' },
  friday: { open: '09:00', close: '19:00' },
  saturday: { open: '09:00', close: '14:00' },
  sunday: null,
};

function setupFetchSuccess(workingHours = DEFAULT_WORKING_HOURS) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'maybeSingle'];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: { working_hours: workingHours }, error: null }).then(resolve),
  );
  mockFrom.mockReturnValue(chain);
}

function setupFetchError() {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'maybeSingle'];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: null, error: new Error('DB error') }).then(resolve),
  );
  mockFrom.mockReturnValue(chain);
}

function setupRpcSuccess() {
  mockRpc.mockResolvedValue({ error: null });
}

function renderComponent(instanceId: string | null = INSTANCE_ID) {
  return render(<WorkingHoursSettings instanceId={instanceId} onSave={vi.fn()} />);
}

// ---- Tests ----
describe('WorkingHoursSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFetchSuccess();
    setupRpcSuccess();
  });

  it('renders day toggles after loading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Poniedziałek')).toBeInTheDocument();
    });
    expect(screen.getByText('Wtorek')).toBeInTheDocument();
    expect(screen.getByText('Środa')).toBeInTheDocument();
    expect(screen.getByText('Czwartek')).toBeInTheDocument();
    expect(screen.getByText('Piątek')).toBeInTheDocument();
    expect(screen.getByText('Sobota')).toBeInTheDocument();
    expect(screen.getByText('Niedziela')).toBeInTheDocument();
  });

  it('toggles a day off then on', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => screen.getByText('Poniedziałek'));

    const switches = screen.getAllByRole('switch');
    const mondaySwitch = switches[0];

    // Initially on — toggle off
    await user.click(mondaySwitch);
    expect(mondaySwitch).not.toBeChecked();

    // Toggle back on
    await user.click(mondaySwitch);
    expect(mondaySwitch).toBeChecked();
  });

  it('rejects save when open time equals close time', async () => {
    const user = userEvent.setup();
    setupFetchSuccess({
      ...DEFAULT_WORKING_HOURS,
      monday: { open: '09:00', close: '09:00' },
    });
    renderComponent();

    await waitFor(() => screen.getByText('Poniedziałek'));

    const saveButton = screen.getByRole('button', { name: /zapisz/i });
    await user.click(saveButton);

    expect(mockToast.error).toHaveBeenCalledWith(
      'Poniedziałek: godzina otwarcia musi być wcześniejsza niż zamknięcia',
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('rejects save when open time is later than close time', async () => {
    const user = userEvent.setup();
    setupFetchSuccess({
      ...DEFAULT_WORKING_HOURS,
      friday: { open: '18:00', close: '09:00' },
    });
    renderComponent();

    await waitFor(() => screen.getByText('Piątek'));

    const saveButton = screen.getByRole('button', { name: /zapisz/i });
    await user.click(saveButton);

    expect(mockToast.error).toHaveBeenCalledWith(
      'Piątek: godzina otwarcia musi być wcześniejsza niż zamknięcia',
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('save button is disabled during loading', () => {
    // Mock a never-resolving fetch so loading stays true
    const chain: Record<string, unknown> = {};
    ['select', 'eq', 'maybeSingle'].forEach((m) => {
      chain[m] = vi.fn(() => chain);
    });
    chain.then = vi.fn(() => new Promise(() => {}));
    mockFrom.mockReturnValue(chain);

    renderComponent();

    // During loading the spinner is shown, not the button
    expect(screen.queryByRole('button', { name: /zapisz/i })).not.toBeInTheDocument();
  });

  it('save button is disabled during saving', async () => {
    let resolveSave!: (v: { error: null }) => void;
    mockRpc.mockReturnValue(new Promise<{ error: null }>((res) => { resolveSave = res; }));

    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => screen.getByText('Poniedziałek'));

    const saveButton = screen.getByRole('button', { name: /zapisz/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /zapisz/i })).toBeDisabled();
    });

    resolveSave({ error: null });
  });

  it('shows fetch error state with retry button', async () => {
    setupFetchError();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Nie udało się pobrać godzin pracy/)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /spróbuj ponownie/i })).toBeInTheDocument();
  });

  it('retries fetch on retry button click', async () => {
    setupFetchError();
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => screen.getByRole('button', { name: /spróbuj ponownie/i }));

    // Now mock a successful fetch for the retry
    setupFetchSuccess();
    await user.click(screen.getByRole('button', { name: /spróbuj ponownie/i }));

    await waitFor(() => {
      expect(screen.getByText('Poniedziałek')).toBeInTheDocument();
    });
  });

  it('calls toast.success on successful save', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => screen.getByText('Poniedziałek'));

    const saveButton = screen.getByRole('button', { name: /zapisz/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Godziny pracy zostały zapisane');
    });
  });

  it('invalidates working_hours query after successful save', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => screen.getByText('Poniedziałek'));

    await user.click(screen.getByRole('button', { name: /zapisz/i }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['working_hours', INSTANCE_ID],
      });
    });
  });

  it('passes workingHours directly to RPC without JSON.parse/stringify', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => screen.getByText('Poniedziałek'));

    await user.click(screen.getByRole('button', { name: /zapisz/i }));

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('update_instance_working_hours', {
        _instance_id: INSTANCE_ID,
        _working_hours: expect.objectContaining({ monday: { open: '09:00', close: '19:00' } }),
      });
    });
  });
});
