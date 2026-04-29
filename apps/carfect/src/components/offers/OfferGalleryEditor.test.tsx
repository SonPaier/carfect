import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { OfferGalleryEditor } from './OfferGalleryEditor';

// Picker pulls from the network; a stub keeps us focused on editor wiring.
vi.mock('./OfferGalleryPicker', () => ({
  OfferGalleryPicker: ({
    open,
    onConfirm,
  }: {
    open: boolean;
    onConfirm: (photos: { id: string; url: string }[]) => void;
  }) =>
    open ? (
      <div data-testid="picker">
        <button
          type="button"
          onClick={() => onConfirm([{ id: 'newA', url: 'https://cdn/newA.jpg' }])}
        >
          confirm-from-picker
        </button>
      </div>
    ) : null,
}));

const photos = [
  { id: 'a', url: 'https://cdn/a.jpg' },
  { id: 'b', url: 'https://cdn/b.jpg' },
  { id: 'c', url: 'https://cdn/c.jpg' },
];

const renderEditor = (
  overrides: Partial<{
    photos: typeof photos;
    onChange: (photos: typeof photos) => void;
  }> = {},
) => {
  const onChange = overrides.onChange ?? vi.fn();
  const utils = render(
    <I18nextProvider i18n={i18n}>
      <OfferGalleryEditor
        instanceId="instance-1"
        photos={overrides.photos ?? photos}
        onChange={onChange}
      />
    </I18nextProvider>,
  );
  return { ...utils, onChange };
};

describe('OfferGalleryEditor', () => {
  it('shows empty state when no photos selected', () => {
    renderEditor({ photos: [] });
    expect(screen.getByText(/Brak wybranych zdjęć/i)).toBeInTheDocument();
  });

  it('renders one tile per selected photo', () => {
    const { container } = renderEditor();
    expect(container.querySelectorAll('img')).toHaveLength(3);
  });

  it('removes a photo when delete is clicked', () => {
    const onChange = vi.fn();
    renderEditor({ onChange });
    const removeButtons = screen.getAllByLabelText(/Usuń z oferty/i);
    fireEvent.click(removeButtons[1]);
    expect(onChange).toHaveBeenCalledWith([
      { id: 'a', url: 'https://cdn/a.jpg' },
      { id: 'c', url: 'https://cdn/c.jpg' },
    ]);
  });

  it('reorders photos with the move-right button', () => {
    const onChange = vi.fn();
    renderEditor({ onChange });
    const moveRight = screen.getAllByLabelText(/Przesuń w prawo/i);
    fireEvent.click(moveRight[0]);
    expect(onChange).toHaveBeenCalledWith([
      { id: 'b', url: 'https://cdn/b.jpg' },
      { id: 'a', url: 'https://cdn/a.jpg' },
      { id: 'c', url: 'https://cdn/c.jpg' },
    ]);
  });

  it('disables move-left on the first tile and move-right on the last', () => {
    renderEditor();
    const left = screen.getAllByLabelText(/Przesuń w lewo/i);
    const right = screen.getAllByLabelText(/Przesuń w prawo/i);
    expect(left[0]).toBeDisabled();
    expect(right[right.length - 1]).toBeDisabled();
  });

  it('opens the picker and applies the returned selection', () => {
    const onChange = vi.fn();
    renderEditor({ onChange });
    fireEvent.click(screen.getByText(/Wybierz z portfolio/i));
    const picker = screen.getByTestId('picker');
    fireEvent.click(within(picker).getByText('confirm-from-picker'));
    expect(onChange).toHaveBeenCalledWith([{ id: 'newA', url: 'https://cdn/newA.jpg' }]);
  });
});
