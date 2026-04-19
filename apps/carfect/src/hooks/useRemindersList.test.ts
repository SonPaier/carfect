import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRemindersList } from './useRemindersList';

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

const INSTANCE_ID = 'inst-1';

const makeReminders = () => [
  { id: 'r1', customer_name: 'Jan Kowalski', customer_phone: '+48111', scheduled_date: '2026-05-01', channel: 'sms', status: 'scheduled', reminder_template_id: 't1', reminder_templates: { name: 'PPF' } },
  { id: 'r2', customer_name: 'Anna Nowak', customer_phone: '+48222', scheduled_date: '2026-04-01', channel: 'email', status: 'sent', reminder_template_id: 't1', reminder_templates: { name: 'PPF' } },
  { id: 'r3', customer_name: 'Piotr Zielinski', customer_phone: '+48333', scheduled_date: '2026-06-01', channel: 'sms', status: 'scheduled', reminder_template_id: 't2', reminder_templates: { name: 'Serwis' } },
];

function mockChain(data: unknown) {
  const result = { data, error: null };
  const chain: Record<string, unknown> = {};
  ['select', 'eq', 'order', 'delete'].forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  // Make chain thenable (works with await)
  chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

function setupMocks() {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'customer_reminders') return mockChain(makeReminders());
    return mockChain(null);
  });
}

describe('useRemindersList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it('loads reminders and defaults to scheduled filter', async () => {
    const { result } = renderHook(() => useRemindersList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.statusFilter).toBe('scheduled');
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered.every((r) => r.status === 'scheduled')).toBe(true);
  });

  it('shows all reminders when status filter is all', async () => {
    const { result } = renderHook(() => useRemindersList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setStatusFilter('all'));

    expect(result.current.filtered).toHaveLength(3);
  });

  it('filters by search — matches customer name', async () => {
    const { result } = renderHook(() => useRemindersList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setStatusFilter('all');
      result.current.setSearch('Anna');
    });

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].customer_name).toBe('Anna Nowak');
  });

  it('filters by search — matches template name', async () => {
    const { result } = renderHook(() => useRemindersList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setStatusFilter('all');
      result.current.setSearch('Serwis');
    });

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].id).toBe('r3');
  });

  it('resets page when search changes', async () => {
    const { result } = renderHook(() => useRemindersList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.handlePageChange(2));
    expect(result.current.page).toBe(2);

    act(() => result.current.setSearch('test'));
    expect(result.current.page).toBe(1);
  });

  it('deleteReminder removes item from list', async () => {
    const { result } = renderHook(() => useRemindersList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filtered).toHaveLength(2);

    await act(async () => {
      await result.current.deleteReminder('r1');
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Przypomnienie usunięte');
    });
  });

  it('does not fetch when instanceId is null', () => {
    renderHook(() => useRemindersList(null));
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
