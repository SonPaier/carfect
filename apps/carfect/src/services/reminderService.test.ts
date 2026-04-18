import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchTemplate,
  saveTemplate,
  deleteTemplate,
  fetchTemplateList,
} from './reminderService';

// --- Supabase mock ---
const mockFrom = vi.fn();

const createChainMock = (
  resolveData: unknown = null,
  resolveError: unknown = null,
  resolveCount: number | null = null,
) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'or',
    'order',
    'range',
    'limit',
    'single',
    'maybeSingle',
    'insert',
    'update',
    'delete',
    'match',
    'ilike',
    'like',
    'gte',
  ];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({
      data: resolveData,
      error: resolveError,
      count: resolveCount,
    }).then(resolve),
  );
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// --- Test data ---
const INSTANCE_ID = 'inst-1';

const templateRow = {
  id: 'abc123-full-uuid',
  name: 'Roczny serwis',
  description: null,
  sms_template: '{short_name}: Zapraszamy na wizytę',
  email_subject: 'Przypomnienie',
  email_body: 'Treść emaila',
  items: [
    { months: 6, service_type: 'serwis' },
    { months: 12, service_type: 'serwis' },
  ],
  instance_id: INSTANCE_ID,
};

describe('reminderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTemplate', () => {
    it('returns template when id starts with shortId', async () => {
      mockFrom.mockReturnValue(createChainMock([templateRow]));

      const result = await fetchTemplate(INSTANCE_ID, 'abc123');

      expect(result.id).toBe('abc123-full-uuid');
      expect(result.name).toBe('Roczny serwis');
      expect(result.items).toHaveLength(2);
    });

    it('throws when no match found', async () => {
      mockFrom.mockReturnValue(createChainMock([templateRow]));

      await expect(fetchTemplate(INSTANCE_ID, 'zzz999')).rejects.toThrow('template_not_found');
    });
  });

  describe('saveTemplate', () => {
    it('calls INSERT for new template and returns id', async () => {
      const insertedId = 'new-uuid-from-db';
      const chain = createChainMock({ id: insertedId });
      mockFrom.mockReturnValue(chain);

      const result = await saveTemplate(INSTANCE_ID, {
        name: 'Nowy szablon',
        smsTemplate: 'SMS text',
        emailSubject: 'Temat',
        emailBody: 'Treść',
        items: [{ months: 6, service_type: 'serwis' }],
      });

      expect(result).toBe(insertedId);
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          instance_id: INSTANCE_ID,
          name: 'Nowy szablon',
          sms_template: 'SMS text',
        }),
      );
    });

    it('calls UPDATE for existing template and returns existing id', async () => {
      const existingId = 'existing-uuid';
      const chain = createChainMock(null);
      mockFrom.mockReturnValue(chain);

      const result = await saveTemplate(INSTANCE_ID, {
        id: existingId,
        name: 'Zaktualizowany szablon',
        smsTemplate: 'Nowy SMS',
        emailSubject: 'Nowy temat',
        emailBody: 'Nowa treść',
        items: [{ months: 12, service_type: 'serwis' }],
      });

      expect(result).toBe(existingId);
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Zaktualizowany szablon',
          sms_template: 'Nowy SMS',
        }),
      );
    });

    it('converts empty smsTemplate/emailSubject/emailBody to null', async () => {
      const chain = createChainMock({ id: 'new-id' });
      mockFrom.mockReturnValue(chain);

      await saveTemplate(INSTANCE_ID, {
        name: 'Szablon',
        smsTemplate: '',
        emailSubject: '',
        emailBody: '',
        items: [{ months: 6, service_type: 'serwis' }],
      });

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sms_template: null,
          email_subject: null,
          email_body: null,
        }),
      );
    });
  });

  describe('deleteTemplate', () => {
    it('throws template_in_use when active reminders exist', async () => {
      mockFrom.mockReturnValue(createChainMock(null, null, 3));

      await expect(deleteTemplate('tmpl-1')).rejects.toThrow('template_in_use');
    });

    it('calls DELETE when no active reminders', async () => {
      const deleteChain = createChainMock(null, null, 0);
      mockFrom.mockReturnValue(deleteChain);

      await deleteTemplate('tmpl-1');

      expect(deleteChain.delete).toHaveBeenCalled();
      expect(deleteChain.eq).toHaveBeenCalledWith('id', 'tmpl-1');
    });
  });

  describe('fetchTemplateList', () => {
    it('returns templates merged with active customer counts', async () => {
      const templates = [
        { id: 'tmpl-1', name: 'Alfa', items: [{ months: 6, service_type: 'serwis' }] },
        { id: 'tmpl-2', name: 'Beta', items: [] },
      ];

      const reminders = [
        { reminder_template_id: 'tmpl-1', customer_phone: '+48111111111' },
        { reminder_template_id: 'tmpl-1', customer_phone: '+48222222222' },
        { reminder_template_id: 'tmpl-1', customer_phone: '+48111111111' }, // duplicate — same customer
      ];

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        // First call: reminder_templates, second call: customer_reminders
        if (callIndex++ === 0) {
          return createChainMock(templates);
        }
        return createChainMock(reminders);
      });

      const result = await fetchTemplateList(INSTANCE_ID);

      expect(result).toHaveLength(2);

      const alfa = result.find((t) => t.id === 'tmpl-1');
      expect(alfa).toBeDefined();
      // Two unique phones for tmpl-1 (duplicate filtered by Set)
      expect(alfa!.activeCustomersCount).toBe(2);

      const beta = result.find((t) => t.id === 'tmpl-2');
      expect(beta).toBeDefined();
      expect(beta!.activeCustomersCount).toBe(0);
    });
  });
});
