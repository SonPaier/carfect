import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { InstructionSendHistory } from './InstructionSendHistory';

const mockUseInstructionSends = vi.fn();
vi.mock('../hooks/useInstructionSends', () => ({
  useInstructionSends: (...args: unknown[]) => mockUseInstructionSends(...args),
}));

vi.mock('../hooks/useSendInstruction', () => ({
  buildInstructionPublicUrl: (slug: string, token: string) =>
    `https://${slug}.carfect.pl/instructions/${token}`,
}));

function renderHistory() {
  return render(
    React.createElement(InstructionSendHistory, {
      reservationId: 'res-1',
      instanceId: 'inst-1',
      instanceSlug: 'armcar',
      supabase: {} as never,
    }),
  );
}

const sendBase = {
  id: 'send-1',
  instruction_id: 'instr-1',
  reservation_id: 'res-1',
  customer_id: 'cust-1',
  instance_id: 'inst-1',
  public_token: 'tok-abc',
  sent_at: '2026-04-25T10:30:00Z',
  viewed_at: null as string | null,
  created_by: null,
  post_sale_instructions: {
    id: 'instr-1',
    title: 'PPF Care Guide',
    hardcoded_key: 'ppf',
  },
};

beforeEach(() => {
  mockUseInstructionSends.mockReset();
});

describe('InstructionSendHistory', () => {
  it('renders the empty state when there are no sends', () => {
    mockUseInstructionSends.mockReturnValue({ data: [], isLoading: false });
    renderHistory();
    expect(screen.getByText('Brak wysłanych instrukcji')).toBeInTheDocument();
  });

  it('renders one row per send with title, sent_at, and viewed status', () => {
    mockUseInstructionSends.mockReturnValue({
      data: [
        sendBase,
        {
          ...sendBase,
          id: 'send-2',
          public_token: 'tok-xyz',
          sent_at: '2026-04-20T09:00:00Z',
          post_sale_instructions: { ...sendBase.post_sale_instructions, title: 'Ceramic' },
        },
      ],
      isLoading: false,
    });

    renderHistory();

    expect(screen.getByText('PPF Care Guide')).toBeInTheDocument();
    expect(screen.getByText('Ceramic')).toBeInTheDocument();
    expect(screen.getAllByText(/Wysłano:/).length).toBe(2);
  });

  it('shows the not-viewed label when viewed_at is null', () => {
    mockUseInstructionSends.mockReturnValue({
      data: [{ ...sendBase, viewed_at: null }],
      isLoading: false,
    });

    renderHistory();

    expect(screen.getByText(/Jeszcze nie obejrzane/)).toBeInTheDocument();
  });

  it('shows the formatted viewedAt label when viewed_at is present', () => {
    mockUseInstructionSends.mockReturnValue({
      data: [{ ...sendBase, viewed_at: '2026-04-25T11:00:00Z' }],
      isLoading: false,
    });

    renderHistory();

    expect(screen.getByText(/Otwarto:/)).toBeInTheDocument();
    expect(screen.queryByText(/Jeszcze nie obejrzane/)).not.toBeInTheDocument();
  });

  it('opens the public URL in a new tab via the external link anchor', () => {
    mockUseInstructionSends.mockReturnValue({
      data: [sendBase],
      isLoading: false,
    });

    renderHistory();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://armcar.carfect.pl/instructions/tok-abc');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
