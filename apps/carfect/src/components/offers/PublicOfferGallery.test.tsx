import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { PublicOfferGallery } from './PublicOfferGallery';

// PhotoFullscreenDialog renders an actual Radix Dialog that listens to
// keyboard / focus, which is overkill for these tests. Replace it with a
// minimal observable stub.
vi.mock('@/components/protocols/PhotoFullscreenDialog', () => ({
  PhotoFullscreenDialog: ({ open, photoUrl }: { open: boolean; photoUrl: string | null }) =>
    open ? <div data-testid="fullscreen" data-url={photoUrl ?? ''} /> : null,
}));

const branding = {
  offer_section_bg_color: '#fff',
  offer_section_text_color: '#000',
};

const renderGallery = (photos: { id: string; url: string; sort_order?: number }[]) =>
  render(
    <I18nextProvider i18n={i18n}>
      <PublicOfferGallery photos={photos} branding={branding} />
    </I18nextProvider>,
  );

describe('PublicOfferGallery', () => {
  it('renders nothing when there are no photos', () => {
    const { container } = renderGallery([]);
    expect(container.firstChild).toBeNull();
  });

  it('shows the section header and a tile per photo when photos are provided', () => {
    renderGallery([
      { id: '1', url: 'https://cdn/a.jpg', sort_order: 0 },
      { id: '2', url: 'https://cdn/b.jpg', sort_order: 1 },
    ]);
    expect(screen.getByText(/Nasze wybrane realizacje/i)).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('orders photos by sort_order regardless of array order', () => {
    renderGallery([
      { id: 'b', url: 'https://cdn/b.jpg', sort_order: 1 },
      { id: 'a', url: 'https://cdn/a.jpg', sort_order: 0 },
    ]);
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'https://cdn/a.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://cdn/b.jpg');
  });

  it('opens fullscreen with the clicked photo', () => {
    renderGallery([
      { id: 'a', url: 'https://cdn/a.jpg', sort_order: 0 },
      { id: 'b', url: 'https://cdn/b.jpg', sort_order: 1 },
    ]);
    fireEvent.click(screen.getAllByRole('button')[1]);
    const fs = screen.getByTestId('fullscreen');
    expect(fs).toHaveAttribute('data-url', 'https://cdn/b.jpg');
  });
});
