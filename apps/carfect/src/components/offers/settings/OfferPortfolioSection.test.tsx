import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { OfferPortfolioSection } from './OfferPortfolioSection';

const removePhotoMock = vi.fn();
let mockState: {
  photos: Array<{ id: string; url: string; sort_order: number; created_at: string }>;
  loading: boolean;
} = { photos: [], loading: false };

vi.mock('../usePortfolioPhotos', () => ({
  usePortfolioPhotos: () => ({
    photos: mockState.photos,
    loading: mockState.loading,
    uploadProgress: null,
    uploadFiles: vi.fn(),
    removePhoto: removePhotoMock,
    reload: vi.fn(),
  }),
}));

const renderSection = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <OfferPortfolioSection instanceId="instance-1" />
    </I18nextProvider>,
  );

describe('OfferPortfolioSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { photos: [], loading: false };
  });

  it('shows the empty state when there are no photos', () => {
    renderSection();
    expect(screen.getByText(/Brak zdjęć w portfolio/i)).toBeInTheDocument();
  });

  it('renders the loading state instead of the empty state', () => {
    mockState = { photos: [], loading: true };
    renderSection();
    expect(screen.queryByText(/Brak zdjęć w portfolio/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Ładowanie/i)).toBeInTheDocument();
  });

  it('renders one tile with delete button per photo', () => {
    mockState = {
      loading: false,
      photos: [
        { id: 'p1', url: 'https://cdn/p1.jpg', sort_order: 0, created_at: 'x' },
        { id: 'p2', url: 'https://cdn/p2.jpg', sort_order: 1, created_at: 'x' },
      ],
    };
    const { container } = renderSection();
    expect(container.querySelectorAll('img')).toHaveLength(2);
    expect(screen.getAllByLabelText(/Usuń zdjęcie/i)).toHaveLength(2);
  });

  it('shows the cascade-aware confirm dialog before deleting', async () => {
    mockState = {
      loading: false,
      photos: [{ id: 'p1', url: 'https://cdn/p1.jpg', sort_order: 0, created_at: 'x' }],
    };
    renderSection();

    fireEvent.click(screen.getByLabelText(/Usuń zdjęcie/i));

    // Dialog explains the destructive cascade + permanence to the admin.
    expect(await screen.findByText(/trwale/i)).toBeInTheDocument();
    expect(screen.getByText(/ze wszystkich ofert/i)).toBeInTheDocument();
    expect(screen.getByText(/nie można cofnąć/i)).toBeInTheDocument();
    expect(removePhotoMock).not.toHaveBeenCalled();

    // Confirm in the dialog
    const confirm = screen.getAllByRole('button').find((b) => b.textContent === 'Usuń');
    fireEvent.click(confirm!);

    await waitFor(() => expect(removePhotoMock).toHaveBeenCalledWith('p1'));
  });

  it('cancels deletion without calling removePhoto', () => {
    mockState = {
      loading: false,
      photos: [{ id: 'p1', url: 'https://cdn/p1.jpg', sort_order: 0, created_at: 'x' }],
    };
    renderSection();

    fireEvent.click(screen.getByLabelText(/Usuń zdjęcie/i));
    fireEvent.click(screen.getByText('Anuluj'));

    expect(removePhotoMock).not.toHaveBeenCalled();
  });
});
