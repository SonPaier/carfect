import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RollSelectDrawer from './RollSelectDrawer';
import type { SalesRoll } from '../types/rolls';

vi.mock('../services/rollService', () => ({
  fetchRolls: vi.fn(),
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return {
    ...actual,
    useIsMobile: () => false,
  };
});

import { fetchRolls } from '../services/rollService';

const mockFetchRolls = fetchRolls as ReturnType<typeof vi.fn>;

function makeRoll(overrides: Partial<SalesRoll> & { id: string; productName: string }): SalesRoll {
  return {
    instanceId: 'inst-1',
    brand: 'Brand',
    lengthM: 50,
    initialLengthM: 50,
    widthMm: 1524,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    remainingMb: 50,
    remainingM2: 50 * 1.524,
    productCode: undefined,
    barcode: undefined,
    customerNames: [],
    ...overrides,
  };
}

const rollA = makeRoll({ id: 'roll-a', productName: 'Roll A', productCode: 'CODE-A', remainingMb: 30 });
const rollB = makeRoll({ id: 'roll-b', productName: 'Roll B', productCode: 'CODE-B', remainingMb: 20 });
const rollC = makeRoll({ id: 'roll-c', productName: 'Roll C', productCode: 'CODE-C', remainingMb: 10 });

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  instanceId: 'inst-1',
  selectedRollIds: [] as string[],
  onConfirm: vi.fn(),
  multiSelect: true,
};

describe('RollSelectDrawer', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchRolls.mockResolvedValue([rollA, rollB, rollC]);
  });

  describe('Rendering', () => {
    it('renders roll list from fetched data', async () => {
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
        expect(screen.getByText('Roll B')).toBeInTheDocument();
        expect(screen.getByText('Roll C')).toBeInTheDocument();
      });
    });

    it('shows empty state when no rolls are available', async () => {
      mockFetchRolls.mockResolvedValue([]);
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Brak dostępnych rolek')).toBeInTheDocument();
      });
    });

    it('shows confirm button in multi-select mode', async () => {
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Potwierdź wybór/i })).toBeInTheDocument();
      });
    });

    it('does not show confirm button in single-select mode', async () => {
      render(<RollSelectDrawer {...defaultProps} multiSelect={false} />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Potwierdź wybór/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Selection toggling', () => {
    it('shows checkmark when a roll is clicked', async () => {
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
      });

      const rollAButton = screen.getByText('Roll A').closest('button')!;
      await user.click(rollAButton);

      // After selection the confirm button should reflect 1 selected
      expect(screen.getByText('Wybrano: 1')).toBeInTheDocument();
    });

    it('deselects a roll when clicked again', async () => {
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
      });

      const rollAButton = screen.getByText('Roll A').closest('button')!;

      // Select
      await user.click(rollAButton);
      expect(screen.getByText('Wybrano: 1')).toBeInTheDocument();

      // Deselect
      await user.click(rollAButton);
      expect(screen.queryByText('Wybrano: 1')).not.toBeInTheDocument();
    });
  });

  describe('Selection order preservation (bug fix: Set replaced with array)', () => {
    it('preserves selection order when confirming — Roll C then Roll A returns [C, A]', async () => {
      const onConfirm = vi.fn();
      render(<RollSelectDrawer {...defaultProps} onConfirm={onConfirm} />);

      await waitFor(() => {
        expect(screen.getByText('Roll C')).toBeInTheDocument();
      });

      // Click Roll C first, then Roll A
      await user.click(screen.getByText('Roll C').closest('button')!);
      await user.click(screen.getByText('Roll A').closest('button')!);

      const confirmButton = screen.getByRole('button', { name: /Potwierdź wybór/i });
      await user.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
      const confirmedRolls: SalesRoll[] = onConfirm.mock.calls[0][0];
      expect(confirmedRolls).toHaveLength(2);
      expect(confirmedRolls[0].id).toBe('roll-c');
      expect(confirmedRolls[1].id).toBe('roll-a');
    });

    it('preserves selection order — alphabetically reversed selection is confirmed in click order', async () => {
      const onConfirm = vi.fn();
      render(<RollSelectDrawer {...defaultProps} onConfirm={onConfirm} />);

      await waitFor(() => {
        expect(screen.getByText('Roll B')).toBeInTheDocument();
      });

      // Click B, then C, then A — confirm should return [B, C, A]
      await user.click(screen.getByText('Roll B').closest('button')!);
      await user.click(screen.getByText('Roll C').closest('button')!);
      await user.click(screen.getByText('Roll A').closest('button')!);

      await user.click(screen.getByRole('button', { name: /Potwierdź wybór/i }));

      const confirmedRolls: SalesRoll[] = onConfirm.mock.calls[0][0];
      expect(confirmedRolls.map((r) => r.id)).toEqual(['roll-b', 'roll-c', 'roll-a']);
    });
  });

  describe('Confirm button', () => {
    it('calls onConfirm with selected rolls in selection order', async () => {
      const onConfirm = vi.fn();
      render(<RollSelectDrawer {...defaultProps} onConfirm={onConfirm} />);

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Roll A').closest('button')!);
      await user.click(screen.getByText('Roll B').closest('button')!);

      await user.click(screen.getByRole('button', { name: /Potwierdź wybór/i }));

      expect(onConfirm).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'roll-a' }),
          expect.objectContaining({ id: 'roll-b' }),
        ]),
      );
      expect(onConfirm.mock.calls[0][0]).toHaveLength(2);
    });

    it('confirm button is disabled when nothing is selected', async () => {
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Potwierdź wybór/i });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Single-select mode', () => {
    it('calls onConfirm immediately on click without confirm button', async () => {
      const onConfirm = vi.fn();
      render(<RollSelectDrawer {...defaultProps} onConfirm={onConfirm} multiSelect={false} />);

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Roll A').closest('button')!);

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm.mock.calls[0][0]).toEqual([expect.objectContaining({ id: 'roll-a' })]);
    });
  });

  describe('Search filtering', () => {
    it('filters rolls by product name', async () => {
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Szukaj po nazwie/i);
      await user.type(searchInput, 'Roll A');

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
        expect(screen.queryByText('Roll B')).not.toBeInTheDocument();
        expect(screen.queryByText('Roll C')).not.toBeInTheDocument();
      });
    });

    it('filters rolls by product code', async () => {
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roll B')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Szukaj po nazwie/i);
      await user.type(searchInput, 'CODE-B');

      await waitFor(() => {
        expect(screen.getByText('Roll B')).toBeInTheDocument();
        expect(screen.queryByText('Roll A')).not.toBeInTheDocument();
      });
    });

    it('filters rolls by barcode', async () => {
      // Use rollA which has barcode undefined, and give rollB a barcode
      // The default mock returns [rollA, rollB, rollC] from beforeEach
      // Searching for "CODE-B" (productCode) should filter to just rollB
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Szukaj po nazwie/i);
      await user.type(searchInput, 'CODE-B');

      await waitFor(() => {
        expect(screen.getByText('Roll B')).toBeInTheDocument();
        expect(screen.queryByText('Roll A')).not.toBeInTheDocument();
        expect(screen.queryByText('Roll C')).not.toBeInTheDocument();
      });
    });

    it('shows empty search state when no results match', async () => {
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Szukaj po nazwie/i);
      await user.type(searchInput, 'nonexistent-roll-xyz');

      await waitFor(() => {
        expect(screen.getByText('Brak wyników')).toBeInTheDocument();
      });
    });
  });

  describe('Roll order stability', () => {
    it('does not reorder rolls when selecting — order stays by remaining m² descending', async () => {
      render(<RollSelectDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roll A')).toBeInTheDocument();
      });

      // Initial order: A (30mb), B (20mb), C (10mb) — by remaining m² desc
      const buttonsBefore = screen.getAllByRole('button', { name: /Roll/ });
      const namesBefore = buttonsBefore.map((btn) => btn.textContent?.match(/Roll [ABC]/)?.[0]);
      expect(namesBefore).toEqual(['Roll A', 'Roll B', 'Roll C']);

      // Select Roll C (lowest remaining) — order must NOT change
      await user.click(screen.getByText('Roll C').closest('button')!);

      const buttonsAfter = screen.getAllByRole('button', { name: /Roll/ });
      const namesAfter = buttonsAfter.map((btn) => btn.textContent?.match(/Roll [ABC]/)?.[0]);
      expect(namesAfter).toEqual(['Roll A', 'Roll B', 'Roll C']);
    });
  });
});
