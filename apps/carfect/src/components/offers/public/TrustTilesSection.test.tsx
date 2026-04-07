import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrustTilesSection } from './TrustTilesSection';

const branding = {
  offer_primary_color: '#3b82f6',
  offer_bg_color: '#ffffff',
  offer_header_bg_color: '#1e293b',
  offer_header_text_color: '#ffffff',
  offer_section_bg_color: '#f8fafc',
  offer_section_text_color: '#1e293b',
};

describe('TrustTilesSection', () => {
  it('renders nothing when tiles array is empty', () => {
    const { container } = render(<TrustTilesSection tiles={[]} branding={branding} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders tiles with title and description', () => {
    render(
      <TrustTilesSection
        tiles={[
          { icon: 'star', title: 'Doświadczenie', description: '10 lat' },
          { icon: 'shield', title: 'Gwarancja', description: '2 lata' },
        ]}
        title="Dlaczego my?"
        description="Zaufaj profesjonalistom"
        branding={branding}
      />,
    );

    expect(screen.getByText('Dlaczego my?')).toBeInTheDocument();
    expect(screen.getByText('Zaufaj profesjonalistom')).toBeInTheDocument();
    expect(screen.getByText('Doświadczenie')).toBeInTheDocument();
    expect(screen.getByText('10 lat')).toBeInTheDocument();
    expect(screen.getByText('Gwarancja')).toBeInTheDocument();
    expect(screen.getByText('2 lata')).toBeInTheDocument();
  });

  it('renders tiles without title/description', () => {
    render(
      <TrustTilesSection
        tiles={[{ icon: 'heart', title: 'Pasja', description: 'Kochamy auta' }]}
        branding={branding}
      />,
    );

    expect(screen.getByText('Pasja')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('falls back to Star icon for unknown icon strings', () => {
    const { container } = render(
      <TrustTilesSection
        tiles={[{ icon: 'unknown-icon', title: 'Test', description: 'desc' }]}
        branding={branding}
      />,
    );

    // Should render without errors (Star fallback)
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('tiles container has flex-wrap and justify-center classes for centering', () => {
    const { container } = render(
      <TrustTilesSection
        tiles={[
          { icon: 'star', title: 'Tile 1', description: 'desc 1' },
          { icon: 'shield', title: 'Tile 2', description: 'desc 2' },
        ]}
        branding={branding}
      />,
    );

    // The tiles wrapper div must have flex-wrap and justify-center for proper centering
    const tilesContainer = container.querySelector('.flex.flex-wrap.justify-center');
    expect(tilesContainer).toBeInTheDocument();
  });

  it('renders all known icon types without errors', () => {
    const iconTypes = [
      'star',
      'shield',
      'sparkles',
      'award',
      'heart',
      'car',
      'clock',
      'check',
      'zap',
      'trophy',
      'thumbsup',
      'eye',
    ];
    const tiles = iconTypes.map((icon) => ({ icon, title: `Icon ${icon}`, description: 'desc' }));

    const { container } = render(<TrustTilesSection tiles={tiles} branding={branding} />);

    // All tiles should render — one svg per tile
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(iconTypes.length);
  });
});
