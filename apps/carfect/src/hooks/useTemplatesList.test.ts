import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTemplatesList } from './useTemplatesList';

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

const { mockDeleteTemplate } = vi.hoisted(() => ({
  mockDeleteTemplate: vi.fn(),
}));
vi.mock('@/services/reminderService', () => ({
  deleteTemplate: mockDeleteTemplate,
}));

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

const INSTANCE_ID = 'inst-1';

const templates = [
  { id: 'tmpl-1', name: 'PPF Kontrola', description: null, items: [{ months: 1, service_type: 'serwis' }], sms_template: 'sms', email_subject: 'subject' },
  { id: 'tmpl-2', name: 'Serwis Roczny', description: null, items: [{ months: 12, service_type: 'serwis' }], sms_template: null, email_subject: null },
];

const customerReminders = [
  { reminder_template_id: 'tmpl-1', customer_phone: '+48111' },
  { reminder_template_id: 'tmpl-1', customer_phone: '+48222' },
];

const serviceLinks = [
  { reminder_template_id: 'tmpl-1' },
  { reminder_template_id: 'tmpl-1' },
  { reminder_template_id: 'tmpl-2' },
];

function mockChain(data: unknown) {
  const result = { data, error: null };
  const chain: Record<string, unknown> = {};
  ['select', 'eq', 'order', 'gte', 'delete'].forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

function setupFetchMocks() {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'reminder_templates') return mockChain(templates);
    if (table === 'customer_reminders') return mockChain(customerReminders);
    if (table === 'service_reminder_templates') return mockChain(serviceLinks);
    return mockChain([]);
  });
}

describe('useTemplatesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFetchMocks();
  });

  it('loads templates with customer and service counts', async () => {
    const { result } = renderHook(() => useTemplatesList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.paginated).toHaveLength(2);

    const ppf = result.current.paginated.find((t) => t.id === 'tmpl-1');
    expect(ppf?.activeCustomersCount).toBe(2);
    expect(ppf?.servicesCount).toBe(2);

    const serwis = result.current.paginated.find((t) => t.id === 'tmpl-2');
    expect(serwis?.activeCustomersCount).toBe(0);
    expect(serwis?.servicesCount).toBe(1);
  });

  it('filters by search — matches template name', async () => {
    const { result } = renderHook(() => useTemplatesList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSearch('PPF'));

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].name).toBe('PPF Kontrola');
  });

  it('resets page when search changes', async () => {
    const { result } = renderHook(() => useTemplatesList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.handlePageChange(2));
    expect(result.current.page).toBe(2);

    act(() => result.current.setSearch('test'));
    expect(result.current.page).toBe(1);
  });

  it('handleDeleteTemplate calls deleteTemplate and shows toast', async () => {
    mockDeleteTemplate.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTemplatesList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDeleteTemplate('tmpl-1');
    });

    await waitFor(() => {
      expect(mockDeleteTemplate).toHaveBeenCalledWith('tmpl-1');
      expect(mockToast.success).toHaveBeenCalledWith('Szablon usunięty');
    });
  });

  it('handleDeleteTemplate shows templateInUse error', async () => {
    mockDeleteTemplate.mockRejectedValueOnce(new Error('template_in_use'));

    const { result } = renderHook(() => useTemplatesList(INSTANCE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDeleteTemplate('tmpl-1');
    });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Szablon jest używany i nie może zostać usunięty');
    });
  });

  it('does not fetch when instanceId is null', () => {
    renderHook(() => useTemplatesList(null));
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
