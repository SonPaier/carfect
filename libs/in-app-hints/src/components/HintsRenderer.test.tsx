import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HintsRenderer } from './HintsRenderer';
import type { AppHint } from '../types';

// ---- Mocks ----
const mockDismiss = vi.fn();
vi.mock('../hooks/useDismissHint', () => ({
  useDismissHint: () => ({ mutate: mockDismiss }),
}));

// Mock useAppHints — we control returned data via mockHintsData
let mockHintsData: AppHint[] = [];
vi.mock('../hooks/useAppHints', () => ({
  useAppHints: () => ({ data: mockHintsData }),
}));

// ---- Helpers ----
const makeHint = (overrides: Partial<AppHint> = {}): AppHint => ({
  id: 'h1',
  type: 'popup',
  title: 'Test popup',
  body: 'Treść',
  image_url: null,
  target_element_id: null,
  route_pattern: '/admin',
  target_roles: ['admin'],
  delay_ms: 0,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const mockSupabase = {
  from: (_table: string) => ({
    select: (_cols: string) => Promise.resolve({ data: [], error: null }),
    eq: (_col: string, _val: unknown) => Promise.resolve({ data: [], error: null }),
  }),
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function renderRenderer(options: { userRoles?: string[]; currentRoute?: string } = {}) {
  const { userRoles = ['admin'], currentRoute = '/admin' } = options;
  return render(
    <HintsRenderer
      supabaseClient={mockSupabase}
      userId="user-1"
      userRoles={userRoles}
      currentRoute={currentRoute}
    />,
    { wrapper },
  );
}

describe('HintsRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHintsData = [];
  });

  it('IAH-C-001: renders nothing when there are no hints', () => {
    renderRenderer();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('IAH-C-002: renders popup when type is popup', () => {
    mockHintsData = [makeHint({ type: 'popup', title: 'Witaj w systemie' })];
    renderRenderer();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Witaj w systemie')).toBeInTheDocument();
  });

  it('IAH-C-003: renders infobox when type is infobox', () => {
    mockHintsData = [makeHint({ type: 'infobox', title: 'Nowa funkcja' })];
    renderRenderer();
    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText('Nowa funkcja')).toBeInTheDocument();
  });

  it('IAH-C-004: does not render hints for different role', () => {
    mockHintsData = [makeHint({ target_roles: ['sales'] })];
    renderRenderer({ userRoles: ['admin'] });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('IAH-C-005: does not render hints for different route', () => {
    mockHintsData = [makeHint({ route_pattern: '/halls' })];
    renderRenderer({ currentRoute: '/admin' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('IAH-C-006: renders only first popup when multiple exist', () => {
    mockHintsData = [
      makeHint({ id: '1', type: 'popup', title: 'Popup 1' }),
      makeHint({ id: '2', type: 'popup', title: 'Popup 2' }),
    ];
    renderRenderer();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByText('Popup 1')).toBeInTheDocument();
    expect(screen.queryByText('Popup 2')).not.toBeInTheDocument();
  });

  it('IAH-C-007: dismissing infobox hides it immediately (optimistic update)', async () => {
    mockHintsData = [makeHint({ type: 'infobox', title: 'Baner info' })];
    const user = userEvent.setup();
    renderRenderer();

    const closeBtn = screen.getByRole('button', { name: /zamknij/i });
    await user.click(closeBtn);

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
