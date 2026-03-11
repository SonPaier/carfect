import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ value, onChange, min = 1, max = 20, step = 1, className }, ref) => {
    const handleDecrement = () => {
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    };

    const handleIncrement = () => {
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-3 rounded-xl border border-border bg-card p-1",
          className
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDecrement}
          disabled={value <= min}
          className="h-10 w-10 rounded-lg"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-[3rem] text-center text-xl font-semibold tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleIncrement}
          disabled={value >= max}
          className="h-10 w-10 rounded-lg"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);
Stepper.displayName = "Stepper";

export { Stepper };
