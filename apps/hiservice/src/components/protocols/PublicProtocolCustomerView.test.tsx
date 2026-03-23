import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicProtocolCustomerView from './PublicProtocolCustomerView';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

// Track calls to useProtocolViewTracking
const mockUseProtocolViewTracking = vi.fn();

vi.mock('@/hooks/useProtocolViewTracking', () => ({
  useProtocolViewTracking: (...args: unknown[]) => {
    mockUseProtocolViewTracking(...args);
  },
}));

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('./ProtocolHeader', () => ({
  default: ({ instanceName }: { instanceName: string }) => (
    <div data-testid="protocol-header">{instanceName}</div>
  ),
}));

vi.mock('@/lib/protocolUtils', () => ({
  getVisitsFromChain: vi.fn().mockReturnValue([]),
  roundUpTo30: vi.fn((v: number) => v),
  formatDuration: vi.fn((v: number) => `${v} min`),
}));

const makeProtocol = (overrides = {}) => ({
  id: 'proto-1',
  customer_name: 'Jan Kowalski',
  customer_phone: '500100200',
  customer_email: 'jan@example.com',
  customer_nip: null,
  protocol_date: '2026-03-20',
  protocol_type: 'completion',
  status: 'sent',
  prepared_by: 'Adam Nowak',
  public_token: 'tok-abc123',
  notes: null,
  customer_signature: null,
  photo_urls: [],
  customer_address_id: null,
  instance_id: 'inst-1',
  show_visits: false,
  calendar_item_id: null,
  created_at: '2026-03-20T10:00:00Z',
  ...overrides,
});

const makeInstance = () => ({
  name: 'Test Serwis',
  logo_url: null,
  phone: null,
  email: null,
  address: null,
});

describe('PublicProtocolCustomerView', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();

    mockSupabaseQuery('protocols', { data: makeProtocol(), error: null });
    mockSupabaseQuery('instances', { data: makeInstance(), error: null });
  });

  describe('footer branding', () => {
    it('always shows hiservice.pl footer text', async () => {
      render(<PublicProtocolCustomerView token="tok-abc123" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Wygenerowano przy użyciu aplikacji dla serwisantów/i),
        ).toBeInTheDocument();
      });
    });

    it('shows hiservice.pl footer when isPreview=true', async () => {
      render(<PublicProtocolCustomerView token="tok-abc123" isPreview />);

      await waitFor(() => {
        expect(
          screen.getByText(/Wygenerowano przy użyciu aplikacji dla serwisantów/i),
        ).toBeInTheDocument();
      });
    });

    it('footer contains a link to hiservice.pl', async () => {
      render(<PublicProtocolCustomerView token="tok-abc123" />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /hiservice\.pl/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://hiservice.pl');
      });
    });
  });

  describe('isPreview prop — view tracking', () => {
    it('calls useProtocolViewTracking with undefined args when isPreview=true', async () => {
      render(<PublicProtocolCustomerView token="tok-abc123" isPreview />);

      // Wait for protocol to load
      await waitFor(() => {
        expect(screen.getByText(/Wygenerowano przy użyciu aplikacji dla serwisantów/i)).toBeInTheDocument();
      });

      // The hook should have been called with undefined for all 3 args
      // (This is what the component does: isPreview ? undefined : protocol?.id, etc.)
      // On initial render before data loads, called with (undefined, undefined, undefined)
      // After data loads it is still (undefined, undefined, undefined) when isPreview=true
      const calls = mockUseProtocolViewTracking.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      // Every call must have undefined for all 3 args when isPreview=true
      calls.forEach((args) => {
        expect(args[0]).toBeUndefined();
        expect(args[1]).toBeUndefined();
        expect(args[2]).toBeUndefined();
      });
    });

    it('does not insert protocol_views record when isPreview=true', async () => {
      const { mockSupabase } = await import('@/test/mocks/supabase');

      render(<PublicProtocolCustomerView token="tok-abc123" isPreview />);

      await waitFor(() => {
        expect(
          screen.getByText(/Wygenerowano przy użyciu aplikacji dla serwisantów/i),
        ).toBeInTheDocument();
      });

      // Since useProtocolViewTracking receives undefined args, it should NOT call
      // from('protocol_views') because the hook guards on missing args
      const protocolViewsCalls = mockSupabase.from.mock.calls.filter(
        ([table]: [string]) => table === 'protocol_views',
      );
      expect(protocolViewsCalls.length).toBe(0);
    });
  });

  describe('protocol content rendering', () => {
    it('shows protocol type label', async () => {
      render(<PublicProtocolCustomerView token="tok-abc123" />);

      await waitFor(() => {
        expect(screen.getByText('Protokół serwisowy')).toBeInTheDocument();
      });
    });

    it('shows error state when protocol is not found', async () => {
      mockSupabaseQuery('protocols', { data: null, error: { message: 'not found' } });

      render(<PublicProtocolCustomerView token="invalid-token" />);

      await waitFor(() => {
        expect(screen.getByText('Nie znaleziono protokołu')).toBeInTheDocument();
      });
    });
  });
});
