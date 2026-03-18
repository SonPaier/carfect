import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { WidgetBrandingSettings } from './WidgetBrandingSettings';
import { resetSupabaseMocks, mockSupabaseQuery } from '@/test/mocks/supabase';
import { DEFAULT_WIDGET_BRANDING } from '@shared/utils';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const INSTANCE_ID = 'test-instance-id';

const defaultInitialData = {
  widget_branding_enabled: false,
  widget_bg_color: null,
  widget_section_bg_color: null,
  widget_section_text_color: null,
  widget_primary_color: null,
};

function renderSettings(
  props: Partial<React.ComponentProps<typeof WidgetBrandingSettings>> = {}
) {
  const defaultProps = {
    instanceId: INSTANCE_ID,
    initialData: defaultInitialData,
    onChange: vi.fn(),
  };
  return render(
    <I18nextProvider i18n={i18n}>
      <WidgetBrandingSettings {...defaultProps} {...props} />
    </I18nextProvider>
  );
}

describe('WidgetBrandingSettings', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('renders with branding disabled by default', () => {
      renderSettings();

      expect(screen.getByText('Własne kolory widgetu')).toBeInTheDocument();
      expect(screen.getByText('Widżet używa kolorów z ustawień oferty')).toBeInTheDocument();
    });

    it('renders with branding enabled when initialData says so', () => {
      renderSettings({
        initialData: { ...defaultInitialData, widget_branding_enabled: true },
      });

      expect(screen.getByText('Widżet używa własnych kolorów')).toBeInTheDocument();
    });

    it('uses default colors when initialData has null values', () => {
      renderSettings({
        initialData: { ...defaultInitialData, widget_branding_enabled: true },
      });

      // Each ColorField has a color input + text input with same value, use getAllByDisplayValue
      const bgInputs = screen.getAllByDisplayValue(DEFAULT_WIDGET_BRANDING.widget_bg_color);
      expect(bgInputs.length).toBeGreaterThanOrEqual(1);
      const primaryInputs = screen.getAllByDisplayValue(DEFAULT_WIDGET_BRANDING.widget_primary_color);
      expect(primaryInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('uses custom colors from initialData when provided', () => {
      renderSettings({
        initialData: {
          widget_branding_enabled: true,
          widget_bg_color: '#111111',
          widget_section_bg_color: '#222222',
          widget_section_text_color: '#333333',
          widget_primary_color: '#444444',
        },
      });

      // Each color appears in both a color input and text input
      expect(screen.getAllByDisplayValue('#111111').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByDisplayValue('#222222').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByDisplayValue('#333333').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByDisplayValue('#444444').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('toggle branding', () => {
    it('calls onChange with enabled=true when toggling on', async () => {
      const onChange = vi.fn();
      renderSettings({ onChange });

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
      );
    });

    it('calls onChange with enabled=false when toggling off', async () => {
      const onChange = vi.fn();
      renderSettings({
        onChange,
        initialData: { ...defaultInitialData, widget_branding_enabled: true },
      });

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      );
    });

    it('shows status text matching toggle state', async () => {
      renderSettings();

      expect(screen.getByText('Widżet używa kolorów z ustawień oferty')).toBeInTheDocument();

      await user.click(screen.getByRole('switch'));

      expect(screen.getByText('Widżet używa własnych kolorów')).toBeInTheDocument();
    });
  });

  describe('reset to defaults', () => {
    it('resets all colors to defaults while keeping enabled state', async () => {
      const onChange = vi.fn();
      renderSettings({
        onChange,
        initialData: {
          widget_branding_enabled: true,
          widget_bg_color: '#111111',
          widget_section_bg_color: '#222222',
          widget_section_text_color: '#333333',
          widget_primary_color: '#444444',
        },
      });

      await user.click(screen.getByRole('button', { name: /resetuj/i }));

      expect(screen.getAllByDisplayValue(DEFAULT_WIDGET_BRANDING.widget_bg_color).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByDisplayValue(DEFAULT_WIDGET_BRANDING.widget_primary_color).length).toBeGreaterThanOrEqual(1);

      // onChange should be called with defaults but enabled=true
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          bgColor: DEFAULT_WIDGET_BRANDING.widget_bg_color,
          primaryColor: DEFAULT_WIDGET_BRANDING.widget_primary_color,
        })
      );
    });
  });

  describe('save', () => {
    it('saves branding to database via supabase update', async () => {
      const { mockSupabase } = await import('@/test/mocks/supabase');
      mockSupabaseQuery('instances', { data: null, error: null }, 'update');

      renderSettings({
        initialData: {
          widget_branding_enabled: true,
          widget_bg_color: '#aabbcc',
          widget_section_bg_color: null,
          widget_section_text_color: null,
          widget_primary_color: null,
        },
      });

      await user.click(screen.getByRole('button', { name: /zapisz wygląd/i }));

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('instances');
      });
    });

    it('shows success toast on successful save', async () => {
      const { toast } = await import('sonner');
      mockSupabaseQuery('instances', { data: null, error: null }, 'update');

      renderSettings({
        initialData: { ...defaultInitialData, widget_branding_enabled: true },
      });

      await user.click(screen.getByRole('button', { name: /zapisz wygląd/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Wygląd widgetu zapisany');
      });
    });

    it('shows error toast on save failure', async () => {
      const { toast } = await import('sonner');
      mockSupabaseQuery('instances', { data: null, error: { message: 'DB error' } }, 'update');

      renderSettings({
        initialData: { ...defaultInitialData, widget_branding_enabled: true },
      });

      await user.click(screen.getByRole('button', { name: /zapisz wygląd/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Nie udało się zapisać wyglądu widgetu');
      });
    });
  });

  describe('edge cases', () => {
    it('renders without initialData (null)', () => {
      renderSettings({ initialData: null });

      expect(screen.getByText('Własne kolory widgetu')).toBeInTheDocument();
      // Should use defaults
      expect(screen.getAllByDisplayValue(DEFAULT_WIDGET_BRANDING.widget_bg_color).length).toBeGreaterThanOrEqual(1);
    });

    it('renders without initialData (undefined)', () => {
      renderSettings({ initialData: undefined });

      expect(screen.getByText('Własne kolory widgetu')).toBeInTheDocument();
    });

    it('does not call onChange when onChange prop is not provided', async () => {
      // Should not throw
      renderSettings({ onChange: undefined });

      await user.click(screen.getByRole('switch'));
      // No error means it handled missing onChange gracefully
    });

    it('disables color fields when branding is disabled', () => {
      renderSettings();

      const textInputs = screen.getAllByRole('textbox');
      textInputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });

    it('enables color fields when branding is enabled', () => {
      renderSettings({
        initialData: { ...defaultInitialData, widget_branding_enabled: true },
      });

      const textInputs = screen.getAllByRole('textbox');
      textInputs.forEach((input) => {
        expect(input).not.toBeDisabled();
      });
    });

    it('disables reset button when branding is disabled', () => {
      renderSettings();

      expect(screen.getByRole('button', { name: /resetuj/i })).toBeDisabled();
    });
  });
});
