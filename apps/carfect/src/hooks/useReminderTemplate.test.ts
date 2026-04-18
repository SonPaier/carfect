import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReminderTemplate } from './useReminderTemplate';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

const { mockFetchTemplate, mockSaveTemplate, DEFAULT_SMS_TEMPLATE } = vi.hoisted(() => ({
  mockFetchTemplate: vi.fn(),
  mockSaveTemplate: vi.fn(),
  DEFAULT_SMS_TEMPLATE: 'sms-default',
}));

vi.mock('../services/reminderService', () => ({
  fetchTemplate: mockFetchTemplate,
  saveTemplate: mockSaveTemplate,
  DEFAULT_SMS_TEMPLATE,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INSTANCE_ID = 'inst-1';
const SHORT_ID = 'tpl-short-1';

function makeTemplateRow(overrides: Partial<{
  id: string;
  instance_id: string;
  name: string;
  sms_template: string | null;
  email_subject: string | null;
  email_body: string | null;
  items: { months: number; service_type: string }[];
}> = {}) {
  return {
    id: 'row-1',
    instance_id: INSTANCE_ID,
    name: 'My Template',
    sms_template: 'sms text',
    email_subject: 'Subject',
    email_body: 'Body',
    items: [
      { months: 6, service_type: 'serwis' },
      { months: 12, service_type: 'serwis' },
      { months: 18, service_type: 'serwis' },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useReminderTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('items computation', () => {
    it('generates correct schedule for default count=1, interval=1', async () => {
      const { result } = renderHook(() => useReminderTemplate(null, 'new'));

      // Default state: repeatCount=1, intervalMonths=1
      expect(result.current.items).toEqual([
        { months: 1, service_type: 'serwis' },
      ]);
    });

    it('updates items when repeatCount changes', async () => {
      const { result } = renderHook(() => useReminderTemplate(null, 'new'));

      act(() => {
        result.current.setRepeatCount(3);
        result.current.setIntervalMonths(6);
      });

      expect(result.current.items).toEqual([
        { months: 6, service_type: 'serwis' },
        { months: 12, service_type: 'serwis' },
        { months: 18, service_type: 'serwis' },
      ]);
    });

    it('updates items when intervalMonths changes', async () => {
      const { result } = renderHook(() => useReminderTemplate(null, 'new'));

      act(() => {
        result.current.setRepeatCount(3);
        result.current.setIntervalMonths(12);
      });

      expect(result.current.items).toEqual([
        { months: 12, service_type: 'serwis' },
        { months: 24, service_type: 'serwis' },
        { months: 36, service_type: 'serwis' },
      ]);
    });
  });

  describe('schedulePreview', () => {
    it('formats schedule as comma-separated months with "mies." suffix', async () => {
      const { result } = renderHook(() => useReminderTemplate(null, 'new'));

      // Default count=1, interval=1 → "1 mies."
      expect(result.current.schedulePreview).toBe('1 mies.');
    });
  });

  describe('initial load with shortId="new"', () => {
    it('sets loading to false immediately and keeps default state', async () => {
      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, 'new'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchTemplate).not.toHaveBeenCalled();
      expect(result.current.name).toBe('');
      expect(result.current.repeatCount).toBe(1);
      expect(result.current.intervalMonths).toBe(1);
      expect(result.current.smsTemplate).toBe('');
      expect(result.current.emailSubject).toBe('');
    });
  });

  describe('initial load with existing shortId', () => {
    it('calls fetchTemplate and populates state from the returned row', async () => {
      const row = makeTemplateRow();
      mockFetchTemplate.mockResolvedValueOnce(row);

      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, SHORT_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchTemplate).toHaveBeenCalledWith(INSTANCE_ID, SHORT_ID);
      expect(result.current.templateId).toBe('row-1');
      expect(result.current.name).toBe('My Template');
      expect(result.current.smsTemplate).toBe('sms text');
      expect(result.current.emailSubject).toBe('Subject');
      expect(result.current.emailBody).toBe('Body');
    });

    it('shows error toast when fetchTemplate throws', async () => {
      mockFetchTemplate.mockRejectedValueOnce(new Error('DB error'));

      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, SHORT_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockToast.error).toHaveBeenCalledWith('reminderTemplates.fetchError');
    });
  });

  describe('reverse-engineering repeatCount and intervalMonths from items', () => {
    it('correctly computes repeatCount and intervalMonths for evenly spaced items', async () => {
      const row = makeTemplateRow({
        items: [
          { months: 3, service_type: 'serwis' },
          { months: 6, service_type: 'serwis' },
          { months: 9, service_type: 'serwis' },
          { months: 12, service_type: 'serwis' },
        ],
      });
      mockFetchTemplate.mockResolvedValueOnce(row);

      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, SHORT_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.repeatCount).toBe(4);
      expect(result.current.intervalMonths).toBe(3);
    });

    it('falls back to length + first months when items are not evenly spaced', async () => {
      const row = makeTemplateRow({
        items: [
          { months: 4, service_type: 'serwis' },
          { months: 10, service_type: 'serwis' },
          { months: 14, service_type: 'serwis' },
        ],
      });
      mockFetchTemplate.mockResolvedValueOnce(row);

      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, SHORT_ID));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.repeatCount).toBe(3);
      expect(result.current.intervalMonths).toBe(4);
    });
  });

  describe('save', () => {
    it('calls saveTemplate with items computed from count × interval', async () => {
      mockSaveTemplate.mockResolvedValueOnce('new-id');

      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, 'new'));

      // Set a name so validation passes
      act(() => {
        result.current.setName('Test Template');
      });

      await act(async () => {
        await result.current.save();
      });

      expect(mockSaveTemplate).toHaveBeenCalledWith(
        INSTANCE_ID,
        expect.objectContaining({
          name: 'Test Template',
          items: [
            { months: 1, service_type: 'serwis' },
          ],
        }),
      );
      expect(mockToast.success).toHaveBeenCalledWith('reminderTemplates.saved');
    });

    it('shows toast.error when name is empty and does not call saveTemplate', async () => {
      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, 'new'));

      // name is empty by default
      await act(async () => {
        await result.current.save();
      });

      expect(mockSaveTemplate).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith('reminderTemplates.nameRequired');
    });

    it('calls onSaved callback with the returned id after saving', async () => {
      mockSaveTemplate.mockResolvedValueOnce('saved-id');
      const onSaved = vi.fn();

      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, 'new'));

      act(() => {
        result.current.setName('Template');
      });

      await act(async () => {
        await result.current.save(onSaved);
      });

      expect(onSaved).toHaveBeenCalledWith('saved-id');
    });

    it('shows error toast when saveTemplate throws', async () => {
      mockSaveTemplate.mockRejectedValueOnce(new Error('DB error'));

      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, 'new'));

      act(() => {
        result.current.setName('Template');
      });

      await act(async () => {
        await result.current.save();
      });

      expect(mockToast.error).toHaveBeenCalledWith('reminderTemplates.saveError');
    });

    it('shows error when emailSubject set but emailBody empty', async () => {
      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, 'new'));

      act(() => {
        result.current.setName('Template');
        result.current.setEmailSubject('Subject');
        // emailBody stays empty
      });

      await act(async () => {
        await result.current.save();
      });

      expect(mockSaveTemplate).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith('reminderTemplates.emailBothRequired');
    });

    it('shows error when emailBody set but emailSubject empty', async () => {
      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, 'new'));

      act(() => {
        result.current.setName('Template');
        result.current.setEmailBody('Body text');
        // emailSubject stays empty
      });

      await act(async () => {
        await result.current.save();
      });

      expect(mockSaveTemplate).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith('reminderTemplates.emailBothRequired');
    });

    it('allows save when both emailSubject and emailBody are empty', async () => {
      mockSaveTemplate.mockResolvedValueOnce('id');

      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, 'new'));

      act(() => {
        result.current.setName('Template');
        // both email fields empty — OK
      });

      await act(async () => {
        await result.current.save();
      });

      expect(mockSaveTemplate).toHaveBeenCalled();
    });

    it('allows save when both emailSubject and emailBody are filled', async () => {
      mockSaveTemplate.mockResolvedValueOnce('id');

      const { result } = renderHook(() => useReminderTemplate(INSTANCE_ID, 'new'));

      act(() => {
        result.current.setName('Template');
        result.current.setEmailSubject('Subject');
        result.current.setEmailBody('Body');
      });

      await act(async () => {
        await result.current.save();
      });

      expect(mockSaveTemplate).toHaveBeenCalled();
    });
  });
});
