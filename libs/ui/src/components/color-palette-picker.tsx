import * as React from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '../lib/utils';

const DEFAULT_COLORS = [
  '#E2EFFF',
  '#E5D5F1',
  '#FEE0D6',
  '#FEF1D6',
  '#D8EBE4',
  '#FFE0E6',
  '#E0F0FF',
  '#F0E0FF',
];

interface ColorPalettePickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  colors?: string[];
  /** Size of each swatch in px (default 32) */
  size?: number;
  className?: string;
}

const ColorPalettePicker = ({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  size = 32,
  className,
}: ColorPalettePickerProps) => {
  return (
    <div className={cn('flex flex-wrap gap-2 items-center', className)}>
      {/* No color option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'rounded-md border-2 flex items-center justify-center transition-all',
          value === null
            ? 'border-foreground ring-2 ring-foreground/20'
            : 'border-border hover:border-foreground/50',
        )}
        style={{ width: size, height: size }}
        title="Brak koloru"
      >
        <X className={cn('text-muted-foreground', value === null ? 'w-3.5 h-3.5' : 'w-3 h-3 opacity-40')} />
      </button>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'rounded-md border-2 flex items-center justify-center transition-all',
            value === color
              ? 'border-foreground ring-2 ring-foreground/20'
              : 'border-border hover:border-foreground/50',
          )}
          style={{ backgroundColor: color, width: size, height: size }}
          title={color}
        >
          {value === color && <Check className="w-4 h-4 text-slate-700" />}
        </button>
      ))}
    </div>
  );
};
ColorPalettePicker.displayName = 'ColorPalettePicker';

export { ColorPalettePicker, DEFAULT_COLORS };
export type { ColorPalettePickerProps };
