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

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onChange, onBlur, className, ...props }, ref) => {
    const [raw, setRaw] = React.useState<string>(() =>
      value != null && value !== 0 ? String(value) : '',
    );

    const prevValueRef = React.useRef(value);
    React.useEffect(() => {
      if (prevValueRef.current !== value) {
        prevValueRef.current = value;
        setRaw(value != null && value !== 0 ? String(value) : '');
      }
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        type="number"
        className={cn(className)}
        value={raw}
        onChange={(e) => {
          const str = e.target.value;
          setRaw(str);
          if (str === '') {
            onChange(undefined);
          } else {
            const parsed = parseFloat(str);
            if (!isNaN(parsed)) onChange(parsed);
          }
        }}
        onBlur={(e) => {
          if (raw !== '' && isNaN(parseFloat(raw))) setRaw('');
          onBlur?.(e);
        }}
      />
    );
  },
);
NumericInput.displayName = 'NumericInput';

export { NumericInput };
