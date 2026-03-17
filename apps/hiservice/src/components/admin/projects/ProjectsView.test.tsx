import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectsView from './ProjectsView';
import { mockSupabase, mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Stub out the AddEditProjectDrawer and ProjectDetailsDrawer to keep tests focused on ProjectsView cache logic
vi.mock('./AddEditProjectDrawer', () => ({
  default: ({ open, onSuccess }: { open: boolean; onSuccess: () => void }) =>
    open ? (
      <div data-testid="add-edit-drawer">
        <button onClick={onSuccess}>submit-drawer</button>
      </div>
    ) : null,
}));

vi.mock('./ProjectDetailsDrawer', () => ({
  default: () => null,
}));

// dnd-kit — not needed for cache regression tests
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

const PROJECT_A = {
  id: 'proj-a',
  title: 'Project Alpha',
  description: null,
  customer_id: null,
  customer_address_id: null,
  status: 'not_started',
  notes: null,
  created_at: '2026-01-01T10:00:00Z',
};

const PROJECT_B = {
  id: 'proj-b',
  title: 'Project Beta',
  description: null,
  customer_id: null,
  customer_address_id: null,
  status: 'not_started',
  notes: null,
  created_at: '2026-01-02T10:00:00Z',
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderView(queryClient: QueryClient) {
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ProjectsView instanceId="inst-1" />
    </QueryClientProvider>,
  );
  return { user, ...result };
}

describe('ProjectsView — cache management regression tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMocks();
    mockSupabaseQuery('projects', { data: [PROJECT_A, PROJECT_B], error: null });
    mockSupabaseQuery('customers', { data: [], error: null });
    mockSupabaseQuery('customer_addresses', { data: [], error: null });
    mockSupabaseQuery('calendar_items', { data: [], error: null });
    mockSupabaseQuery('projects', { data: null, error: null }, 'update');
    mockSupabaseQuery('projects', { data: null, error: null }, 'delete');
  });

  async function waitForProjectsLoaded() {
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
  }

  // Regression: Bug 2 — deleted project must not reappear in list
  it('removes deleted project from list immediately without reappearing (optimistic delete)', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const queryClient = makeQueryClient();
    const { user } = renderView(queryClient);
    await waitForProjectsLoaded();

    // After delete succeeds, DB returns only Project Beta
    mockSupabaseQuery('projects', { data: [PROJECT_B], error: null });

    const alphaRow = screen.getByText('Project Alpha').closest('tr')!;
    const moreBtn = alphaRow.querySelector('button[aria-haspopup]') as HTMLElement;
    await user.click(moreBtn);

    const deleteItem = await waitFor(() => screen.getByText('Usuń'));
    await user.click(deleteItem);

    await waitFor(() => {
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('calls invalidateQueries after successful delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { user } = renderView(queryClient);
    await waitForProjectsLoaded();

    // After delete succeeds, DB returns only Project Beta
    mockSupabaseQuery('projects', { data: [PROJECT_B], error: null });

    const alphaRow = screen.getByText('Project Alpha').closest('tr')!;
    const moreBtn = alphaRow.querySelector('button[aria-haspopup]') as HTMLElement;
    await user.click(moreBtn);
    const deleteItem = await waitFor(() => screen.getByText('Usuń'));
    await user.click(deleteItem);

    await waitFor(() => {
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    });

    const projectsCalls = invalidateSpy.mock.calls.filter(
      (args) => JSON.stringify(args[0]).includes('"projects"'),
    );
    expect(projectsCalls.length).toBeGreaterThan(0);
  });

  // Regression: Bug 3 — projects-orders queryKey must include projectIds so the stale closure
  // does not fetch orders for deleted projects after removal
  it('does not include deleted project id in projects-orders query key after delete', async () => {
    const queryClient = makeQueryClient();
    renderView(queryClient);
    await waitForProjectsLoaded();

    // Both projects are in cache initially
    const initialKey = queryClient
      .getQueryCache()
      .findAll({ queryKey: ['projects-orders', 'inst-1'] });
    // The query key should contain the project ids array
    const keyWithBothProjects = initialKey.find((q) =>
      JSON.stringify(q.queryKey).includes('proj-a'),
    );
    expect(keyWithBothProjects).toBeDefined();

    // Simulate handleDelete optimistic removal — projects cache loses proj-a
    act(() => {
      queryClient.setQueryData(['projects', 'inst-1'], [PROJECT_B]);
    });

    // After re-render, the projects-orders query key should no longer include proj-a
    // because projectIds (derived via useMemo from projects) changed and is part of the key
    await waitFor(() => {
      const updatedKeys = queryClient
        .getQueryCache()
        .findAll({ queryKey: ['projects-orders', 'inst-1'] });
      const keyWithDeletedProject = updatedKeys.find(
        (q) => JSON.stringify(q.queryKey).includes('proj-a') && q.isActive(),
      );
      expect(keyWithDeletedProject).toBeUndefined();
    });
  });

  // Regression: delete error rolls back optimistic removal
  it('rolls back optimistic delete when DB returns an error', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    // Override delete mock to return an error
    mockSupabaseQuery('projects', { data: null, error: { message: 'FK violation', code: '23503' } }, 'delete');
    mockSupabaseQuery('calendar_items', { data: null, error: null }, 'update');

    const queryClient = makeQueryClient();
    const { user } = renderView(queryClient);
    await waitForProjectsLoaded();

    const alphaRow = screen.getByText('Project Alpha').closest('tr')!;
    const moreBtn = alphaRow.querySelector('button[aria-haspopup]') as HTMLElement;
    await user.click(moreBtn);

    const deleteItem = await waitFor(() => screen.getByText('Usuń'));
    await user.click(deleteItem);

    // After DB error, invalidateQueries refetches and restores Project Alpha
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
  });

  // Regression: Bug 5 — no infinite invalidation loop when projects and orders both change
  it('does not trigger infinite refetch loop when projects list updates', async () => {
    const queryClient = makeQueryClient();
    renderView(queryClient);
    await waitForProjectsLoaded();

    const refetchSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // Simulate a projects data update (e.g. after add/delete)
    act(() => {
      queryClient.setQueryData(['projects', 'inst-1'], [PROJECT_B]);
    });

    // Allow any effects to settle
    await new Promise((r) => setTimeout(r, 100));

    // invalidateQueries should not have been called as a cascade reaction to the data update
    // (the old auto-status useEffect would call it once per in-progress project)
    expect(refetchSpy).not.toHaveBeenCalled();
  });

  // Regression: Bug 1 — new project appears immediately after add (refetch triggered on onSuccess)
  it('triggers a refetch of projects query immediately after successful add', async () => {
    const queryClient = makeQueryClient();
    const { user } = renderView(queryClient);
    await waitForProjectsLoaded();

    const NEW_PROJECT = {
      ...PROJECT_A,
      id: 'proj-new',
      title: 'New Project',
      created_at: '2026-03-01T10:00:00Z',
    };

    // After onSuccess the component calls refetchQueries — mock the fetch to return the new project
    mockSupabaseQuery('projects', { data: [PROJECT_A, PROJECT_B, NEW_PROJECT], error: null });

    // Open the add drawer and submit
    await user.click(screen.getByRole('button', { name: /dodaj projekt/i }));
    const submitBtn = await waitFor(() => screen.getByText('submit-drawer'));
    await user.click(submitBtn);

    // New project must appear without manual page refresh
    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });
});
