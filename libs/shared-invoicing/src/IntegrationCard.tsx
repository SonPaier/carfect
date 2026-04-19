import { CheckCircle2, ChevronRight, MoreVertical } from 'lucide-react';
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';

interface IntegrationCardMenuItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface IntegrationCardProps {
  logo: string;
  logoAlt: string;
  title: string;
  description: string;
  isActive?: boolean;
  activeLabel?: string;
  comingSoon?: boolean;
  comingSoonLabel?: string;
  menuItems?: IntegrationCardMenuItem[];
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
  comingSoon,
  comingSoonLabel,
  menuItems,
  onClick,
  children,
  className,
}: IntegrationCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-border/50 rounded-xl p-5 flex flex-col gap-3 transition-all',
        onClick && !comingSoon && 'cursor-pointer hover:border-border hover:shadow-sm',
        (!onClick || comingSoon) && 'cursor-default',
        className,
      )}
      onClick={comingSoon ? undefined : onClick}
      role={onClick && !comingSoon ? 'button' : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <img src={logo} alt={logoAlt} className="h-8 object-contain" />
        <div className="flex items-center gap-1">
          {comingSoon && comingSoonLabel && (
            <span className="text-xs text-foreground font-medium bg-gray-100 px-2 py-0.5 rounded-full">
              {comingSoonLabel}
            </span>
          )}
          {!comingSoon && isActive && activeLabel && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activeLabel}
            </span>
          )}
          {!comingSoon && isActive && menuItems && menuItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {menuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onClick();
                    }}
                    className={item.variant === 'destructive' ? 'text-destructive' : undefined}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
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
