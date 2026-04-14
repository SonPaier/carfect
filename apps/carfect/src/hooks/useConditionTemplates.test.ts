import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConditionTemplates } from './useConditionTemplates';

// ---------------------------------------------------------------------------
// Supabase mock — chainable builder
// ---------------------------------------------------------------------------

const { singleMock, selectAfterInsertMock, insertMock, eqAfterUpdateMock, updateMock, eqAfterDeleteMock, deleteMock, orderMock2, orderMock1, eqAfterSelectMock, selectMock, fromMock } =
  vi.hoisted(() => {
    // fetch chain: from().select().eq().order().order() → Promise
    const orderMock2 = vi.fn().mockResolvedValue({ data: [], error: null });
    const orderMock1 = vi.fn().mockReturnValue({ order: orderMock2 });
    const eqAfterSelectMock = vi.fn().mockReturnValue({ order: orderMock1 });
    const selectMock = vi.fn().mockReturnValue({ eq: eqAfterSelectMock });

    // insert chain: from().insert().select().single() → Promise
    const singleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const selectAfterInsertMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockReturnValue({ select: selectAfterInsertMock });

    // update chain: from().update().eq() → Promise
    const eqAfterUpdateMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqAfterUpdateMock });

    // delete chain: from().delete().eq() → Promise
    const eqAfterDeleteMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqAfterDeleteMock });

    const fromMock = vi.fn().mockReturnValue({
      select: selectMock,
      insert: insertMock,
      update: updateMock,
      delete: deleteMock,
    });

    return {
      singleMock,
      selectAfterInsertMock,
      insertMock,
      eqAfterUpdateMock,
      updateMock,
      eqAfterDeleteMock,
      deleteMock,
      orderMock2,
      orderMock1,
      eqAfterSelectMock,
      selectMock,
      fromMock,
    };
  });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: fromMock },
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INSTANCE_ID = 'instance-1';

const makeTemplate = (overrides = {}) => ({
  id: 'tpl-1',
  instance_id: INSTANCE_ID,
  template_type: 'warranty' as const,
  name: 'Standard warranty',
  content: '12 months warranty',
  sort_order: 0,
  ...overrides,
});

function resetFromMock() {
  orderMock2.mockResolvedValue({ data: [], error: null });
  orderMock1.mockReturnValue({ order: orderMock2 });
  eqAfterSelectMock.mockReturnValue({ order: orderMock1 });
  selectMock.mockReturnValue({ eq: eqAfterSelectMock });

  singleMock.mockResolvedValue({ data: null, error: null });
  selectAfterInsertMock.mockReturnValue({ single: singleMock });
  insertMock.mockReturnValue({ select: selectAfterInsertMock });

  eqAfterUpdateMock.mockResolvedValue({ error: null });
  updateMock.mockReturnValue({ eq: eqAfterUpdateMock });

  eqAfterDeleteMock.mockResolvedValue({ error: null });
  deleteMock.mockReturnValue({ eq: eqAfterDeleteMock });

  fromMock.mockReturnValue({
    select: selectMock,
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useConditionTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFromMock();
  });

  describe('initial state', () => {
    it('sets loading to false and templates to empty when instanceId is null', async () => {
      const { result } = renderHook(() => useConditionTemplates(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.templates).toEqual([]);
      expect(fromMock).not.toHaveBeenCalled();
    });

    it('fetches templates and sets loading to false after successful fetch', async () => {
      const templates = [makeTemplate()];
      orderMock2.mockResolvedValueOnce({ data: templates, error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.templates).toHaveLength(1);
      expect(result.current.templates[0].id).toBe('tpl-1');
    });

    it('queries correct table and filters by instanceId', async () => {
      orderMock2.mockResolvedValueOnce({ data: [], error: null });

      renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(fromMock).toHaveBeenCalledWith('offer_condition_templates');
      });

      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqAfterSelectMock).toHaveBeenCalledWith('instance_id', INSTANCE_ID);
    });
  });

  describe('byType', () => {
    it('filters templates by template_type', async () => {
      const templates = [
        makeTemplate({ id: 'tpl-1', template_type: 'warranty' }),
        makeTemplate({ id: 'tpl-2', template_type: 'payment_terms' }),
        makeTemplate({ id: 'tpl-3', template_type: 'warranty' }),
      ];
      orderMock2.mockResolvedValueOnce({ data: templates, error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const warrantyTemplates = result.current.byType('warranty');
      expect(warrantyTemplates).toHaveLength(2);
      expect(warrantyTemplates.every((t) => t.template_type === 'warranty')).toBe(true);
    });

    it('returns empty array when no templates match the type', async () => {
      const templates = [makeTemplate({ template_type: 'warranty' })];
      orderMock2.mockResolvedValueOnce({ data: templates, error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.byType('notes')).toEqual([]);
    });
  });

  describe('createTemplate', () => {
    it('calls insert with correct data and returns true on success', async () => {
      orderMock2.mockResolvedValueOnce({ data: [], error: null });

      const newTemplate = makeTemplate({ id: 'tpl-new', sort_order: 0 });
      singleMock.mockResolvedValueOnce({ data: newTemplate, error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.createTemplate('warranty', 'My Template', 'Template content');
      });

      expect(success).toBe(true);
      expect(fromMock).toHaveBeenCalledWith('offer_condition_templates');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          instance_id: INSTANCE_ID,
          template_type: 'warranty',
          name: 'My Template',
          content: 'Template content',
          sort_order: 0,
        }),
      );
    });

    it('adds the new template to local state', async () => {
      orderMock2.mockResolvedValueOnce({ data: [], error: null });
      const newTemplate = makeTemplate({ id: 'tpl-new' });
      singleMock.mockResolvedValueOnce({ data: newTemplate, error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createTemplate('warranty', 'New', 'Content');
      });

      expect(result.current.templates).toHaveLength(1);
      expect(result.current.templates[0].id).toBe('tpl-new');
    });

    it('shows success toast after creating', async () => {
      orderMock2.mockResolvedValueOnce({ data: [], error: null });
      singleMock.mockResolvedValueOnce({ data: makeTemplate(), error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createTemplate('warranty', 'T', 'C');
      });

      expect(mockToast.success).toHaveBeenCalledWith('Szablon dodany');
    });

    it('returns false and shows error toast when instanceId is null', async () => {
      const { result } = renderHook(() => useConditionTemplates(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.createTemplate('warranty', 'T', 'C');
      });

      expect(success).toBe(false);
      expect(insertMock).not.toHaveBeenCalled();
    });

    it('computes sort_order based on existing templates of the same type', async () => {
      const existing = [
        makeTemplate({ id: 'tpl-1', template_type: 'warranty', sort_order: 0 }),
        makeTemplate({ id: 'tpl-2', template_type: 'warranty', sort_order: 1 }),
      ];
      orderMock2.mockResolvedValueOnce({ data: existing, error: null });
      singleMock.mockResolvedValueOnce({ data: makeTemplate({ id: 'tpl-3', sort_order: 2 }), error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createTemplate('warranty', 'Third', 'Content');
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ sort_order: 2 }),
      );
    });
  });

  describe('updateTemplate', () => {
    it('calls update with correct data and returns true on success', async () => {
      const template = makeTemplate();
      orderMock2.mockResolvedValueOnce({ data: [template], error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.updateTemplate('tpl-1', { name: 'Updated Name' });
      });

      expect(success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith({ name: 'Updated Name' });
      expect(eqAfterUpdateMock).toHaveBeenCalledWith('id', 'tpl-1');
    });

    it('updates the template in local state', async () => {
      const template = makeTemplate();
      orderMock2.mockResolvedValueOnce({ data: [template], error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateTemplate('tpl-1', { content: 'New content' });
      });

      expect(result.current.templates[0].content).toBe('New content');
    });

    it('shows success toast after updating', async () => {
      orderMock2.mockResolvedValueOnce({ data: [makeTemplate()], error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateTemplate('tpl-1', { name: 'X' });
      });

      expect(mockToast.success).toHaveBeenCalledWith('Szablon zaktualizowany');
    });
  });

  describe('deleteTemplate', () => {
    it('calls delete with correct id and returns true on success', async () => {
      const template = makeTemplate();
      orderMock2.mockResolvedValueOnce({ data: [template], error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.deleteTemplate('tpl-1');
      });

      expect(success).toBe(true);
      expect(deleteMock).toHaveBeenCalled();
      expect(eqAfterDeleteMock).toHaveBeenCalledWith('id', 'tpl-1');
    });

    it('removes the template from local state', async () => {
      const template = makeTemplate();
      orderMock2.mockResolvedValueOnce({ data: [template], error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteTemplate('tpl-1');
      });

      expect(result.current.templates).toHaveLength(0);
    });

    it('shows success toast after deleting', async () => {
      orderMock2.mockResolvedValueOnce({ data: [makeTemplate()], error: null });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteTemplate('tpl-1');
      });

      expect(mockToast.success).toHaveBeenCalledWith('Szablon usunięty');
    });
  });

  describe('error handling', () => {
    it('shows error toast and returns false when createTemplate fails', async () => {
      orderMock2.mockResolvedValueOnce({ data: [], error: null });
      singleMock.mockResolvedValueOnce({ data: null, error: new Error('DB error') });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.createTemplate('warranty', 'T', 'C');
      });

      expect(success).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('Błąd dodawania szablonu');
    });

    it('shows error toast and returns false when updateTemplate fails', async () => {
      orderMock2.mockResolvedValueOnce({ data: [makeTemplate()], error: null });
      eqAfterUpdateMock.mockResolvedValueOnce({ error: new Error('DB error') });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.updateTemplate('tpl-1', { name: 'X' });
      });

      expect(success).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('Błąd aktualizacji szablonu');
    });

    it('shows error toast and returns false when deleteTemplate fails', async () => {
      orderMock2.mockResolvedValueOnce({ data: [makeTemplate()], error: null });
      eqAfterDeleteMock.mockResolvedValueOnce({ error: new Error('DB error') });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.deleteTemplate('tpl-1');
      });

      expect(success).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('Błąd usuwania szablonu');
    });

    it('sets templates to empty and loading to false when fetch errors', async () => {
      orderMock2.mockResolvedValueOnce({ data: null, error: new Error('DB error') });

      const { result } = renderHook(() => useConditionTemplates(INSTANCE_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.templates).toEqual([]);
    });
  });
});
