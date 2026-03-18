import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PackageCard from './PackageCard';
import type { OrderPackage } from '../hooks/useOrderPackages';

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('../rolls/MultiRollAssignment', () => ({ default: () => null }));

vi.mock('../hooks/useApaczkaValuation', () => ({
  useApaczkaValuation: () => ({ price: null, loading: false, error: null }),
}));

const basePackage: OrderPackage = {
  id: 'pkg-1',
  shippingMethod: 'shipping',
  packagingType: 'karton',
  dimensions: { length: 0, width: 0, height: 0 },
  courier: undefined,
  weight: 1,
  contents: '',
  declaredValue: 0,
  oversized: false,
  productKeys: [],
};

const defaultProps = {
  pkg: basePackage,
  index: 0,
  packageProducts: [],
  instanceId: 'inst-1',
  onRemove: vi.fn(),
  onShippingMethodChange: vi.fn(),
  onPackagingTypeChange: vi.fn(),
  onDimensionChange: vi.fn(),
  onCourierChange: vi.fn(),
  onWeightChange: vi.fn(),
  onContentsChange: vi.fn(),
  onDeclaredValueChange: vi.fn(),
  onOversizedChange: vi.fn(),
  onAddProduct: vi.fn(),
  onRemoveProduct: vi.fn(),
  onUpdateQuantity: vi.fn(),
  onUpdateVehicle: vi.fn(),
};

describe('PackageCard', () => {
  describe('courier select', () => {
    it('renders configured couriers when availableCouriers is provided', () => {
      const availableCouriers = [
        { name: 'DPD', serviceId: 1 },
        { name: 'GLS', serviceId: 2 },
        { name: 'Fedex', serviceId: 3 },
      ];

      render(<PackageCard {...defaultProps} availableCouriers={availableCouriers} />);

      // SelectTrigger shows placeholder when no courier selected
      expect(screen.getByText('Wybierz kuriera')).toBeInTheDocument();
    });

    it('shows available courier options from availableCouriers prop', async () => {
      const user = userEvent.setup();
      const availableCouriers = [
        { name: 'DPD', serviceId: 1 },
        { name: 'GLS', serviceId: 2 },
      ];

      render(<PackageCard {...defaultProps} availableCouriers={availableCouriers} />);

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByRole('option', { name: 'DPD' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'GLS' })).toBeInTheDocument();
    });

    it('falls back to hardcoded DPD/DHL/InPost/Pocztex when availableCouriers is empty', async () => {
      const user = userEvent.setup();

      render(<PackageCard {...defaultProps} availableCouriers={[]} />);

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByRole('option', { name: 'DPD' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'DHL' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'InPost' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pocztex' })).toBeInTheDocument();
    });

    it('falls back to hardcoded couriers when availableCouriers prop is omitted', async () => {
      const user = userEvent.setup();

      render(<PackageCard {...defaultProps} />);

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByRole('option', { name: 'DPD' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'DHL' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'InPost' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pocztex' })).toBeInTheDocument();
    });

    it('shows placeholder "Wybierz kuriera" when no courier is selected', () => {
      render(<PackageCard {...defaultProps} pkg={{ ...basePackage, courier: undefined }} />);

      expect(screen.getByText('Wybierz kuriera')).toBeInTheDocument();
    });

    it('calls onCourierChange when a courier is selected', async () => {
      const user = userEvent.setup();
      const onCourierChange = vi.fn();

      render(<PackageCard {...defaultProps} onCourierChange={onCourierChange} />);

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'DHL' }));

      expect(onCourierChange).toHaveBeenCalledWith('dhl');
    });

    it('calls onCourierChange with lowercased courier name for custom couriers', async () => {
      const user = userEvent.setup();
      const onCourierChange = vi.fn();
      const availableCouriers = [{ name: 'GLS', serviceId: 5 }];

      render(
        <PackageCard
          {...defaultProps}
          availableCouriers={availableCouriers}
          onCourierChange={onCourierChange}
        />,
      );

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'GLS' }));

      expect(onCourierChange).toHaveBeenCalledWith('gls');
    });
  });

  describe('packaging type options', () => {
    it('renders Karton, Tuba and Koperta radio options', () => {
      render(<PackageCard {...defaultProps} />);

      expect(screen.getByLabelText('Karton')).toBeInTheDocument();
      expect(screen.getByLabelText('Tuba')).toBeInTheDocument();
      expect(screen.getByLabelText('Koperta')).toBeInTheDocument();
    });

    it('calls onPackagingTypeChange when packaging type is changed', async () => {
      const user = userEvent.setup();
      const onPackagingTypeChange = vi.fn();

      render(<PackageCard {...defaultProps} onPackagingTypeChange={onPackagingTypeChange} />);

      await user.click(screen.getByLabelText('Tuba'));

      expect(onPackagingTypeChange).toHaveBeenCalledWith('tuba');
    });
  });

  describe('dimension inputs based on packaging type', () => {
    it('shows length, width, height and weight inputs for karton', () => {
      render(<PackageCard {...defaultProps} pkg={{ ...basePackage, packagingType: 'karton' }} />);

      expect(screen.getByText('Dł. (cm)')).toBeInTheDocument();
      expect(screen.getByText('Szer. (cm)')).toBeInTheDocument();
      expect(screen.getByText('Wys. (cm)')).toBeInTheDocument();
      expect(screen.getByText('Waga (kg)')).toBeInTheDocument();
    });

    it('shows length, diameter and weight inputs for tuba', () => {
      render(
        <PackageCard
          {...defaultProps}
          pkg={{ ...basePackage, packagingType: 'tuba', dimensions: { length: 0, diameter: 0 } }}
        />,
      );

      expect(screen.getByText('Długość (cm)')).toBeInTheDocument();
      expect(screen.getByText('Średnica (cm)')).toBeInTheDocument();
      expect(screen.getByText('Waga (kg)')).toBeInTheDocument();
    });

    it('shows only weight input for koperta', () => {
      render(
        <PackageCard
          {...defaultProps}
          pkg={{ ...basePackage, packagingType: 'koperta', dimensions: undefined }}
        />,
      );

      expect(screen.getByText('Waga (kg)')).toBeInTheDocument();
      expect(screen.queryByText('Dł. (cm)')).not.toBeInTheDocument();
      expect(screen.queryByText('Szer. (cm)')).not.toBeInTheDocument();
      expect(screen.queryByText('Długość (cm)')).not.toBeInTheDocument();
    });
  });

  describe('shipping/pickup/uber toggle', () => {
    it('renders Wysylka, Odbior osobisty and Uber toggle options', () => {
      render(<PackageCard {...defaultProps} />);

      expect(screen.getByText('Wysyłka')).toBeInTheDocument();
      expect(screen.getByText('Odbiór osobisty')).toBeInTheDocument();
      expect(screen.getByText('Uber')).toBeInTheDocument();
    });

    it('calls onShippingMethodChange when toggle changes', async () => {
      const user = userEvent.setup();
      const onShippingMethodChange = vi.fn();

      render(<PackageCard {...defaultProps} onShippingMethodChange={onShippingMethodChange} />);

      await user.click(screen.getByText('Odbiór osobisty'));

      expect(onShippingMethodChange).toHaveBeenCalledWith('pickup');
    });

    it('hides packaging and courier fields when shippingMethod is not shipping', () => {
      render(
        <PackageCard
          {...defaultProps}
          pkg={{ ...basePackage, shippingMethod: 'pickup', packagingType: undefined }}
        />,
      );

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Karton')).not.toBeInTheDocument();
    });
  });
});
