import * as React from 'react';
import { Input } from './input';
import { cn } from '../lib/utils';

interface NumericInputProps extends Omit<
  React.ComponentProps<'input'>,
  'value' | 'onChange' | 'type'
> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

/** Normalize decimal separator: replace comma with dot */
function normalizeDecimal(str: string): string {
  return str.replace(',', '.');
}

/** Allow only digits, one decimal separator (dot or comma), and leading minus */
function isValidNumericInput(str: string): boolean {
  return /^-?\d*[.,]?\d*$/.test(str);
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onChange, onBlur, className, min, max, ...props }, ref) => {
    const [raw, setRaw] = React.useState<string>(() => (value != null ? String(value) : ''));

    const prevValueRef = React.useRef(value);
    React.useEffect(() => {
      if (prevValueRef.current !== value) {
        prevValueRef.current = value;
        setRaw(value != null ? String(value) : '');
      }
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        className={cn(className)}
        value={raw}
        onChange={(e) => {
          const str = e.target.value;

          // Allow empty
          if (str === '') {
            setRaw('');
            onChange(undefined);
            return;
          }

          // Block non-numeric characters (except dot, comma, minus)
          if (!isValidNumericInput(str)) return;

          setRaw(str);

          const normalized = normalizeDecimal(str);
          const parsed = parseFloat(normalized);
          if (!isNaN(parsed)) {
            // Enforce min/max if provided
            const minVal = min != null ? Number(min) : undefined;
            const maxVal = max != null ? Number(max) : undefined;
            if (minVal != null && parsed < minVal) return;
            if (maxVal != null && parsed > maxVal) return;
            onChange(parsed);
          }
        }}
        onBlur={(e) => {
          // On blur, normalize display: replace comma with dot, trim trailing dot
          if (raw !== '') {
            const normalized = normalizeDecimal(raw);
            const parsed = parseFloat(normalized);
            if (!isNaN(parsed)) {
              setRaw(String(parsed));
              onChange(parsed);
            } else {
              setRaw('');
              onChange(undefined);
            }
          }
          onBlur?.(e);
        }}
      />
    );
  },
);
NumericInput.displayName = 'NumericInput';

export { NumericInput };
