import { useState, useEffect } from 'react';
import { Label } from '@shared/ui';
import { Switch } from '@shared/ui';
import { Button } from '@shared/ui';
import { Loader2, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEFAULT_WIDGET_BRANDING, WidgetBranding } from '@shared/utils';
import { ColorField } from './ColorField';

interface WidgetBrandingSettingsProps {
  instanceId: string;
  initialData?: {
    widget_branding_enabled: boolean;
    widget_bg_color: string | null;
    widget_section_bg_color: string | null;
    widget_section_text_color: string | null;
    widget_primary_color: string | null;
  } | null;
  onChange?: (branding?: { enabled: boolean; bgColor: string; sectionBgColor: string; sectionTextColor: string; primaryColor: string }) => void;
}

export function WidgetBrandingSettings({ instanceId, initialData, onChange }: WidgetBrandingSettingsProps) {
    const [saving, setSaving] = useState(false);
    const [branding, setBranding] = useState<WidgetBranding>({
      widget_branding_enabled: false,
      ...DEFAULT_WIDGET_BRANDING,
    });

    // Initialize from parent-provided data to avoid duplicate fetch
    useEffect(() => {
      if (initialData) {
        setBranding({
          widget_branding_enabled: initialData.widget_branding_enabled ?? false,
          widget_bg_color: initialData.widget_bg_color ?? DEFAULT_WIDGET_BRANDING.widget_bg_color,
          widget_section_bg_color: initialData.widget_section_bg_color ?? DEFAULT_WIDGET_BRANDING.widget_section_bg_color,
          widget_section_text_color: initialData.widget_section_text_color ?? DEFAULT_WIDGET_BRANDING.widget_section_text_color,
          widget_primary_color: initialData.widget_primary_color ?? DEFAULT_WIDGET_BRANDING.widget_primary_color,
        });
      }
    }, [initialData]);

    const notifyChange = (updated: WidgetBranding) => {
      onChange?.({
        enabled: updated.widget_branding_enabled,
        bgColor: updated.widget_bg_color,
        sectionBgColor: updated.widget_section_bg_color,
        sectionTextColor: updated.widget_section_text_color,
        primaryColor: updated.widget_primary_color,
      });
    };

    const updateBranding = (key: keyof WidgetBranding, value: string | boolean) => {
      setBranding((prev) => {
        const updated = { ...prev, [key]: value };
        notifyChange(updated);
        return updated;
      });
    };

    const resetToDefaults = () => {
      const updated = {
        widget_branding_enabled: branding.widget_branding_enabled,
        ...DEFAULT_WIDGET_BRANDING,
      };
      setBranding(updated);
      notifyChange(updated);
    };

    const saveAll = async (): Promise<boolean> => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('instances')
          .update({
            widget_branding_enabled: branding.widget_branding_enabled,
            widget_bg_color: branding.widget_bg_color,
            widget_section_bg_color: branding.widget_section_bg_color,
            widget_section_text_color: branding.widget_section_text_color,
            widget_primary_color: branding.widget_primary_color,
          })
          .eq('id', instanceId);

        if (error) throw error;
        toast.success('Wygląd widgetu zapisany');
        return true;
      } catch (error) {
        console.error('Error saving widget branding:', error);
        toast.error('Nie udało się zapisać wyglądu widgetu');
        return false;
      } finally {
        setSaving(false);
      }
    };

    const colorsDisabled = !branding.widget_branding_enabled || saving;

    return (
      <div className="space-y-4">
        {/* Enable branding switch */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="enable-widget-branding" className="font-medium text-sm">
              Własne kolory widgetu
            </Label>
            <p className="text-xs text-muted-foreground">
              {branding.widget_branding_enabled
                ? 'Widżet używa własnych kolorów'
                : 'Widżet używa kolorów z ustawień oferty'}
            </p>
          </div>
          <Switch
            id="enable-widget-branding"
            checked={branding.widget_branding_enabled}
            onCheckedChange={(checked) => updateBranding('widget_branding_enabled', checked)}
            disabled={saving}
          />
        </div>

        {/* Color settings */}
        <div className="space-y-4">
          <ColorField
            label="Kolor tła"
            description="Tło strony formularza"
            value={branding.widget_bg_color}
            onChange={(v) => updateBranding('widget_bg_color', v)}
            disabled={colorsDisabled}
          />

          <div className="space-y-3 p-3 rounded-lg border bg-muted/10">
            <h4 className="font-medium text-xs">Sekcje formularza</h4>
            <ColorField
              label="Kolor sekcji"
              value={branding.widget_section_bg_color}
              onChange={(v) => updateBranding('widget_section_bg_color', v)}
              disabled={colorsDisabled}
            />
            <ColorField
              label="Kolor tekstu sekcji"
              value={branding.widget_section_text_color}
              onChange={(v) => updateBranding('widget_section_text_color', v)}
              contrastWith={branding.widget_section_bg_color}
              showAutoContrast
              disabled={colorsDisabled}
            />
          </div>

          <ColorField
            label="Kolor akcentu"
            description="Przyciski, zaznaczenia i linki"
            value={branding.widget_primary_color}
            onChange={(v) => updateBranding('widget_primary_color', v)}
            disabled={colorsDisabled}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              disabled={colorsDisabled}
              className="gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Resetuj
            </Button>
            <Button
              size="sm"
              onClick={saveAll}
              disabled={saving}
              className="gap-1"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Zapisz wygląd
            </Button>
          </div>
        </div>
      </div>
    );
}
