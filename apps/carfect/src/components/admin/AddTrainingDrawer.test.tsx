import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { AddTrainingDrawer } from './AddTrainingDrawer';
import { resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/useStations', () => ({
  useStations: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/hooks/useWorkingHours', () => ({
  useWorkingHours: () => ({ data: null }),
}));

vi.mock('@/hooks/useEmployees', () => ({
  useEmployees: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

import { mockSupabase } from '@/test/mocks/supabase';

function renderDrawer(open: boolean) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AddTrainingDrawer open={open} onClose={vi.fn()} instanceId="inst-1" onSuccess={vi.fn()} />
    </I18nextProvider>,
  );
}

/** Creates a chainable mock that resolves to { data, error: null } */
function createChain(data: unknown) {
  const chain: Record<string, unknown> = {};
  for (const method of [
    'select',
    'eq',
    'neq',
    'order',
    'limit',
    'in',
    'is',
    'single',
    'maybeSingle',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: (v: unknown) => void) => {
    resolve({ data, error: null });
  };
  return chain;
}

describe('AddTrainingDrawer', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  describe('training types fetch', () => {
    it('fetches training types when drawer opens', async () => {
      let trainingTypesFetchCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'training_types') {
          trainingTypesFetchCount++;
          return createChain([
            { id: 'tt-1', name: 'PPF', duration_days: 2, sort_order: 1, active: true },
          ]);
        }
        return createChain([]);
      });

      renderDrawer(true);

      await waitFor(() => {
        expect(trainingTypesFetchCount).toBeGreaterThanOrEqual(1);
      });
    });

    it('does not fetch training types when drawer is closed', () => {
      let trainingTypesFetchCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'training_types') {
          trainingTypesFetchCount++;
          return createChain([]);
        }
        return createChain([]);
      });

      renderDrawer(false);

      expect(trainingTypesFetchCount).toBe(0);
    });

    it('refetches training types on each drawer open (regression: new types not showing)', async () => {
      let trainingTypesFetchCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'training_types') {
          trainingTypesFetchCount++;
          return createChain([
            { id: 'tt-1', name: 'PPF', duration_days: 2, sort_order: 1, active: true },
          ]);
        }
        return createChain([]);
      });

      // First open
      const { rerender } = renderDrawer(true);

      await waitFor(() => {
        expect(trainingTypesFetchCount).toBe(1);
      });

      // Close
      rerender(
        <I18nextProvider i18n={i18n}>
          <AddTrainingDrawer
            open={false}
            onClose={vi.fn()}
            instanceId="inst-1"
            onSuccess={vi.fn()}
          />
        </I18nextProvider>,
      );

      // Reopen — should refetch
      rerender(
        <I18nextProvider i18n={i18n}>
          <AddTrainingDrawer
            open={true}
            onClose={vi.fn()}
            instanceId="inst-1"
            onSuccess={vi.fn()}
          />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(trainingTypesFetchCount).toBe(2);
      });
    });
  });
});
