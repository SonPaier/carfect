import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RollUsageTab from './RollUsageTab';
import type { SalesRoll, SalesRollUsage } from '../types/rolls';

// ─── Service mock ─────────────────────────────────────────────

vi.mock('../services/rollService', () => ({
  fetchRollUsages: vi.fn(),
  createManualRollUsage: vi.fn(),
  updateManualRollUsage: vi.fn(),
  deleteRollUsage: vi.fn(),
}));

import {
  fetchRollUsages,
  createManualRollUsage,
  updateManualRollUsage,
  deleteRollUsage,
} from '../services/rollService';

const mockFetchRollUsages = vi.mocked(fetchRollUsages);
const mockCreateManualRollUsage = vi.mocked(createManualRollUsage);
const mockUpdateManualRollUsage = vi.mocked(updateManualRollUsage);
const mockDeleteRollUsage = vi.mocked(deleteRollUsage);

// ─── Helpers ──────────────────────────────────────────────────

const makeRoll = (overrides: Partial<SalesRoll> = {}): SalesRoll => ({
  id: 'roll-1',
  instanceId: 'inst-1',
  brand: 'Hexis',
  productName: 'HX20000',
  widthMm: 1524,
  lengthM: 50,
  initialLengthM: 50,
  initialRemainingMb: 50,
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeUsage = (overrides: Partial<SalesRollUsage> = {}): SalesRollUsage => ({
  id: 'usage-1',
  rollId: 'roll-1',
  orderId: null,
  orderItemId: null,
  usedM2: 3.05,
  usedMb: 2.0,
  source: 'manual',
  workerName: null,
  note: null,
  createdAt: '2026-03-15T10:00:00Z',
  ...overrides,
});

// ─── Setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchRollUsages.mockResolvedValue([]);
  mockCreateManualRollUsage.mockResolvedValue('new-usage-id');
  mockUpdateManualRollUsage.mockResolvedValue(undefined);
  mockDeleteRollUsage.mockResolvedValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────

describe('RollUsageTab — add button and empty state', () => {
  it('shows "Dodaj zużycie" button initially', async () => {
    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dodaj zużycie/i })).toBeInTheDocument();
    });
  });

  it('shows empty state "Brak zużycia dla tej rolki" when no usages', async () => {
    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByText('Brak zużycia dla tej rolki')).toBeInTheDocument();
    });
  });
});

describe('RollUsageTab — form visibility', () => {
  it('clicking "Dodaj zużycie" shows the form with source toggle buttons', async () => {
    const user = userEvent.setup();
    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dodaj zużycie/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Dodaj zużycie/i }));

    expect(screen.getByRole('button', { name: 'Ręczne' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pracownik' })).toBeInTheDocument();
  });
});

describe('RollUsageTab — source toggle', () => {
  it('clicking "Pracownik" shows worker name input', async () => {
    const user = userEvent.setup();
    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dodaj zużycie/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Dodaj zużycie/i }));

    // Before clicking Pracownik: only note + mb inputs (2 textboxes: note + spinbutton for mb)
    expect(screen.queryByText('Imię pracownika')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pracownik' }));

    // After clicking Pracownik: label for worker name should appear
    expect(screen.getByText('Imię pracownika')).toBeInTheDocument();
  });

  it('clicking "Ręczne" hides worker name input', async () => {
    const user = userEvent.setup();
    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dodaj zużycie/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Dodaj zużycie/i }));

    // Switch to Pracownik first to show worker input
    await user.click(screen.getByRole('button', { name: 'Pracownik' }));
    expect(screen.getByText('Imię pracownika')).toBeInTheDocument();

    // Switch back to Ręczne — worker name label should disappear
    await user.click(screen.getByRole('button', { name: 'Ręczne' }));
    expect(screen.queryByText('Imię pracownika')).not.toBeInTheDocument();
  });
});

describe('RollUsageTab — m² conversion', () => {
  it('shows m² conversion when valid mb is entered', async () => {
    const user = userEvent.setup();
    // widthMm: 1000 → 2.0 mb * (1000/1000) = 2.00 m²
    render(<RollUsageTab roll={makeRoll({ widthMm: 1000 })} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dodaj zużycie/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Dodaj zużycie/i }));

    // The mb input is a number (spinbutton role)
    const mbInput = screen.getByRole('spinbutton');
    await user.type(mbInput, '2');

    expect(screen.getByText(/= 2\.00 m²/)).toBeInTheDocument();
  });
});

describe('RollUsageTab — submit button disabled state', () => {
  it('submit button is disabled when mb input is empty', async () => {
    const user = userEvent.setup();
    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dodaj zużycie/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Dodaj zużycie/i }));

    // The submit button is labeled "Dodaj" when adding new
    const submitBtn = screen.getByRole('button', { name: 'Dodaj' });
    expect(submitBtn).toBeDisabled();
  });

  it('submit button is disabled when mb input is zero or negative', async () => {
    const user = userEvent.setup();
    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dodaj zużycie/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Dodaj zużycie/i }));

    const mbInput = screen.getByRole('spinbutton');
    await user.type(mbInput, '0');

    const submitBtn = screen.getByRole('button', { name: 'Dodaj' });
    expect(submitBtn).toBeDisabled();
  });

  it('submit button is enabled when valid mb is entered', async () => {
    const user = userEvent.setup();
    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dodaj zużycie/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Dodaj zużycie/i }));

    const mbInput = screen.getByRole('spinbutton');
    await user.type(mbInput, '5');

    const submitBtn = screen.getByRole('button', { name: 'Dodaj' });
    expect(submitBtn).not.toBeDisabled();
  });
});

describe('RollUsageTab — usage cards rendering', () => {
  it('renders usage cards with source label, date, mb and m² values', async () => {
    const usage = makeUsage({
      source: 'manual',
      usedMb: 2.0,
      usedM2: 3.05,
      createdAt: '2026-03-15T10:00:00Z',
    });
    mockFetchRollUsages.mockResolvedValue([usage]);

    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByText('Ręczne')).toBeInTheDocument();
    });

    expect(screen.getByText('15.03.2026')).toBeInTheDocument();
    expect(screen.getByText(/2\.00 mb/)).toBeInTheDocument();
    expect(screen.getByText(/3\.05 m²/)).toBeInTheDocument();
  });

  it('worker usage cards show worker name', async () => {
    const usage = makeUsage({
      source: 'worker',
      workerName: 'Jan Kowalski',
    });
    mockFetchRollUsages.mockResolvedValue([usage]);

    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByText('Pracownik')).toBeInTheDocument();
    });

    expect(screen.getByText(/Jan Kowalski/)).toBeInTheDocument();
  });

  it('usage cards with note show the note text', async () => {
    const usage = makeUsage({
      source: 'manual',
      note: 'Extra note for this usage',
    });
    mockFetchRollUsages.mockResolvedValue([usage]);

    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByText('Extra note for this usage')).toBeInTheDocument();
    });
  });
});

describe('RollUsageTab — edit/delete button visibility', () => {
  it('order-type usage cards do NOT show edit/delete buttons', async () => {
    const usage = makeUsage({
      id: 'order-usage-1',
      source: 'order',
      orderId: 'order-1',
      orderItemId: 'item-1',
    });
    mockFetchRollUsages.mockResolvedValue([usage]);

    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByText('Zamówienie')).toBeInTheDocument();
    });

    // Edit and delete buttons should NOT be present for order usages
    // The card has no pencil/trash buttons — verify no interactive buttons exist in the card
    // beyond what the top-level component renders
    const editButtons = screen.queryAllByRole('button').filter((btn) => {
      const svg = btn.querySelector('svg');
      return svg !== null && btn.closest('[class*="rounded-lg"]') !== null;
    });
    // Only the "Dodaj zużycie" button should remain (top-level), no edit/delete inside card
    const addButton = screen.getByRole('button', { name: /Dodaj zużycie/i });
    expect(addButton).toBeInTheDocument();

    // Confirm edit icon button is not inside the usage card
    // The card renders no interactive buttons for order source
    const allButtons = screen.getAllByRole('button');
    // Only the top-level "Dodaj zużycie" button should exist
    expect(allButtons).toHaveLength(1);
  });

  it('manual usage cards show edit and delete buttons', async () => {
    const usage = makeUsage({ source: 'manual' });
    mockFetchRollUsages.mockResolvedValue([usage]);

    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByText('Ręczne')).toBeInTheDocument();
    });

    // With manual usage, the top-level "Dodaj zużycie" button + 2 icon buttons (edit + delete)
    const allButtons = screen.getAllByRole('button');
    // "Dodaj zużycie" + pencil + trash = 3 buttons
    expect(allButtons).toHaveLength(3);
  });

  it('worker usage cards show edit and delete buttons', async () => {
    const usage = makeUsage({ source: 'worker', workerName: 'Anna' });
    mockFetchRollUsages.mockResolvedValue([usage]);

    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByText('Pracownik')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    // "Dodaj zużycie" + pencil + trash = 3 buttons
    expect(allButtons).toHaveLength(3);
  });
});

describe('RollUsageTab — edit populates form', () => {
  it('clicking edit on a card populates the form with that card data', async () => {
    const user = userEvent.setup();
    const usage = makeUsage({
      source: 'manual',
      usedMb: 3.5,
      note: 'Test note',
    });
    mockFetchRollUsages.mockResolvedValue([usage]);

    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByText('Ręczne')).toBeInTheDocument();
    });

    // Buttons: "Dodaj zużycie", pencil, trash
    const allButtons = screen.getAllByRole('button');
    const pencilButton = allButtons[1];
    await user.click(pencilButton);

    // Form should now be visible with pre-filled mb value (spinbutton for number input)
    const mbInput = screen.getByRole('spinbutton');
    expect(mbInput).toHaveValue(3.5);

    // Note input is the second textbox (first is worker name, which is not shown for manual)
    // There is 1 textbox: the note input
    const textboxes = screen.getAllByRole('textbox');
    // The note field is the only textbox for manual source
    const noteInput = textboxes[textboxes.length - 1];
    expect(noteInput).toHaveValue('Test note');

    // Submit button should say "Zapisz" (editing mode)
    expect(screen.getByRole('button', { name: 'Zapisz' })).toBeInTheDocument();
  });

  it('clicking edit on a worker card populates worker name field', async () => {
    const user = userEvent.setup();
    const usage = makeUsage({
      source: 'worker',
      workerName: 'Marek Nowak',
      usedMb: 1.5,
    });
    mockFetchRollUsages.mockResolvedValue([usage]);

    render(<RollUsageTab roll={makeRoll()} />);

    await waitFor(() => {
      expect(screen.getByText('Pracownik')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    const pencilButton = allButtons[1];
    await user.click(pencilButton);

    // Worker name label should appear and the first textbox should hold the worker name
    expect(screen.getByText('Imię pracownika')).toBeInTheDocument();
    const textboxes = screen.getAllByRole('textbox');
    // First textbox is worker name, last is note
    expect(textboxes[0]).toHaveValue('Marek Nowak');
  });
});
