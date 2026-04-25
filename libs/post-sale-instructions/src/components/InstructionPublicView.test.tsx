import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstructionPublicView } from './InstructionPublicView';
import type { PublicInstructionData } from '../hooks/usePublicInstruction';

const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => toastError(...args), success: vi.fn() },
}));

const openInstructionPdfMock = vi.fn();
vi.mock('../pdfClient', () => ({
  openInstructionPdf: (...args: unknown[]) => openInstructionPdfMock(...args),
}));

const baseData: PublicInstructionData = {
  title: 'PPF Care Guide',
  content: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Keep clean.' }] },
    ],
  },
  instance: {
    name: 'Armcar',
    logo_url: 'https://example.com/logo.png',
    phone: '+48 123 456 789',
    email: 'contact@armcar.pl',
    address: 'ul. Test 1',
    website: 'https://armcar.pl',
    contact_person: 'Jan Kowalski',
  },
};

beforeEach(() => {
  toastError.mockClear();
  openInstructionPdfMock.mockReset();
});

describe('InstructionPublicView', () => {
  it('renders the title', () => {
    render(<InstructionPublicView data={baseData} publicToken="tok-1" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PPF Care Guide');
  });

  it('renders the instance name in the header', () => {
    render(<InstructionPublicView data={baseData} publicToken="tok-1" />);
    expect(screen.getByText('Armcar')).toBeInTheDocument();
  });

  it('renders the logo when logo_url is provided', () => {
    render(<InstructionPublicView data={baseData} publicToken="tok-1" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('omits the logo when logo_url is missing', () => {
    const data: PublicInstructionData = {
      ...baseData,
      instance: { ...baseData.instance, logo_url: undefined },
    };
    render(<InstructionPublicView data={data} publicToken="tok-1" />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('calls openInstructionPdf with the public token when download is clicked', async () => {
    const user = userEvent.setup();
    openInstructionPdfMock.mockResolvedValue(undefined);
    render(<InstructionPublicView data={baseData} publicToken="tok-abc" />);

    await user.click(screen.getByText('publicInstruction.downloadPdf'));
    await waitFor(() => {
      expect(openInstructionPdfMock).toHaveBeenCalledWith('tok-abc');
    });
  });

  it('disables the button while the download is in flight', async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    openInstructionPdfMock.mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );
    render(<InstructionPublicView data={baseData} publicToken="tok-1" />);

    const button = screen.getByText('publicInstruction.downloadPdf').closest('button');
    expect(button).toBeDefined();
    await user.click(button!);
    expect(button).toBeDisabled();

    resolve();
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('shows an error toast when openInstructionPdf throws', async () => {
    const user = userEvent.setup();
    openInstructionPdfMock.mockRejectedValue(new Error('boom'));
    render(<InstructionPublicView data={baseData} publicToken="tok-1" />);

    await user.click(screen.getByText('publicInstruction.downloadPdf'));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('publicInstruction.loadError');
    });
  });
});
