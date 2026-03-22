import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerRemindersTab } from './CustomerRemindersTab';

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

// Mock AddCustomerReminderDialog to control its behavior in tests
let capturedOnReminderAdded: (() => void) | null = null;

vi.mock('./AddCustomerReminderDialog', () => ({
  AddCustomerReminderDialog: ({
    open,
    onReminderAdded,
  }: {
    open: boolean;
    onReminderAdded: () => void;
  }) => {
    capturedOnReminderAdded = onReminderAdded;
    return open ? <div data-testid="add-reminder-dialog">AddReminderDialog</div> : null;
  },
}));

// ---- Sample data ----
const mockReminders = [
  {
    id: 'rem-1',
    scheduled_date: '2026-06-15',
    months_after: 7,
    service_type: 'odswiezenie_powloki',
    status: 'scheduled',
    sent_at: null,
    vehicle_plate: 'BMW X5',
    reminder_template_id: 'tpl-1',
    reminder_templates: { name: 'Ceramika 36 miesięcy' },
  },
  {
    id: 'rem-2',
    scheduled_date: '2026-12-15',
    months_after: 13,
    service_type: 'odswiezenie_powloki',
    status: 'scheduled',
    sent_at: null,
    vehicle_plate: 'BMW X5',
    reminder_template_id: 'tpl-1',
    reminder_templates: { name: 'Ceramika 36 miesięcy' },
  },
];

const mockRemindersAfterAdd = [
  ...mockReminders,
  {
    id: 'rem-3',
    scheduled_date: '2027-01-10',
    months_after: 7,
    service_type: 'kontrola',
    status: 'scheduled',
    sent_at: null,
    vehicle_plate: 'Audi A4',
    reminder_template_id: 'tpl-2',
    reminder_templates: { name: 'PPF Folia' },
  },
];

const defaultProps = {
  customerPhone: '+48111222333',
  customerName: 'Jan Kowalski',
  instanceId: 'inst-1',
};

describe('CustomerRemindersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnReminderAdded = null;
  });

  it('shows reminders after loading', async () => {
    mockFrom.mockImplementation(() => createChainMock(mockReminders));

    render(<CustomerRemindersTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Ceramika 36 miesięcy')).toBeInTheDocument();
    });

    expect(screen.getByText(/BMW X5/)).toBeInTheDocument();
  });

  it('shows empty state when no reminders exist', async () => {
    mockFrom.mockImplementation(() => createChainMock([]));

    render(<CustomerRemindersTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Brak przypomnień/)).toBeInTheDocument();
    });
  });

  it('opens add reminder dialog when button is clicked', async () => {
    const user = userEvent.setup();
    mockFrom.mockImplementation(() => createChainMock([]));

    render(<CustomerRemindersTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Brak przypomnień/)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Dodaj przypomnienie/));

    expect(screen.getByTestId('add-reminder-dialog')).toBeInTheDocument();
  });

  it('shows new reminder immediately after adding without full loading spinner', async () => {
    // First load: return initial reminders
    mockFrom.mockImplementation(() => createChainMock(mockReminders));

    render(<CustomerRemindersTab {...defaultProps} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Ceramika 36 miesięcy')).toBeInTheDocument();
    });

    // Now simulate adding a reminder: update mock to return new data
    mockFrom.mockImplementation(() => createChainMock(mockRemindersAfterAdd));

    // Trigger the callback (simulates what AddCustomerReminderDialog does after insert)
    capturedOnReminderAdded!();

    // The new reminder should appear WITHOUT showing a loading spinner
    // (silent refetch keeps existing content visible)
    await waitFor(() => {
      expect(screen.getByText('PPF Folia')).toBeInTheDocument();
    });

    // Original reminders should still be visible (no flash/disappear)
    expect(screen.getByText('Ceramika 36 miesięcy')).toBeInTheDocument();
  });

  it('shows error toast when loading reminders fails', async () => {
    mockFrom.mockImplementation(() => createChainMock(null, { message: 'Network error' }));

    render(<CustomerRemindersTab {...defaultProps} />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  it('groups reminders by template and vehicle', async () => {
    const mixedReminders = [
      ...mockReminders,
      {
        id: 'rem-other',
        scheduled_date: '2026-08-01',
        months_after: 1,
        service_type: 'kontrola',
        status: 'scheduled',
        sent_at: null,
        vehicle_plate: 'Audi A4',
        reminder_template_id: 'tpl-2',
        reminder_templates: { name: 'PPF Folia' },
      },
    ];

    mockFrom.mockImplementation(() => createChainMock(mixedReminders));

    render(<CustomerRemindersTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Ceramika 36 miesięcy')).toBeInTheDocument();
    });

    // Both groups should be visible
    expect(screen.getByText('PPF Folia')).toBeInTheDocument();
    expect(screen.getByText(/BMW X5/)).toBeInTheDocument();
    expect(screen.getByText(/Audi A4/)).toBeInTheDocument();
  });
});
