import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScopesStep } from './ScopesStep';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

const INSTANCE_ID = 'test-instance-id';

const mockScopes = [
  {
    id: 's1',
    name: 'PPF',
    description: 'Protection film',
    has_coating_upsell: false,
    is_extras_scope: false,
  },
  {
    id: 's2',
    name: 'Ceramic',
    description: null,
    has_coating_upsell: true,
    is_extras_scope: false,
  },
];

describe('ScopesStep', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockSupabaseQuery('offer_scopes', { data: mockScopes, error: null });
  });

  it('renders scope cards after loading', async () => {
    render(<ScopesStep instanceId={INSTANCE_ID} selectedScopeIds={[]} onScopesChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('PPF')).toBeInTheDocument();
      expect(screen.getByText('Ceramic')).toBeInTheDocument();
    });
  });

  it('shows +Powloka badge for scopes with coating upsell', async () => {
    render(<ScopesStep instanceId={INSTANCE_ID} selectedScopeIds={[]} onScopesChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('+Powłoka')).toBeInTheDocument();
    });
  });

  it('toggles scope selection on click', async () => {
    const user = userEvent.setup();
    const onScopesChange = vi.fn();

    render(
      <ScopesStep instanceId={INSTANCE_ID} selectedScopeIds={[]} onScopesChange={onScopesChange} />,
    );

    await waitFor(() => {
      expect(screen.getByText('PPF')).toBeInTheDocument();
    });

    await user.click(screen.getByText('PPF'));
    expect(onScopesChange).toHaveBeenCalledWith(['s1']);
  });

  it('deselects scope when clicking already selected', async () => {
    const user = userEvent.setup();
    const onScopesChange = vi.fn();

    render(
      <ScopesStep
        instanceId={INSTANCE_ID}
        selectedScopeIds={['s1']}
        onScopesChange={onScopesChange}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('PPF')).toBeInTheDocument();
    });

    await user.click(screen.getByText('PPF'));
    expect(onScopesChange).toHaveBeenCalledWith([]);
  });

  it('shows empty state when no scopes', async () => {
    mockSupabaseQuery('offer_scopes', { data: [], error: null });

    render(<ScopesStep instanceId={INSTANCE_ID} selectedScopeIds={[]} onScopesChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/brak zdefiniowanych szablonów/i)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<ScopesStep instanceId={INSTANCE_ID} selectedScopeIds={[]} onScopesChange={vi.fn()} />);

    expect(screen.getByText(/ładowanie/i)).toBeInTheDocument();
  });
});
