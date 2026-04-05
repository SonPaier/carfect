import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeeklySchedule from './WeeklySchedule';
import type { Employee } from '@/hooks/useEmployees';
import { resetSupabaseMocks } from '@/test/mocks/supabase';

// ============================================================
// Module mocks
// ============================================================

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockCreateDayOffMutateAsync = vi.fn();
const mockDeleteDayOffMutateAsync = vi.fn();

vi.mock('@/hooks/useTimeEntries', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/useTimeEntries')>();
  return {
    ...original,
    useTimeEntries: vi.fn(() => ({ data: [] })),
    useTimeEntriesForDateRange: vi.fn(() => ({ data: [] })),
    useCreateTimeEntry: vi.fn(() => ({ mutateAsync: mockCreateMutateAsync })),
    useUpdateTimeEntry: vi.fn(() => ({ mutateAsync: mockUpdateMutateAsync })),
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

const renderComponent = () => {
  const user = userEvent.setup();
  const result = render(<WeeklySchedule employee={mockEmployee} instanceId={INSTANCE_ID} />);
  return { ...result, user };
};

// Helper to fill time inputs and click Save
const fillTimeAndSave = async (
  user: ReturnType<typeof userEvent.setup>,
  startTime: string,
  endTime: string,
) => {
  const timeInputs = screen.getAllByDisplayValue('');
  // Filter to only time inputs
  const startInput = timeInputs.find(
    (el) => el.getAttribute('type') === 'time' && !el.getAttribute('value'),
  ) || screen.getAllByRole('textbox').length > 0
    ? (screen.container || document).querySelectorAll('input[type="time"]')[0]
    : null;

  const inputs = document.querySelectorAll('input[type="time"]');
  if (inputs.length >= 2) {
    fireEvent.change(inputs[0], { target: { value: startTime } });
    fireEvent.change(inputs[1], { target: { value: endTime } });
  }

  const saveButton = screen.getByRole('button', { name: /zapisz/i });
  await user.click(saveButton);
};

// ============================================================
// Tests
// ============================================================

describe('WeeklySchedule', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    vi.mocked(useTimeEntries).mockReturnValue({ data: [] } as ReturnType<typeof useTimeEntries>);
    mockCreateMutateAsync.mockResolvedValue({ id: 'new-entry' });
    mockUpdateMutateAsync.mockResolvedValue({ id: 'updated-entry' });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the week navigation buttons', () => {
      renderComponent();
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders 7 day cells for the current week', () => {
      renderComponent();
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThanOrEqual(9);
    });

    it('shows the editor panel with time inputs by default (today is auto-selected)', () => {
      renderComponent();
      const timeInputs = document.querySelectorAll('input[type="time"]');
      expect(timeInputs.length).toBe(2);
      expect(screen.getByRole('button', { name: /zapisz/i })).toBeInTheDocument();
    });
  });

  describe('save time entry', () => {
    it('creates a new time entry when Save is clicked with valid times', async () => {
      const { user } = renderComponent();

      await fillTimeAndSave(user, '08:00', '16:00');

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledTimes(1);
        expect(mockCreateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            employee_id: 'emp-1',
            entry_type: 'manual',
          }),
        );
      });
    });

    it('passes entry_date matching the selected day', async () => {
      const { user } = renderComponent();

      await fillTimeAndSave(user, '09:00', '17:00');

      await waitFor(() => {
        const call = mockCreateMutateAsync.mock.calls[0][0];
        expect(call.entry_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('shows success toast after successful save', async () => {
      const { user } = renderComponent();

      await fillTimeAndSave(user, '08:00', '16:00');

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('shows error toast when end time is before start time', async () => {
      const { user } = renderComponent();

      await fillTimeAndSave(user, '16:00', '08:00');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
      expect(mockCreateMutateAsync).not.toHaveBeenCalled();
    });

    it('shows error toast when times are empty', async () => {
      const { user } = renderComponent();

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
      expect(mockCreateMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('shows error toast when save throws', async () => {
      mockCreateMutateAsync.mockRejectedValue(new Error('DB error'));

      const { user } = renderComponent();

      await fillTimeAndSave(user, '08:00', '16:00');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });
});
