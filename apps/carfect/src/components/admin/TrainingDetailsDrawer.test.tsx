import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { TrainingDetailsDrawer } from './TrainingDetailsDrawer';
import { resetSupabaseMocks } from '@/test/mocks/supabase';
import type { Training } from './AddTrainingDrawer';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/useEmployees', () => ({
  useEmployees: () => ({ data: [], isLoading: false }),
}));

import { toast } from 'sonner';
import { mockSupabase } from '@/test/mocks/supabase';

const baseTraining: Training = {
  id: 'tr-1',
  instance_id: 'inst-1',
  training_type: 'PPF',
  training_type_id: 'tt-1',
  title: 'Szkolenie PPF',
  description: null,
  start_date: '2026-03-20',
  end_date: '2026-03-21',
  start_time: '09:00:00',
  end_time: '17:00:00',
  station_id: null,
  status: 'open',
  assigned_employee_ids: [],
  photo_urls: null,
  created_by: null,
  created_by_username: null,
  created_at: '2026-03-15T10:00:00Z',
  updated_at: '2026-03-15T10:00:00Z',
};

function renderDrawer(training: Training = baseTraining) {
  return render(
    <I18nextProvider i18n={i18n}>
      <TrainingDetailsDrawer
        open={true}
        onClose={vi.fn()}
        training={training}
        instanceId="inst-1"
        onEdit={vi.fn()}
        onDeleted={vi.fn()}
      />
    </I18nextProvider>,
  );
}

describe('TrainingDetailsDrawer', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  describe('status toggle', () => {
    it('updates Switch visually after toggling from open to sold_out', async () => {
      const user = userEvent.setup();
      // Mock successful DB update
      mockSupabase.from.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      renderDrawer({ ...baseTraining, status: 'open' });

      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('aria-checked', 'false'); // open = not sold_out

      await user.click(switchEl);

      await waitFor(() => {
        expect(switchEl).toHaveAttribute('aria-checked', 'true'); // now sold_out
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('updates Switch visually after toggling from sold_out to open', async () => {
      const user = userEvent.setup();
      mockSupabase.from.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      renderDrawer({ ...baseTraining, status: 'sold_out' });

      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('aria-checked', 'true'); // sold_out

      await user.click(switchEl);

      await waitFor(() => {
        expect(switchEl).toHaveAttribute('aria-checked', 'false'); // now open
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('reverts Switch on DB error', async () => {
      const user = userEvent.setup();
      mockSupabase.from.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      renderDrawer({ ...baseTraining, status: 'open' });

      const switchEl = screen.getByRole('switch');
      await user.click(switchEl);

      await waitFor(() => {
        expect(switchEl).toHaveAttribute('aria-checked', 'false'); // reverted to open
      });
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
