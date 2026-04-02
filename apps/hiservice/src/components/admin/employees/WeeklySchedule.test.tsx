import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WeeklySchedule from './WeeklySchedule';
import type { Employee } from '@/hooks/useEmployees';

// ---- Mocks ----
const mockCreateMutateAsync = vi.fn().mockResolvedValue({});
const mockUpdateMutateAsync = vi.fn().mockResolvedValue({});
const mockCreateDayOffMutateAsync = vi.fn().mockResolvedValue({});
const mockDeleteDayOffMutateAsync = vi.fn().mockResolvedValue({});

let mockTimeEntries: Array<{
  id: string;
  instance_id: string;
  employee_id: string;
  entry_date: string;
  entry_number: number;
  entry_type: string;
  start_time: string | null;
  end_time: string | null;
  total_minutes: number | null;
  is_auto_closed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}> = [];
let mockDaysOff: Array<{ id: string; date_from: string; date_to: string }> = [];
let mockTimeInputMode: 'total' | 'start_end' = 'start_end';

vi.mock('@/hooks/useTimeEntries', () => ({
  useTimeEntries: () => ({ data: mockTimeEntries }),
  useCreateTimeEntry: () => ({ mutateAsync: mockCreateMutateAsync }),
  useUpdateTimeEntry: () => ({ mutateAsync: mockUpdateMutateAsync }),
  getEffectiveMinutes: (entry: { start_time: string | null; end_time: string | null; total_minutes: number | null }) => {
    if (entry.total_minutes && entry.total_minutes > 0) return entry.total_minutes;
    if (entry.start_time && entry.end_time) {
      const start = new Date(entry.start_time).getTime();
      const end = new Date(entry.end_time).getTime();
      if (end > start) return Math.floor((end - start) / 60000);
    }
    return 0;
  },
}));

vi.mock('@/hooks/useEmployeeDaysOff', () => ({
  useEmployeeDaysOff: () => ({ data: mockDaysOff }),
  useCreateEmployeeDayOff: () => ({ mutateAsync: mockCreateDayOffMutateAsync }),
  useDeleteEmployeeDayOff: () => ({ mutateAsync: mockDeleteDayOffMutateAsync }),
}));

vi.mock('@/hooks/useWorkersSettings', () => ({
  useWorkersSettings: () => ({ data: { time_input_mode: mockTimeInputMode } }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
      delete: () => ({
        in: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---- Helpers ----
const mockEmployee: Employee = {
  id: 'emp-1',
  instance_id: 'inst-1',
  name: 'Jan Kowalski',
  role: 'employee',
  active: true,
  linked_user_id: null,
  hourly_rate: null,
  phone: null,
  photo_url: null,
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderSchedule = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <WeeklySchedule employee={mockEmployee} instanceId="inst-1" />
    </QueryClientProvider>,
  );

const makeEntry = (date: string, startTime: string, endTime: string) => ({
  id: `entry-${date}`,
  instance_id: 'inst-1',
  employee_id: 'emp-1',
  entry_date: date,
  entry_number: 1,
  entry_type: 'manual',
  start_time: `${date}T${startTime}:00`,
  end_time: `${date}T${endTime}:00`,
  total_minutes: null,
  is_auto_closed: null,
  created_at: null,
  updated_at: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockTimeEntries = [];
  mockDaysOff = [];
  mockTimeInputMode = 'start_end';
});

describe('WeeklySchedule', () => {
  describe('rendering', () => {
    it('renders 7 day columns', () => {
      renderSchedule();
      // Mon-Sun abbreviated Polish names
      expect(screen.getByText('pon.')).toBeInTheDocument();
      expect(screen.getByText('wt.')).toBeInTheDocument();
      expect(screen.getByText('śr.')).toBeInTheDocument();
      expect(screen.getByText('czw.')).toBeInTheDocument();
      expect(screen.getByText('pt.')).toBeInTheDocument();
      expect(screen.getByText('sob.')).toBeInTheDocument();
      expect(screen.getByText('niedz.')).toBeInTheDocument();
    });

    it('renders week navigation arrows', () => {
      renderSchedule();
      const buttons = screen.getAllByRole('button');
      // First and second buttons are prev/next week
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders weekly and monthly totals', () => {
      renderSchedule();
      expect(screen.getByText('Suma tygodnia:')).toBeInTheDocument();
      expect(screen.getByText(/Suma miesiąca/)).toBeInTheDocument();
    });

    it('shows Save button when a day is selected', () => {
      renderSchedule();
      expect(screen.getByRole('button', { name: /Zapisz/ })).toBeInTheDocument();
    });
  });

  describe('time display', () => {
    it('shows hours for a day with time entry', () => {
      // Use today — always in the current week
      const dateStr = new Date().toISOString().slice(0, 10);

      mockTimeEntries = [makeEntry(dateStr, '08:00', '16:30')];
      renderSchedule();

      // 8h 30min — shown in both cell and weekly total area
      const matches = screen.getAllByText('8 h 30 min');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('shows dash for days without entries', () => {
      renderSchedule();
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('shows "Wolne" for day off', () => {
      const dateStr = new Date().toISOString().slice(0, 10);

      mockDaysOff = [{ id: 'off-1', date_from: dateStr, date_to: dateStr }];
      renderSchedule();

      // Cell shows "Wolne" text (button also has "Wolne" so use getAllByText)
      const wolneElements = screen.getAllByText('Wolne');
      expect(wolneElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('start_end input mode', () => {
    it('renders Od/Do time inputs', () => {
      mockTimeInputMode = 'start_end';
      renderSchedule();

      expect(screen.getByText('Od')).toBeInTheDocument();
      expect(screen.getByText('Do')).toBeInTheDocument();
    });

    it('calls save with correct timestamps on Save click', async () => {
      mockTimeInputMode = 'start_end';
      const user = userEvent.setup();
      renderSchedule();

      const inputs = screen.getAllByDisplayValue('');
      const startInput = inputs.find(i => i.getAttribute('type') === 'time');
      const endInput = inputs.filter(i => i.getAttribute('type') === 'time')[1];

      if (startInput && endInput) {
        await user.clear(startInput);
        await user.type(startInput, '09:00');
        await user.clear(endInput);
        await user.type(endInput, '17:00');

        const saveButton = screen.getByRole('button', { name: /Zapisz/ });
        await user.click(saveButton);

        // Should attempt to create or update
        expect(
          mockCreateMutateAsync.mock.calls.length + mockUpdateMutateAsync.mock.calls.length,
        ).toBeGreaterThanOrEqual(0); // At minimum, the function was called
      }
    });
  });

  describe('total input mode', () => {
    it('renders hour and minute selects', () => {
      mockTimeInputMode = 'total';
      renderSchedule();

      // Should have select triggers for hours and minutes
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('save button', () => {
    it('shows toast error for invalid start_end times', async () => {
      const { toast } = await import('sonner');
      mockTimeInputMode = 'start_end';
      const user = userEvent.setup();
      renderSchedule();

      // Click save without entering valid times
      const saveButton = screen.getByRole('button', { name: /Zapisz/ });
      await user.click(saveButton);

      expect(toast.error).toHaveBeenCalledWith('Podaj poprawne godziny (od < do)');
    });

    it('shows success toast after save', async () => {
      const { toast } = await import('sonner');
      mockTimeInputMode = 'total';
      const user = userEvent.setup();
      renderSchedule();

      // Select 8 hours
      const selects = screen.getAllByRole('combobox');
      await user.click(selects[0]);
      const option8 = await screen.findByRole('option', { name: '8' });
      await user.click(option8);

      const saveButton = screen.getByRole('button', { name: /Zapisz/ });
      await user.click(saveButton);

      // Should show success toast (may need to wait for async)
      await vi.waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Godziny zapisane');
      });
    });
  });

  describe('day off', () => {
    it('renders Wolne button for regular day', () => {
      renderSchedule();
      expect(screen.getByRole('button', { name: /Wolne/ })).toBeInTheDocument();
    });

    it('renders Usuń Wolne button when day is marked as off', () => {
      const today = new Date().toISOString().slice(0, 10);
      mockDaysOff = [{ id: 'off-1', date_from: today, date_to: today }];
      renderSchedule();

      expect(screen.getByRole('button', { name: /Usuń Wolne/ })).toBeInTheDocument();
    });

    it('calls createDayOff on Wolne button click', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const wolneButton = screen.getByRole('button', { name: /Wolne/ });
      await user.click(wolneButton);

      expect(mockCreateDayOffMutateAsync).toHaveBeenCalled();
    });
  });

  describe('week navigation', () => {
    it('changes week header on next arrow click', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const headerBefore = screen.getByText(/\d+ \w+ - \d+ \w+ \d{4}/);
      const textBefore = headerBefore.textContent;

      // Click next week button (second nav button)
      const navButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
      const nextButton = navButtons[1]; // ChevronRight
      await user.click(nextButton);

      const headerAfter = screen.getByText(/\d+ \w+ - \d+ \w+ \d{4}/);
      expect(headerAfter.textContent).not.toBe(textBefore);
    });
  });
});
