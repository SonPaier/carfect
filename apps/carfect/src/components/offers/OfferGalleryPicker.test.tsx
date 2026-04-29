import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { OfferGalleryPicker } from './OfferGalleryPicker';
import type { OfferGalleryPhoto } from '@/hooks/useOfferTypes';

// Stub the hook so the picker exercises its own logic without going to network.
const uploadFilesMock = vi.fn();
vi.mock('./usePortfolioPhotos', () => ({
  usePortfolioPhotos: () => ({
    photos: [
      { id: 'p1', url: 'https://cdn/p1.jpg', sort_order: 0, created_at: 'x' },
      { id: 'p2', url: 'https://cdn/p2.jpg', sort_order: 1, created_at: 'x' },
      { id: 'p3', url: 'https://cdn/p3.jpg', sort_order: 2, created_at: 'x' },
    ],
    loading: false,
    uploadProgress: null,
    uploadFiles: uploadFilesMock,
    removePhoto: vi.fn(),
    reload: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { toast } from 'sonner';
import { MAX_GALLERY_PHOTOS } from '@/hooks/useOfferTypes';

const renderPicker = (
  overrides: {
    open?: boolean;
    initialSelection?: OfferGalleryPhoto[];
    onConfirm?: (sel: OfferGalleryPhoto[]) => void;
    onClose?: () => void;
  } = {},
) => {
  const onConfirm = overrides.onConfirm ?? vi.fn();
  const onClose = overrides.onClose ?? vi.fn();
  const utils = render(
    <I18nextProvider i18n={i18n}>
      <OfferGalleryPicker
        open={overrides.open ?? true}
        onClose={onClose}
        instanceId="instance-1"
        initialSelection={overrides.initialSelection ?? []}
        onConfirm={onConfirm}
      />
    </I18nextProvider>,
  );
  return { ...utils, onConfirm, onClose };
};

const getDialog = () => {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) throw new Error('picker dialog not in document');
  return dialog as HTMLElement;
};

describe('OfferGalleryPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadFilesMock.mockReset();
  });

  it('renders all portfolio photos as selectable tiles', () => {
    renderPicker();
    const tiles = getDialog().querySelectorAll('button.aspect-\\[4\\/3\\]');
    expect(tiles).toHaveLength(3);
  });

  it('marks photos from initialSelection as selected with order badges', () => {
    renderPicker({
      initialSelection: [
        { id: 'p2', url: 'https://cdn/p2.jpg' },
        { id: 'p3', url: 'https://cdn/p3.jpg' },
      ],
    });
    expect(screen.getByText('Wybrane: 2 z 16')).toBeInTheDocument();
  });

  it('toggles a photo and increments / decrements the apply count', () => {
    renderPicker();
    const tiles = getDialog().querySelectorAll('button.aspect-\\[4\\/3\\]');
    fireEvent.click(tiles[0]);
    expect(screen.getByText('Zastosuj (1)')).toBeInTheDocument();
    fireEvent.click(tiles[0]);
    expect(screen.getByText('Zastosuj (0)')).toBeInTheDocument();
  });

  it('starts in grid mode by default and ignores any prior localStorage value', () => {
    window.localStorage.setItem('offer-gallery-picker-view', 'full');
    renderPicker();
    const grid = getDialog().querySelector('button[aria-label="Siatka"]') as HTMLElement;
    expect(grid.getAttribute('aria-pressed')).toBe('true');
  });

  it('switches to full-width mode when the toggle is clicked', () => {
    renderPicker();
    const fullBtn = getDialog().querySelector(
      'button[aria-label="Pełna szerokość"]',
    ) as HTMLElement;
    fireEvent.click(fullBtn);
    expect(fullBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('blocks selection over the 16-photo limit and shows an error toast', () => {
    const initial = Array.from({ length: MAX_GALLERY_PHOTOS }, (_, i) => ({
      id: `existing-${i}`,
      url: `https://cdn/existing-${i}.jpg`,
    }));
    renderPicker({ initialSelection: initial });

    // Clicking any of the visible portfolio tiles (not yet in the selection)
    // should be rejected with a toast and leave the count unchanged.
    const tiles = getDialog().querySelectorAll('button.aspect-\\[4\\/3\\]');
    fireEvent.click(tiles[0]);

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(String(MAX_GALLERY_PHOTOS)));
    expect(screen.getByText(`Zastosuj (${MAX_GALLERY_PHOTOS})`)).toBeInTheDocument();
  });

  it('confirms selection in click order and closes the drawer', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderPicker({ onConfirm, onClose });

    const tiles = getDialog().querySelectorAll('button.aspect-\\[4\\/3\\]');
    fireEvent.click(tiles[2]); // p3 first
    fireEvent.click(tiles[0]); // p1 second

    fireEvent.click(screen.getByText(/^Zastosuj/));

    expect(onConfirm).toHaveBeenCalledWith([
      { id: 'p3', url: 'https://cdn/p3.jpg' },
      { id: 'p1', url: 'https://cdn/p1.jpg' },
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it('auto-selects newly uploaded photos and respects the 16 cap', async () => {
    uploadFilesMock.mockResolvedValueOnce([
      { id: 'new-1', url: 'https://cdn/new-1.jpg', sort_order: 0, created_at: 'x' },
      { id: 'new-2', url: 'https://cdn/new-2.jpg', sort_order: 1, created_at: 'x' },
    ]);
    renderPicker();

    const fileInput = getDialog().querySelector('input[type="file"]') as HTMLInputElement;
    const fakeFile = new File([new Uint8Array(10)], 'a.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(screen.getByText('Zastosuj (2)')).toBeInTheDocument();
    });
  });
});
