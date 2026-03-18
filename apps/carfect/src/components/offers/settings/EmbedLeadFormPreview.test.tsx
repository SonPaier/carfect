import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmbedLeadFormPreview from './EmbedLeadFormPreview';

const mockTemplates = [
  {
    id: 'tpl-1',
    name: 'PPF Full Front',
    short_name: 'PPF FF',
    description: 'Full front protection',
    price_from: 3000,
    available_durations: [24, 60],
  },
  {
    id: 'tpl-2',
    name: 'Ceramic Coating',
    short_name: null,
    description: null,
    price_from: null,
  },
];

const mockExtras = [
  { id: 'ext-1', name: 'Felgi' },
  { id: 'ext-2', name: 'Wnętrze' },
];

function renderPreview(
  props: Partial<React.ComponentProps<typeof EmbedLeadFormPreview>> = {}
) {
  const defaultProps = {
    templates: mockTemplates,
    extras: mockExtras,
  };
  return render(<EmbedLeadFormPreview {...defaultProps} {...props} />);
}

describe('EmbedLeadFormPreview', () => {
  describe('templates rendering', () => {
    it('renders all template names', () => {
      renderPreview();

      expect(screen.getByText('PPF Full Front')).toBeInTheDocument();
      expect(screen.getByText('Ceramic Coating')).toBeInTheDocument();
    });

    it('renders price when available', () => {
      renderPreview();

      expect(screen.getByText('od 3000 zł')).toBeInTheDocument();
    });

    it('does not render price when price_from is null', () => {
      renderPreview({ templates: [mockTemplates[1]] });

      expect(screen.queryByText(/od.*zł/)).not.toBeInTheDocument();
    });

    it('shows placeholder when no templates provided', () => {
      renderPreview({ templates: [] });

      expect(screen.getByText('Wybierz szablony w konfiguracji')).toBeInTheDocument();
    });
  });

  describe('extras rendering', () => {
    it('renders extras section when extras provided', () => {
      renderPreview();

      expect(screen.getByText('Felgi')).toBeInTheDocument();
      expect(screen.getByText('Wnętrze')).toBeInTheDocument();
    });

    it('does not render extras section when no extras', () => {
      renderPreview({ extras: [] });

      expect(screen.queryByText('Dodatki')).not.toBeInTheDocument();
    });
  });

  describe('branding colors', () => {
    it('applies custom background color', () => {
      const { container } = renderPreview({
        branding: {
          bgColor: '#1a1a2e',
          sectionBgColor: '#ffffff',
          sectionTextColor: '#1e293b',
          primaryColor: '#e94560',
        },
      });

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.backgroundColor).toBe('rgb(26, 26, 46)');
    });

    it('applies custom section colors', () => {
      renderPreview({
        branding: {
          bgColor: '#f8fafc',
          sectionBgColor: '#1a1a2e',
          sectionTextColor: '#ffffff',
          primaryColor: '#e94560',
        },
      });

      // Section headings should exist with custom colors applied via style
      const customerSection = screen.getByText('Dane kontaktowe').closest('div[class*="rounded-lg"]');
      expect(customerSection).toHaveStyle({
        backgroundColor: 'rgb(26, 26, 46)',
        color: 'rgb(255, 255, 255)',
      });
    });

    it('uses default colors when no branding provided', () => {
      const { container } = renderPreview();

      const wrapper = container.firstChild as HTMLElement;
      // Default bg: #f8fafc
      expect(wrapper.style.backgroundColor).toBe('rgb(248, 250, 252)');
    });
  });

  describe('edge cases', () => {
    it('renders with empty templates and extras', () => {
      renderPreview({ templates: [], extras: [] });

      expect(screen.getByText('Wybierz szablony w konfiguracji')).toBeInTheDocument();
      expect(screen.queryByText('Dodatki')).not.toBeInTheDocument();
    });

    it('renders template without description (no "Czytaj więcej" button)', () => {
      renderPreview({ templates: [mockTemplates[1]] });

      expect(screen.queryByText('Czytaj więcej...')).not.toBeInTheDocument();
    });

    it('renders template with description (shows "Czytaj więcej" button)', () => {
      renderPreview({ templates: [mockTemplates[0]] });

      expect(screen.getByText('Czytaj więcej...')).toBeInTheDocument();
    });

    it('renders template without available_durations', () => {
      renderPreview({
        templates: [{
          id: 'tpl-no-dur',
          name: 'No Durations',
          short_name: null,
          description: null,
          price_from: 500,
        }],
      });

      expect(screen.getByText('No Durations')).toBeInTheDocument();
    });
  });
});
