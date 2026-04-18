import { CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@shared/ui';

interface IntegrationCardProps {
  logo: string;
  logoAlt: string;
  title: string;
  description: string;
  isActive?: boolean;
  activeLabel?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function IntegrationCard({
  logo,
  logoAlt,
  title,
  description,
  isActive,
  activeLabel,
  onClick,
  children,
  className,
}: IntegrationCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-border/50 rounded-xl p-5 flex flex-col gap-3 transition-all',
        onClick && 'cursor-pointer hover:border-border hover:shadow-sm',
        !onClick && 'cursor-default',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <img src={logo} alt={logoAlt} className="h-8 object-contain" />
        {isActive && activeLabel && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {activeLabel}
          </span>
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</div>
      </div>
      {children && <div className="mt-auto">{children}</div>}
      {onClick && !children && (
        <div className="flex justify-end">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
