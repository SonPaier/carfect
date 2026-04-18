import { CheckCircle2 } from 'lucide-react';
import { cn } from '@shared/ui';

interface IntegrationCardProps {
  logo: string;
  logoAlt: string;
  title: string;
  description: string;
  isConnected: boolean;
  connectedLabel: string;
  configureLabel: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function IntegrationCard({
  logo,
  logoAlt,
  title,
  description,
  isConnected,
  connectedLabel,
  configureLabel,
  onClick,
  children,
  className,
}: IntegrationCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-border/50 rounded-lg p-5 flex flex-col gap-3 cursor-pointer hover:border-border transition-colors',
        !onClick && 'cursor-default hover:border-border/50',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <img src={logo} alt={logoAlt} className="h-8 object-contain" />
        {isConnected && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {connectedLabel}
          </span>
        )}
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      </div>
      {!isConnected && !children && (
        <div className="text-xs text-muted-foreground">{configureLabel}</div>
      )}
      {children && <div className="mt-auto">{children}</div>}
    </div>
  );
}
