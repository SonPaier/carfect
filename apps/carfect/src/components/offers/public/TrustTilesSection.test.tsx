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
});
