import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Label } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n/config';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n/config';

interface LanguageSelectorProps {
  instanceId: string | null;
  currentLanguage: string;
  onLanguageChange: () => void;
}

const LanguageSelector = ({ instanceId, currentLanguage, onLanguageChange }: LanguageSelectorProps) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const handleChange = async (value: string) => {
    if (!instanceId || value === currentLanguage) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('instances')
        .update({ language: value })
        .eq('id', instanceId);

      if (error) throw error;

      i18n.changeLanguage(value as SupportedLanguage);
      onLanguageChange();
      toast.success(t('common.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <Label>{t('settings.language')}</Label>
      </div>
      <Select value={currentLanguage} onValueChange={handleChange} disabled={saving}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
