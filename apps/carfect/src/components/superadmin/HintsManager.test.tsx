import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HintsManager } from './HintsManager';

// ---- Supabase mock ----
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

// HintFormDialog is heavy — stub it out
vi.mock('./HintFormDialog', () => ({
  HintFormDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
  }) =>
    open ? (
      <div data-testid="hint-form-dialog">
        <button onClick={() => onOpenChange(false)}>Zamknij formularz</button>
      </div>
    ) : null,
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return {
    ...actual,
    ConfirmDialog: ({
      open,
      onConfirm,
      onOpenChange,
    }: {
      open: boolean;
      onConfirm: () => void;
      onOpenChange: (v: boolean) => void;
    }) =>
      open ? (
        <div data-testid="confirm-dialog">
          <button onClick={onConfirm}>Potwierdź</button>
          <button onClick={() => onOpenChange(false)}>Anuluj</button>
        </div>
      ) : null,
  };
});

// ---- Helpers ----
const makeHint = (overrides: object = {}) => ({
  id: 'h1',
  type: 'popup',
  title: 'Test hint',
  body: 'Body',
  image_url: null,
  target_element_id: null,
  route_pattern: '/admin',
  target_roles: ['admin'],
  delay_ms: 0,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

function setupSupabaseMock(hints: ReturnType<typeof makeHint>[]) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: hints, error: null }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });
}

describe('HintsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('HM-U-001: shows loading spinner initially', () => {
    setupSupabaseMock([]);
    const { container } = render(<HintsManager />);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('HM-U-002: renders list of hints after load', async () => {
    setupSupabaseMock([makeHint({ title: 'Mój popup' })]);
    render(<HintsManager />);

    await waitFor(() => {
      expect(screen.getByText('Mój popup')).toBeInTheDocument();
    });
  });

  it('HM-U-003: shows empty state when no hints', async () => {
    setupSupabaseMock([]);
    render(<HintsManager />);

    await waitFor(() => {
      expect(screen.getByText(/Brak wskazówek/i)).toBeInTheDocument();
    });
  });

  it('HM-U-004: opens form dialog when clicking "Nowa wskazówka"', async () => {
    const user = userEvent.setup();
    setupSupabaseMock([]);
    render(<HintsManager />);

    await waitFor(() => screen.getByText(/Brak wskazówek/i));

    await user.click(screen.getByRole('button', { name: /nowa wskazówka/i }));

    expect(screen.getByTestId('hint-form-dialog')).toBeInTheDocument();
  });

  it('HM-U-005: opens confirm dialog when clicking delete', async () => {
    const user = userEvent.setup();
    setupSupabaseMock([makeHint()]);
    render(<HintsManager />);

    await waitFor(() => screen.getByText('Test hint'));

    await user.click(screen.getByRole('button', { name: /usuń/i }));

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('HM-U-006: deletes hint after confirm and shows success toast', async () => {
    const user = userEvent.setup();
    setupSupabaseMock([makeHint()]);
    render(<HintsManager />);

    await waitFor(() => screen.getByText('Test hint'));

    await user.click(screen.getByRole('button', { name: /usuń/i }));
    await user.click(screen.getByRole('button', { name: /potwierdź/i }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Wskazówka usunięta');
    });
  });
});
