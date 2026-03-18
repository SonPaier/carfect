import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { ColorField } from './ColorField';

function renderColorField(props: Partial<React.ComponentProps<typeof ColorField>> = {}) {
  const defaultProps = {
    label: 'Background color',
    value: '#ffffff',
    onChange: vi.fn(),
  };
  return render(
    <I18nextProvider i18n={i18n}>
      <ColorField {...defaultProps} {...props} />
    </I18nextProvider>
  );
}

describe('ColorField', () => {
  const user = userEvent.setup();

  it('renders label and color value', () => {
    renderColorField({ label: 'Kolor tła', value: '#f8fafc' });

    expect(screen.getByText('Kolor tła')).toBeInTheDocument();
    // Text input shows the hex value (color input also has it, so use role)
    expect(screen.getByRole('textbox')).toHaveValue('#f8fafc');
  });

  it('renders description when provided', () => {
    renderColorField({ description: 'Tło strony formularza' });

    expect(screen.getByText('Tło strony formularza')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    renderColorField();

    expect(screen.queryByText('Tło strony formularza')).not.toBeInTheDocument();
  });

  it('calls onChange when text input changes', async () => {
    const onChange = vi.fn();
    renderColorField({ onChange, value: '#ffffff' });

    const textInput = screen.getByRole('textbox');
    await user.clear(textInput);
    await user.type(textInput, '#000000');

    expect(onChange).toHaveBeenCalled();
  });

  it('disables inputs when disabled prop is true', () => {
    renderColorField({ disabled: true });

    const textInput = screen.getByRole('textbox');
    expect(textInput).toBeDisabled();
  });

  describe('contrast checking', () => {
    it('shows no warning when contrast is good (dark text on light bg)', () => {
      renderColorField({ value: '#1e293b', contrastWith: '#ffffff' });

      expect(screen.queryByText(/kontrast/i)).not.toBeInTheDocument();
    });

    it('shows warning when contrast is poor (light text on light bg)', () => {
      renderColorField({ value: '#e2e8f0', contrastWith: '#ffffff' });

      expect(screen.getByText(/kontrast/i)).toBeInTheDocument();
    });

    it('shows no warning when contrastWith is not provided', () => {
      renderColorField({ value: '#ffffff' });

      expect(screen.queryByText(/kontrast/i)).not.toBeInTheDocument();
    });
  });

  describe('auto contrast', () => {
    it('does not show auto contrast button when showAutoContrast is false', () => {
      renderColorField({ contrastWith: '#ffffff', showAutoContrast: false });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows auto contrast button when showAutoContrast and contrastWith are set', () => {
      renderColorField({ contrastWith: '#ffffff', showAutoContrast: true });

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('sets dark text color when background is light', async () => {
      const onChange = vi.fn();
      renderColorField({
        value: '#cccccc',
        contrastWith: '#ffffff',
        showAutoContrast: true,
        onChange,
      });

      await user.click(screen.getByRole('button'));

      // White bg -> dark text (#1e293b)
      expect(onChange).toHaveBeenCalledWith('#1e293b');
    });

    it('sets white text color when background is dark', async () => {
      const onChange = vi.fn();
      renderColorField({
        value: '#cccccc',
        contrastWith: '#1a1a1a',
        showAutoContrast: true,
        onChange,
      });

      await user.click(screen.getByRole('button'));

      // Dark bg -> white text
      expect(onChange).toHaveBeenCalledWith('#ffffff');
    });

    it('disables auto contrast button when field is disabled', () => {
      renderColorField({
        contrastWith: '#ffffff',
        showAutoContrast: true,
        disabled: true,
      });

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('edge cases', () => {
    it('handles empty string value', () => {
      renderColorField({ value: '' });

      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('respects maxLength of 7 characters on text input', () => {
      renderColorField();

      const textInput = screen.getByRole('textbox');
      expect(textInput).toHaveAttribute('maxLength', '7');
    });
  });
});
