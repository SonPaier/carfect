import { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Button } from '@shared/ui';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface PasswordConfirmInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  match: boolean;
  placeholder?: string;
  alwaysVisible?: boolean;
}

const PasswordConfirmInput = ({
  id = 'confirmPassword',
  label,
  value,
  onChange,
  match,
  placeholder,
  alwaysVisible,
}: PasswordConfirmInputProps) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(alwaysVisible ?? false);

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label ?? t('password.confirmLabel')}</Label>}
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? t('password.confirmPlaceholder')}
          autoComplete="new-password"
          className={alwaysVisible ? '' : 'pr-10'}
        />
        {!alwaysVisible && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setVisible(!visible)}
            tabIndex={-1}
          >
            {visible ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>

      {value.length > 0 && (
        <p
          className={cn(
            'text-xs flex items-center gap-1.5',
            match ? 'text-green-600' : 'text-destructive',
          )}
        >
          {match ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
          {match ? t('password.match') : t('password.noMatch')}
        </p>
      )}
    </div>
  );
};

export default PasswordConfirmInput;
