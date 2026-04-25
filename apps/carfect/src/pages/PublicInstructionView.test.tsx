import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';
import PublicInstructionView from './PublicInstructionView';

const mockUsePublicInstruction = vi.fn();
vi.mock('@shared/post-sale-instructions', () => ({
  usePublicInstruction: (...args: unknown[]) => mockUsePublicInstruction(...args),
  InstructionPublicView: ({ publicToken }: { publicToken: string }) => (
    <div data-testid="public-view">view:{publicToken}</div>
  ),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {} as never,
}));

function renderAt(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/instrukcje/:slug" element={<PublicInstructionView />} />
          <Route path="/instrukcje" element={<PublicInstructionView />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  mockUsePublicInstruction.mockReset();
});

describe('PublicInstructionView', () => {
  it('renders a loading indicator while fetching', () => {
    mockUsePublicInstruction.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    renderAt('/instrukcje/tok-123');
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('renders the InstructionPublicView with fetched data on success', async () => {
    mockUsePublicInstruction.mockReturnValue({
      data: {
        title: 'PPF Care',
        content: { type: 'doc', content: [] },
        instance: { name: 'Armcar' },
      },
      isLoading: false,
      error: null,
    });
    renderAt('/instrukcje/tok-abc');
    await waitFor(() => {
      expect(screen.getByTestId('public-view')).toBeInTheDocument();
    });
    expect(screen.getByText('view:tok-abc')).toBeInTheDocument();
  });

  it('renders the not-found error card when usePublicInstruction returns an error', () => {
    mockUsePublicInstruction.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('PGRST116'),
    });
    renderAt('/instrukcje/tok-bad');
    expect(
      screen.getByText('Nie znaleziono instrukcji lub link jest nieprawidłowy.'),
    ).toBeInTheDocument();
  });

  it('renders the not-found error card when data is null after loading', () => {
    mockUsePublicInstruction.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    renderAt('/instrukcje/tok-empty');
    expect(
      screen.getByText('Nie znaleziono instrukcji lub link jest nieprawidłowy.'),
    ).toBeInTheDocument();
  });

  it('sets the document title via Helmet using metaTitle', async () => {
    mockUsePublicInstruction.mockReturnValue({
      data: {
        title: 'PPF Care',
        content: { type: 'doc', content: [] },
        instance: { name: 'Armcar' },
      },
      isLoading: false,
      error: null,
    });
    renderAt('/instrukcje/tok-title');
    await waitFor(() => {
      expect(document.title).toBe('PPF Care – Armcar');
    });
  });
});
