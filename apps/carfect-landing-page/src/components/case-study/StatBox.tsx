import { cn } from "@/lib/utils";
interface StatBoxProps {
  value: string;
  label: string;
  sublabel?: string;
  variant?: "primary" | "success" | "warning" | "neutral";
  size?: "sm" | "md" | "lg";
  className?: string;
}
const StatBox = ({
  value,
  label,
  sublabel,
  variant = "primary",
  size = "md",
  className
}: StatBoxProps) => {
  const variantStyles = {
    primary: "border-primary/30 bg-gradient-to-br from-primary/5 to-sky-500/5",
    success: "border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5",
    warning: "border-red-500/30 bg-gradient-to-br from-red-500/5 to-orange-500/5",
    neutral: "border-border bg-card"
  };
  const valueStyles = {
    primary: "text-primary",
    success: "text-green-600",
    warning: "text-red-600",
    neutral: "text-foreground"
  };
  const sizeStyles = {
    sm: {
      value: "text-2xl md:text-3xl",
      label: "text-xs",
      padding: "p-4"
    },
    md: {
      value: "text-3xl md:text-4xl",
      label: "text-sm",
      padding: "p-5"
    },
    lg: {
      value: "text-4xl md:text-5xl",
      label: "text-base",
      padding: "p-6 md:p-8"
    }
  };
  return <div className={cn("rounded-2xl border text-center", variantStyles[variant], sizeStyles[size].padding, className)}>
      <p className={cn("font-bold", sizeStyles[size].value, valueStyles[variant])}>
        {value}
      </p>
      <p className={cn("mt-1 text-lg text-secondary-foreground", sizeStyles[size].label)}>
        {label}
      </p>
      {sublabel && <p className={cn("mt-0.5 text-lg text-secondary-foreground", sizeStyles[size].label)}>
          {sublabel}
        </p>}
    </div>;
};
export default StatBox;