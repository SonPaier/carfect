import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeeklySchedule from './WeeklySchedule';
import type { Employee } from '@/hooks/useEmployees';
import { resetSupabaseMocks } from '@/test/mocks/supabase';

// ============================================================
// Module mocks — must be at top level for hoisting
// ============================================================

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mocked mutation spies — captured per test via module-level vars
const mockUpsertMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockCreateDayOffMutateAsync = vi.fn();
const mockDeleteDayOffMutateAsync = vi.fn();

vi.mock('@/hooks/useTimeEntries', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/useTimeEntries')>();
  return {
    ...original,
    useTimeEntries: vi.fn(() => ({ data: [] })),
    useTimeEntriesForDateRange: vi.fn(() => ({ data: [] })),
    useUpsertTimeEntry: vi.fn(() => ({ mutateAsync: mockUpsertMutateAsync })),
    useDeleteTimeEntry: vi.fn(() => ({ mutateAsync: mockDeleteMutateAsync })),
  };
});

vi.mock('@/hooks/useEmployeeDaysOff', () => ({
  useEmployeeDaysOff: vi.fn(() => ({ data: [] })),
  useCreateEmployeeDayOff: vi.fn(() => ({ mutateAsync: mockCreateDayOffMutateAsync })),
  useDeleteEmployeeDayOff: vi.fn(() => ({ mutateAsync: mockDeleteDayOffMutateAsync })),
}));

vi.mock('@/hooks/useWorkingHours', () => ({
  useWorkingHours: vi.fn(() => ({ data: null })),
}));

// ============================================================
// Import hooks after mocking
// ============================================================
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { toast } from 'sonner';

// ============================================================
// Constants
// ============================================================

const INSTANCE_ID = 'inst-1';

const mockEmployee: Employee = {
  id: 'emp-1',
  instance_id: INSTANCE_ID,
  name: 'Jan Kowalski',
  email: null,
  phone: null,
  position: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

// ============================================================
// Helpers
// ============================================================

const renderComponent = () => {
  const user = userEvent.setup();
  const result = render(<WeeklySchedule employee={mockEmployee} instanceId={INSTANCE_ID} />);
  return { ...result, user };
};

// ============================================================
// Tests
// ============================================================

describe('WeeklySchedule', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();

    // Default: no time entries loaded
    vi.mocked(useTimeEntries).mockReturnValue({ data: [] } as ReturnType<typeof useTimeEntries>);

    // Default mutation results
    mockUpsertMutateAsync.mockResolvedValue({ id: 'new-entry' });
    mockDeleteMutateAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  // ----------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------

  describe('rendering', () => {
    it('renders the week navigation buttons', () => {
      renderComponent();
      const buttons = screen.getAllByRole('button');
      // ChevronLeft / ChevronRight nav buttons should be present
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders 7 day cells for the current week', () => {
      renderComponent();
      // Each day cell is a button in the week grid (plus nav buttons)
      const allButtons = screen.getAllByRole('button');
      // At least 7 day-cell buttons plus 2 nav buttons
      expect(allButtons.length).toBeGreaterThanOrEqual(9);
    });

    it('shows the editor panel by default (today is auto-selected)', () => {
      renderComponent();
      // Hours select trigger is visible
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2); // hours + minutes selects
    });
  });

  // ----------------------------------------------------------
  // saveEntry — upsert path (totalMinutes > 0)
  // ----------------------------------------------------------

  describe('saveEntry — upsert path', () => {
    it('calls upsertTimeEntry.mutateAsync when hours value is changed to non-zero', async () => {
      const { user } = renderComponent();

      // Open the hours select (first combobox)
      const comboboxes = screen.getAllByRole('combobox');
      const hoursSelect = comboboxes[0];

      await user.click(hoursSelect);

      // Pick "8" hours from the dropdown list
      const option = await screen.findByRole('option', { name: '8' });
      await user.click(option);

      await waitFor(() => {
        expect(mockUpsertMutateAsync).toHaveBeenCalledTimes(1);
      });
    });

    it('passes correct employee_id to upsertTimeEntry', async () => {
      const { user } = renderComponent();

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const option = await screen.findByRole('option', { name: '4' });
      await user.click(option);

      await waitFor(() => {
        expect(mockUpsertMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ employee_id: 'emp-1' }),
        );
      });
    });

    it('passes entry_date matching the selected day', async () => {
      const { user } = renderComponent();

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const option = await screen.findByRole('option', { name: '2' });
      await user.click(option);

      await waitFor(() => {
        const call = mockUpsertMutateAsync.mock.calls[0][0];
        // entry_date must be a valid date string (yyyy-MM-dd)
        expect(call.entry_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('does NOT call deleteTimeEntry when totalMinutes > 0', async () => {
      const { user } = renderComponent();

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const option = await screen.findByRole('option', { name: '6' });
      await user.click(option);

      await waitFor(() => {
        expect(mockUpsertMutateAsync).toHaveBeenCalledTimes(1);
      });
      expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    });

    it('shows success toast after successful upsert', async () => {
      const { user } = renderComponent();

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const option = await screen.findByRole('option', { name: '3' });
      await user.click(option);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });
  });

  // ----------------------------------------------------------
  // saveEntry — delete path (totalMinutes === 0)
  // ----------------------------------------------------------

  describe('saveEntry — delete path (totalMinutes === 0)', () => {
    it('does not call delete or upsert when hours=0 and minutes=0 and no entry exists', async () => {
      // No entries loaded, default 0h 0min selected
      vi.mocked(useTimeEntries).mockReturnValue({ data: [] } as ReturnType<typeof useTimeEntries>);

      const { user } = renderComponent();

      // Open hours select and explicitly choose "0"
      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const option = await screen.findByRole('option', { name: '0' });
      await user.click(option);

      // Wait briefly to ensure no async calls are made
      await new Promise((r) => setTimeout(r, 50));
      expect(mockUpsertMutateAsync).not.toHaveBeenCalled();
      expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    });

    it('calls deleteTimeEntry with entry id when totalMinutes=0 and entry exists', async () => {
      const { format: dateFmt } = await import('date-fns');
      const todayStr = dateFmt(new Date(), 'yyyy-MM-dd');

      // Simulate an existing entry for today with entry_number=1
      const existingEntry = {
        id: 'existing-entry-id',
        instance_id: INSTANCE_ID,
        employee_id: 'emp-1',
        entry_date: todayStr,
        entry_number: 1,
        entry_type: 'manual',
        start_time: `${todayStr}T08:00:00.000Z`,
        end_time: `${todayStr}T10:00:00.000Z`,
        total_minutes: 120,
        is_auto_closed: null,
        created_at: null,
        updated_at: null,
      };

      vi.mocked(useTimeEntries).mockReturnValue({
        data: [existingEntry],
      } as ReturnType<typeof useTimeEntries>);

      const { user } = renderComponent();

      // Wait for component to load entry data
      await waitFor(() => {
        // The hours select should reflect the existing 2h entry
        const comboboxes = screen.getAllByRole('combobox');
        expect(comboboxes[0]).toBeInTheDocument();
      });

      // Set hours to 0 (triggers totalMinutes=0 path)
      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const zeroOption = await screen.findByRole('option', { name: '0' });
      await user.click(zeroOption);

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith('existing-entry-id');
      });
    });

    it('does NOT call upsert when totalMinutes is 0', async () => {
      const { format: dateFmt } = await import('date-fns');
      const todayStr = dateFmt(new Date(), 'yyyy-MM-dd');

      const existingEntry = {
        id: 'existing-entry-id',
        instance_id: INSTANCE_ID,
        employee_id: 'emp-1',
        entry_date: todayStr,
        entry_number: 1,
        entry_type: 'manual',
        start_time: null,
        end_time: null,
        total_minutes: 60,
        is_auto_closed: null,
        created_at: null,
        updated_at: null,
      };

      vi.mocked(useTimeEntries).mockReturnValue({
        data: [existingEntry],
      } as ReturnType<typeof useTimeEntries>);

      const { user } = renderComponent();

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const zeroOption = await screen.findByRole('option', { name: '0' });
      await user.click(zeroOption);

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalled();
      });
      expect(mockUpsertMutateAsync).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // Race condition regression
  // ----------------------------------------------------------

  describe('race condition regression — upsert works even when minutesByDate is empty', () => {
    it('calls upsert successfully when no existing entries are loaded (minutesByDate empty)', async () => {
      // This is the exact race condition: data not yet loaded, minutesByDate is empty Map
      vi.mocked(useTimeEntries).mockReturnValue({ data: [] } as ReturnType<typeof useTimeEntries>);

      const { user } = renderComponent();

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const option = await screen.findByRole('option', { name: '5' });
      await user.click(option);

      // upsert must be called regardless of whether minutesByDate has data
      await waitFor(() => {
        expect(mockUpsertMutateAsync).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call any legacy create/update — only upsert is used', async () => {
      // Regression: old code did create-or-update branching based on local state.
      // New code always uses upsert. Verify no separate create hook is invoked.
      // We verify by checking that upsertMutateAsync is called (not a different spy).
      vi.mocked(useTimeEntries).mockReturnValue({ data: [] } as ReturnType<typeof useTimeEntries>);

      const { user } = renderComponent();

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const option = await screen.findByRole('option', { name: '1' });
      await user.click(option);

      await waitFor(() => {
        expect(mockUpsertMutateAsync).toHaveBeenCalledTimes(1);
      });
      // deleteTimeEntry should not be called on a save path with non-zero value
      expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // Error handling
  // ----------------------------------------------------------

  describe('error handling', () => {
    it('shows error toast when upsert throws', async () => {
      mockUpsertMutateAsync.mockRejectedValue(new Error('DB error'));

      const { user } = renderComponent();

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const option = await screen.findByRole('option', { name: '2' });
      await user.click(option);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('shows error toast when delete throws', async () => {
      const { format: dateFmt } = await import('date-fns');
      const todayStr = dateFmt(new Date(), 'yyyy-MM-dd');

      const existingEntry = {
        id: 'entry-to-delete',
        instance_id: INSTANCE_ID,
        employee_id: 'emp-1',
        entry_date: todayStr,
        entry_number: 1,
        entry_type: 'manual',
        start_time: null,
        end_time: null,
        total_minutes: 60,
        is_auto_closed: null,
        created_at: null,
        updated_at: null,
      };

      vi.mocked(useTimeEntries).mockReturnValue({
        data: [existingEntry],
      } as ReturnType<typeof useTimeEntries>);

      mockDeleteMutateAsync.mockRejectedValue(new Error('Delete failed'));

      const { user } = renderComponent();

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const zeroOption = await screen.findByRole('option', { name: '0' });
      await user.click(zeroOption);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });
});
