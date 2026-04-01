import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isValidVin, CustomerVehiclesEditor, type VehicleChip } from './CustomerVehiclesEditor';

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('@/components/ui/car-search-autocomplete', () => ({
  CarSearchAutocomplete: () => <input data-testid="car-search" />,
}));

const makeVehicle = (overrides: Partial<VehicleChip> = {}): VehicleChip => ({
  id: 'v-1',
  model: 'BMW X5',
  carSize: 'M',
  ...overrides,
});

describe('isValidVin', () => {
  it('accepts empty string (VIN is optional)', () => {
    expect(isValidVin('')).toBe(true);
  });

  it('accepts valid 17-char VIN', () => {
    expect(isValidVin('WBAPH5C55BA123456')).toBe(true);
  });

  it('accepts lowercase (case insensitive)', () => {
    expect(isValidVin('wbaph5c55ba123456')).toBe(true);
  });

  it('rejects VIN shorter than 17 chars', () => {
    expect(isValidVin('WBAPH5C55BA1234')).toBe(false);
  });

  it('rejects VIN longer than 17 chars', () => {
    expect(isValidVin('WBAPH5C55BA12345678')).toBe(false);
  });

  it('rejects VIN containing I', () => {
    expect(isValidVin('WBAIH5C55BA123456')).toBe(false);
  });

  it('rejects VIN containing O', () => {
    expect(isValidVin('WBAOH5C55BA123456')).toBe(false);
  });

  it('rejects VIN containing Q', () => {
    expect(isValidVin('WBAQH5C55BA123456')).toBe(false);
  });

  it('rejects VIN with spaces', () => {
    expect(isValidVin('WBAPH 5C55BA12345')).toBe(false);
  });
});

describe('CustomerVehiclesEditor — VIN mode', () => {
  it('renders chips (no VIN input) when showVin is false', () => {
    render(
      <CustomerVehiclesEditor
        vehicles={[makeVehicle()]}
        onChange={vi.fn()}
        showVin={false}
      />,
    );

    expect(screen.getByText('BMW X5')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/WBAPH/)).not.toBeInTheDocument();
  });

  it('renders cards with VIN input when showVin is true', () => {
    render(
      <CustomerVehiclesEditor
        vehicles={[makeVehicle()]}
        onChange={vi.fn()}
        showVin={true}
        onVinChange={vi.fn()}
      />,
    );

    expect(screen.getByText('BMW X5')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/WBAPH/)).toBeInTheDocument();
    expect(screen.getByText('VIN')).toBeInTheDocument();
  });

  it('shows existing VIN value in input', () => {
    render(
      <CustomerVehiclesEditor
        vehicles={[makeVehicle({ vin: 'WBAPH5C55BA123456' })]}
        onChange={vi.fn()}
        showVin={true}
        onVinChange={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('WBAPH5C55BA123456')).toBeInTheDocument();
  });

  it('calls onVinChange with uppercased value on input', async () => {
    const user = userEvent.setup();
    const onVinChange = vi.fn();

    render(
      <CustomerVehiclesEditor
        vehicles={[makeVehicle({ vin: '' })]}
        onChange={vi.fn()}
        showVin={true}
        onVinChange={onVinChange}
      />,
    );

    const input = screen.getByPlaceholderText(/WBAPH/);
    await user.type(input, 'abc');

    // Each keystroke fires onVinChange with uppercase
    expect(onVinChange).toHaveBeenCalledWith(0, 'A');
    expect(onVinChange).toHaveBeenCalledWith(0, 'B');
    expect(onVinChange).toHaveBeenCalledWith(0, 'C');
  });

  it('shows validation error for invalid VIN', () => {
    render(
      <CustomerVehiclesEditor
        vehicles={[makeVehicle({ vin: 'TOOSHORT' })]}
        onChange={vi.fn()}
        showVin={true}
        onVinChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/VIN musi mieć 17 znaków/)).toBeInTheDocument();
  });

  it('does not show validation error for valid VIN', () => {
    render(
      <CustomerVehiclesEditor
        vehicles={[makeVehicle({ vin: 'WBAPH5C55BA123456' })]}
        onChange={vi.fn()}
        showVin={true}
        onVinChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(/VIN musi mieć 17 znaków/)).not.toBeInTheDocument();
  });

  it('does not show validation error for empty VIN', () => {
    render(
      <CustomerVehiclesEditor
        vehicles={[makeVehicle({ vin: '' })]}
        onChange={vi.fn()}
        showVin={true}
        onVinChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(/VIN musi mieć 17 znaków/)).not.toBeInTheDocument();
  });

  it('renders multiple vehicle cards with separate VIN inputs', () => {
    render(
      <CustomerVehiclesEditor
        vehicles={[
          makeVehicle({ id: 'v-1', model: 'BMW X5', vin: 'WBAPH5C55BA123456' }),
          makeVehicle({ id: 'v-2', model: 'Audi A4', vin: '' }),
        ]}
        onChange={vi.fn()}
        showVin={true}
        onVinChange={vi.fn()}
      />,
    );

    expect(screen.getByText('BMW X5')).toBeInTheDocument();
    expect(screen.getByText('Audi A4')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/WBAPH/)).toHaveLength(2);
  });
});
