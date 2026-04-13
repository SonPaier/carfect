import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmsMessageSettings from './SmsMessageSettings';
import { POLISH_MONTH_NAMES } from '@/lib/polishDateUtils';

// ---- Supabase mock ----
const mockFrom = vi.fn();

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'or',
    'order',
    'limit',
    'single',
    'insert',
    'update',
    'delete',
    'match',
    'ilike',
    'gte',
    'lt',
    'upsert',
  ];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

// ---- Sample data ----
const INSTANCE_ID = 'inst-123';

const mockInstanceData = {
  name: 'ARM CAR',
  short_name: 'ARM CAR',
  phone: '+48111222333',
  reservation_phone: '+48999888777',
  sms_limit: 100,
};

const mockSettings = [
  { message_type: 'reservation_confirmed', enabled: true, send_at_time: null },
  { message_type: 'reminder_1day', enabled: true, send_at_time: '19:00' },
  { message_type: 'reminder_1hour', enabled: false, send_at_time: null },
];

const mockLogs = [
  {
    phone: '+48123456789',
    message: 'ARM CAR: Rezerwacja potwierdzona!',
    created_at: '2026-04-02T10:00:00Z',
    message_type: 'confirmation',
    status: 'sent',
  },
  {
    phone: '+48987654321',
    message: 'ARM CAR: Przypomnienie - jutro o 10:00',
    created_at: '2026-04-01T19:00:00Z',
    message_type: 'reminder_1day',
    status: 'sent',
  },
];

function setupMocks(options?: { logs?: unknown[]; settings?: unknown[]; instance?: unknown }) {
  const logs = options?.logs ?? mockLogs;
  const settings = options?.settings ?? mockSettings;
  const instance = options?.instance ?? mockInstanceData;

  mockFrom.mockImplementation((table: string) => {
    if (table === 'instances') return createChainMock(instance);
    if (table === 'sms_message_settings') return createChainMock(settings);
    if (table === 'sms_logs') return createChainMock(logs);
    return createChainMock(null);
  });
}

const waitForLoaded = () =>
  waitFor(() => {
    expect(screen.getByText('Typy wiadomości SMS')).toBeInTheDocument();
  });

describe('SmsMessageSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    setupMocks();
    render(<SmsMessageSettings instanceId={INSTANCE_ID} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders month picker with current month', async () => {
    setupMocks();
    render(<SmsMessageSettings instanceId={INSTANCE_ID} />);

    const now = new Date();

    await waitFor(() => {
      expect(
        screen.getByText(`${POLISH_MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`),
      ).toBeInTheDocument();
    });
  });

  it('hides verification_code, reservation_pending, confirmed_by_admin, reservation_edited types', async () => {
    setupMocks();
    render(<SmsMessageSettings instanceId={INSTANCE_ID} />);
    await waitForLoaded();

    // Visible types
    expect(screen.getByText('Potwierdzenie rezerwacji')).toBeInTheDocument();
    expect(screen.getByText('Przypomnienie 1 dzień przed')).toBeInTheDocument();
    expect(screen.getByText('Przypomnienie w dniu wizyty')).toBeInTheDocument();
    expect(screen.getByText('Samochód do odbioru')).toBeInTheDocument();

    // Hidden types
    expect(screen.queryByText('Kod weryfikacyjny')).not.toBeInTheDocument();
    expect(screen.queryByText('Rezerwacja oczekująca')).not.toBeInTheDocument();
    expect(screen.queryByText('Potwierdzenie przez admina')).not.toBeInTheDocument();
    expect(screen.queryByText('Zmiana terminu zatwierdzona')).not.toBeInTheDocument();
  });

  it('renders SMS history table with log entries', async () => {
    setupMocks();
    render(<SmsMessageSettings instanceId={INSTANCE_ID} />);
    await waitForLoaded();

    expect(screen.getByText('Historia SMS (2)')).toBeInTheDocument();
    expect(screen.getByText('+48123456789')).toBeInTheDocument();
    expect(screen.getByText('+48987654321')).toBeInTheDocument();
    expect(screen.getAllByText('Wysłany')).toHaveLength(2);
  });

  it('shows empty state when no logs for selected month', async () => {
    setupMocks({ logs: [] });
    render(<SmsMessageSettings instanceId={INSTANCE_ID} />);
    await waitForLoaded();

    expect(screen.getByText('Brak wiadomości SMS w tym miesiącu')).toBeInTheDocument();
  });

  it('renders SmsUsageCard with count from logs', async () => {
    setupMocks();
    render(<SmsMessageSettings instanceId={INSTANCE_ID} />);
    await waitForLoaded();

    expect(screen.getByText('2 / 100')).toBeInTheDocument();
  });

  it('disables next month button on current month', async () => {
    setupMocks();
    render(<SmsMessageSettings instanceId={INSTANCE_ID} />);
    await waitForLoaded();

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find((btn) => btn.querySelector('svg.lucide-chevron-right'));
    expect(nextButton).toBeDisabled();
  });

  it('navigates to previous month', async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<SmsMessageSettings instanceId={INSTANCE_ID} />);
    await waitForLoaded();

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find((btn) => btn.querySelector('svg.lucide-chevron-left'));
    await user.click(prevButton!);

    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    await waitFor(() => {
      expect(
        screen.getByText(`${POLISH_MONTH_NAMES[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`),
      ).toBeInTheDocument();
    });
  });

  it('renders table headers', async () => {
    setupMocks();
    render(<SmsMessageSettings instanceId={INSTANCE_ID} />);
    await waitForLoaded();

    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Telefon')).toBeInTheDocument();
    expect(screen.getByText('Typ')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('does not render usage card when instanceId is null', () => {
    setupMocks();
    render(<SmsMessageSettings instanceId={null} />);
    expect(screen.queryByText('Zużycie SMS')).not.toBeInTheDocument();
  });
});
