import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetSupabaseMocks } from '@/test/mocks/supabase';
import type { WorkersSettings } from '@/hooks/useWorkersSettings';

// ============================================================
// Module mocks
// ============================================================

const mockUpdateMutateAsync = vi.fn();

const defaultSettings: WorkersSettings = {
  instance_id: 'inst-1',
  time_tracking_enabled: false,
  overtime_enabled: false,
  standard_hours_per_day: 8,
  report_frequency: 'monthly',
  start_stop_enabled: false,
  time_calculation_mode: 'start_to_stop',
};

let mockedSettings: WorkersSettings | null = defaultSettings;
let mockedIsLoading = false;

vi.mock('@/hooks/useWorkersSettings', () => ({
  useWorkersSettings: vi.fn(() => ({
    data: mockedSettings,
    isLoading: mockedIsLoading,
  })),
  useUpdateWorkersSettings: vi.fn(() => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  })),
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

// ============================================================
// Import after mocks
// ============================================================

import WorkersSettingsDrawer from './WorkersSettingsDrawer';
import { useWorkersSettings, useUpdateWorkersSettings } from '@/hooks/useWorkersSettings';

// ============================================================
// Helpers
// ============================================================

const INSTANCE_ID = 'inst-test-222';

const renderDrawer = (props: { open?: boolean; onOpenChange?: (v: boolean) => void } = {}) => {
  const user = userEvent.setup();
  const onOpenChange = props.onOpenChange ?? vi.fn();
  const result = render(
    <WorkersSettingsDrawer
      open={props.open ?? true}
      onOpenChange={onOpenChange}
      instanceId={INSTANCE_ID}
    />,
  );
  return { ...result, user, onOpenChange };
};

// ============================================================
// Tests
// ============================================================

describe('WorkersSettingsDrawer', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockedSettings = { ...defaultSettings };
    mockedIsLoading = false;
    mockUpdateMutateAsync.mockResolvedValue(undefined);

    vi.mocked(useWorkersSettings).mockReturnValue({
      data: mockedSettings,
      isLoading: false,
    } as ReturnType<typeof useWorkersSettings>);

    vi.mocked(useUpdateWorkersSettings).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as ReturnType<typeof useUpdateWorkersSettings>);
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders drawer title', () => {
      renderDrawer();
      expect(screen.getByText('Ustawienia czasu pracy')).toBeInTheDocument();
    });

    it('renders time tracking toggle', () => {
      renderDrawer();
      expect(screen.getByLabelText('Ewidencja czasu pracy')).toBeInTheDocument();
    });

    it('renders save and cancel buttons', () => {
      renderDrawer();
      expect(screen.getByRole('button', { name: /zapisz/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /anuluj/i })).toBeInTheDocument();
    });

    it('shows loading spinner while settings are loading', () => {
      vi.mocked(useWorkersSettings).mockReturnValue({
        data: null,
        isLoading: true,
      } as ReturnType<typeof useWorkersSettings>);

      renderDrawer();
      // No error, just verifying no crash and the main content is hidden
      expect(screen.queryByLabelText('Ewidencja czasu pracy')).not.toBeInTheDocument();
    });
  });

  describe('time tracking toggle controls dependent settings visibility', () => {
    it('hides overtime and frequency settings when time tracking is off', () => {
      renderDrawer();
      expect(screen.queryByText('Naliczanie nadgodzin')).not.toBeInTheDocument();
      expect(screen.queryByText('Okres rozliczeniowy')).not.toBeInTheDocument();
    });

    it('shows overtime and frequency settings when time tracking is toggled on', async () => {
      const { user } = renderDrawer();
      const toggle = screen.getByLabelText('Ewidencja czasu pracy');
      await user.click(toggle);

      expect(screen.getByText('Naliczanie nadgodzin')).toBeInTheDocument();
      expect(screen.getByText('Okres rozliczeniowy')).toBeInTheDocument();
    });

    it('hides standard hours input when overtime is off', async () => {
      const { user } = renderDrawer();
      const timeTrackingToggle = screen.getByLabelText('Ewidencja czasu pracy');
      await user.click(timeTrackingToggle);

      // Overtime toggle should be off by default
      expect(screen.queryByLabelText('Norma dzienna (godziny)')).not.toBeInTheDocument();
    });

    it('shows standard hours input when overtime is toggled on', async () => {
      const { user } = renderDrawer();

      const timeTrackingToggle = screen.getByLabelText('Ewidencja czasu pracy');
      await user.click(timeTrackingToggle);

      const overtimeToggle = screen.getByLabelText('Naliczanie nadgodzin');
      await user.click(overtimeToggle);

      expect(screen.getByLabelText('Norma dzienna (godziny)')).toBeInTheDocument();
    });

    it('initializes with time tracking on when settings have it enabled', () => {
      vi.mocked(useWorkersSettings).mockReturnValue({
        data: { ...defaultSettings, time_tracking_enabled: true },
        isLoading: false,
      } as ReturnType<typeof useWorkersSettings>);

      renderDrawer();

      expect(screen.getByText('Naliczanie nadgodzin')).toBeInTheDocument();
      expect(screen.getByText('Okres rozliczeniowy')).toBeInTheDocument();
    });
  });

  describe('saving settings', () => {
    it('calls updateSettings with correct params when saved', async () => {
      const { user } = renderDrawer();

      await user.click(screen.getByRole('button', { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            time_tracking_enabled: false,
            overtime_enabled: false,
            standard_hours_per_day: 8,
            report_frequency: 'monthly',
          }),
        );
      });
    });

    it('saves time_tracking_enabled: true after toggling', async () => {
      const { user } = renderDrawer();

      const toggle = screen.getByLabelText('Ewidencja czasu pracy');
      await user.click(toggle);

      await user.click(screen.getByRole('button', { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ time_tracking_enabled: true }),
        );
      });
    });

    it('shows success toast and closes drawer after saving', async () => {
      const { user, onOpenChange } = renderDrawer();

      await user.click(screen.getByRole('button', { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Ustawienia zostały zapisane');
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('shows error toast when save fails', async () => {
      mockUpdateMutateAsync.mockRejectedValue(new Error('DB error'));

      const { user } = renderDrawer();

      await user.click(screen.getByRole('button', { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Błąd podczas zapisywania ustawień');
      });
    });

    it('does not close drawer on save error', async () => {
      mockUpdateMutateAsync.mockRejectedValue(new Error('DB error'));

      const { user, onOpenChange } = renderDrawer();

      await user.click(screen.getByRole('button', { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  describe('cancel button', () => {
    it('closes drawer when cancel is clicked', async () => {
      const { user, onOpenChange } = renderDrawer();
      await user.click(screen.getByRole('button', { name: /anuluj/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('report frequency', () => {
    it('shows monthly and weekly radio options when time tracking is on', async () => {
      const { user } = renderDrawer();

      const toggle = screen.getByLabelText('Ewidencja czasu pracy');
      await user.click(toggle);

      expect(screen.getByLabelText('Miesięcznie')).toBeInTheDocument();
      expect(screen.getByLabelText('Tygodniowo')).toBeInTheDocument();
    });

    it('saves weekly frequency when selected', async () => {
      const { user } = renderDrawer();

      const toggle = screen.getByLabelText('Ewidencja czasu pracy');
      await user.click(toggle);

      const weeklyRadio = screen.getByLabelText('Tygodniowo');
      await user.click(weeklyRadio);

      await user.click(screen.getByRole('button', { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ report_frequency: 'weekly' }),
        );
      });
    });
  });
});
