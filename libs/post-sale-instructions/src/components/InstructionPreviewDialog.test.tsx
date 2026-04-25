import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstructionPreviewDialog } from './InstructionPreviewDialog';
import type { InstructionListItem } from '../types';

const previewInstructionPdf = vi.fn();
vi.mock('../pdfClient', () => ({
  previewInstructionPdf: (...args: unknown[]) => previewInstructionPdf(...args),
  openInstructionPdf: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const builtinPpf: InstructionListItem = {
  kind: 'builtin',
  template: {
    key: 'ppf',
    titlePl: 'Pielęgnacja folii PPF',
    titleEn: 'PPF care',
    getContent: () => ({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Treść instrukcji.' }] }],
    }),
  },
};

const customRow: InstructionListItem = {
  kind: 'custom',
  row: {
    id: 'row-1',
    instance_id: 'inst-1',
    title: 'Custom Care',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Custom body.' }] }],
    },
    hardcoded_key: null,
    created_by: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
};

const previewInstance = {
  name: 'Demo Studio',
  logo_url: '',
  phone: '+48 123 456 789',
  email: 'demo@example.pl',
  address: 'ul. Demo 1',
  website: 'https://demo.example.pl',
  contact_person: 'Jan Demo',
};

beforeEach(() => {
  previewInstructionPdf.mockReset();
});

describe('InstructionPreviewDialog', () => {
  it('does not render any heading when item is null', () => {
    render(
      <InstructionPreviewDialog
        open
        onOpenChange={vi.fn()}
        item={null}
        instance={previewInstance}
      />,
    );
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('shows the builtin title and content for a builtin item', () => {
    render(
      <InstructionPreviewDialog
        open
        onOpenChange={vi.fn()}
        item={builtinPpf}
        instance={previewInstance}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pielęgnacja folii PPF');
    expect(screen.getByText('Treść instrukcji.')).toBeInTheDocument();
    expect(screen.getByText('Demo Studio')).toBeInTheDocument();
  });

  it('shows the custom row title and body for a custom item', () => {
    render(
      <InstructionPreviewDialog
        open
        onOpenChange={vi.fn()}
        item={customRow}
        instance={previewInstance}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Custom Care');
    expect(screen.getByText('Custom body.')).toBeInTheDocument();
  });

  it('triggers previewInstructionPdf instead of the public-token flow when Pobierz PDF is clicked', async () => {
    const user = userEvent.setup();
    previewInstructionPdf.mockResolvedValue(undefined);
    render(
      <InstructionPreviewDialog
        open
        onOpenChange={vi.fn()}
        item={customRow}
        instance={previewInstance}
      />,
    );

    await user.click(screen.getByText('Pobierz PDF'));

    await waitFor(() => {
      expect(previewInstructionPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Custom Care',
          content: expect.objectContaining({ type: 'doc' }),
          instance: expect.objectContaining({ name: 'Demo Studio' }),
        }),
      );
    });
  });

  it('calls onOpenChange(false) when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <InstructionPreviewDialog
        open
        onOpenChange={onOpenChange}
        item={builtinPpf}
        instance={previewInstance}
      />,
    );
    const closeButtons = screen.getAllByLabelText(/zamknij|close/i);
    await user.click(closeButtons[0]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
