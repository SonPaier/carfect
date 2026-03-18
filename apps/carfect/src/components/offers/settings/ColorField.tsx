import { useTranslation } from 'react-i18next';
import { Label } from '@shared/ui';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { AlertTriangle } from 'lucide-react';
import { hasGoodContrast, getContrastTextColor } from '@shared/utils';

interface ColorFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  contrastWith?: string;
  disabled?: boolean;
  showAutoContrast?: boolean;
}

export function ColorField({
  label,
  description,
  value,
  onChange,
  contrastWith,
  disabled,
  showAutoContrast
}: ColorFieldProps) {
  const { t } = useTranslation();
  const isGoodContrast = contrastWith ? hasGoodContrast(value, contrastWith) : true;

  const handleAutoContrast = () => {
    if (contrastWith) {
      onChange(getContrastTextColor(contrastWith));
    }
  };

  return (
    <div className="space-y-2">
      <Label className="font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-10 h-10 rounded-lg border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-28 font-mono text-sm uppercase"
          maxLength={7}
        />
        {showAutoContrast && contrastWith && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAutoContrast}
            disabled={disabled}
            className="text-xs"
          >
            {t('offerSettings.autoContrast')}
          </Button>
        )}
      </div>
      {!isGoodContrast && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {t('offerSettings.contrastWarning')}
        </p>
      )}
    </div>
  );
}
