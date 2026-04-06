import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HintFormDialog } from './HintFormDialog';

// ---- Supabase mock ----
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

function setupInsertMock(error: object | null = null) {
  mockFrom.mockReturnValue({
    insert: vi.fn().mockResolvedValue({ error }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error }),
    }),
  });
}

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  hint: null,
  onSuccess: vi.fn(),
};

describe('HintFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('HFD-U-001: renders form fields', () => {
    render(<HintFormDialog {...defaultProps} />);

    expect(screen.getByLabelText(/tytuł/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/treść/i)).toBeInTheDocument();
  });

  it('HFD-U-002: shows validation error when title is empty', async () => {
    const user = userEvent.setup();
    render(<HintFormDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /dodaj wskazówkę/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Tytuł jest wymagany');
    });
  });

  it('HFD-U-003: shows validation error when body is empty', async () => {
    const user = userEvent.setup();
    render(<HintFormDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/tytuł/i), 'Mój tytuł');
    // Clear pre-selected roles to also test that path, but keep admin checked
    await user.click(screen.getByRole('button', { name: /dodaj wskazówkę/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Treść jest wymagana');
    });
  });

  it('HFD-U-004: shows target_element_id field only when type is tooltip', async () => {
    const user = userEvent.setup();
    render(<HintFormDialog {...defaultProps} />);

    // Default type is popup — field should not be visible
    expect(screen.queryByLabelText(/id elementu/i)).not.toBeInTheDocument();

    // Switch to tooltip — use the select item with full label text
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /tooltip \(zakotwiczony/i }));

    expect(screen.getByLabelText(/id elementu/i)).toBeInTheDocument();
  });

  it('HFD-U-005: calls onSuccess and closes dialog on successful insert', async () => {
    const user = userEvent.setup();
    setupInsertMock(null);
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();

    render(<HintFormDialog open onOpenChange={onOpenChange} hint={null} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/tytuł/i), 'Nowa wskazówka');
    await user.type(screen.getByLabelText(/treść/i), 'Opis treści');
    await user.click(screen.getByRole('button', { name: /dodaj wskazówkę/i }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Wskazówka dodana');
      expect(onSuccess).toHaveBeenCalledOnce();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('HFD-U-006: prefills form fields when editing existing hint', () => {
    const hint = {
      id: 'h1',
      type: 'infobox' as const,
      title: 'Istniejący tytuł',
      body: 'Istniejąca treść',
      image_url: null,
      target_element_id: null,
      route_pattern: '/admin',
      target_roles: ['admin'],
      delay_ms: 500,
      active: false,
    };

    render(<HintFormDialog open onOpenChange={vi.fn()} hint={hint} onSuccess={vi.fn()} />);

    expect(screen.getByDisplayValue('Istniejący tytuł')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Istniejąca treść')).toBeInTheDocument();
  });
});
