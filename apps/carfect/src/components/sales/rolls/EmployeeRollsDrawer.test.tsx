import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, subMonths, addMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import EmployeeRollsDrawer from './EmployeeRollsDrawer';
import type { SalesRollUsage } from '../types/rolls';

// ─── Mock @shared/ui Sheet as simple div ──────────────────────

vi.mock('@shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/ui')>();
  return {
    ...actual,
    Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? <div>{children}</div> : null,
    SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  };
});

// ─── Mock rollService ──────────────────────────────────────────

vi.mock('../services/rollService', () => ({
  fetchWorkerRollUsagesForMonth: vi.fn(),
  fetchWorkerProfiles: vi.fn().mockResolvedValue([]),
  createScrapUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { fetchWorkerRollUsagesForMonth } from '../services/rollService';

const mockFetch = vi.mocked(fetchWorkerRollUsagesForMonth);

// ─── Helpers ──────────────────────────────────────────────────

const makeUsage = (overrides: Partial<SalesRollUsage> = {}): SalesRollUsage => ({
  id: 'usage-1',
  rollId: 'roll-1',
  orderId: null,
  orderItemId: null,
  usedM2: 3.05,
  usedMb: 2.0,
  source: 'worker',
  workerName: 'Jan Kowalski',
  vehicleName: 'BMW E46',
  note: null,
  createdAt: '2026-04-10T10:00:00Z',
  ...overrides,
});

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  instanceId: 'inst-1',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue([]);
});

// ─── Tests ────────────────────────────────────────────────────

describe('EmployeeRollsDrawer', () => {
  it('renders month name for current month', async () => {
    mockFetch.mockResolvedValue([]);
    render(<EmployeeRollsDrawer {...defaultProps} />);

    const expected = format(new Date(), 'LLLL yyyy', { locale: pl });
    expect(screen.getByText(new RegExp(expected, 'i'))).toBeInTheDocument();
  });

  it('shows empty state when no usages', async () => {
    mockFetch.mockResolvedValue([]);
    render(<EmployeeRollsDrawer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Brak zużyć w tym miesiącu')).toBeInTheDocument();
    });
  });

  it('groups usages by worker name', async () => {
    mockFetch.mockResolvedValue([
      makeUsage({ id: 'u1', workerName: 'Jan Kowalski' }),
      makeUsage({ id: 'u2', workerName: 'Anna Nowak', usedM2: 1.5, usedMb: 1.0 }),
    ]);
    render(<EmployeeRollsDrawer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    });
  });

  it('shows per-worker total m²', async () => {
    mockFetch.mockResolvedValue([
      makeUsage({ id: 'u1', workerName: 'Jan Kowalski', usedM2: 3.05 }),
      makeUsage({ id: 'u2', workerName: 'Jan Kowalski', usedM2: 1.95 }),
    ]);
    render(<EmployeeRollsDrawer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('5.00 m²')).toBeInTheDocument();
    });
  });

  it('shows grand total m²', async () => {
    mockFetch.mockResolvedValue([
      makeUsage({ id: 'u1', workerName: 'Jan Kowalski', usedM2: 3.05 }),
      makeUsage({ id: 'u2', workerName: 'Anna Nowak', usedM2: 1.95 }),
    ]);
    render(<EmployeeRollsDrawer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Łącznie wszyscy: 5.00 m²')).toBeInTheDocument();
    });
  });

  it('navigates to previous month on left click', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue([]);
    render(<EmployeeRollsDrawer {...defaultProps} />);

    await user.click(screen.getByLabelText('Poprzedni miesiąc'));

    const expectedMonth = format(subMonths(new Date(), 1), 'LLLL yyyy', { locale: pl });
    expect(screen.getByText(new RegExp(expectedMonth, 'i'))).toBeInTheDocument();
  });

  it('navigates to next month on right click', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue([]);
    render(<EmployeeRollsDrawer {...defaultProps} />);

    await user.click(screen.getByLabelText('Następny miesiąc'));

    const expectedMonth = format(addMonths(new Date(), 1), 'LLLL yyyy', { locale: pl });
    expect(screen.getByText(new RegExp(expectedMonth, 'i'))).toBeInTheDocument();
  });

  it('shows vehicle name in table', async () => {
    mockFetch.mockResolvedValue([
      makeUsage({ id: 'u1', workerName: 'Jan Kowalski', vehicleName: 'BMW E46' }),
    ]);
    render(<EmployeeRollsDrawer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('BMW E46')).toBeInTheDocument();
    });
  });
});
