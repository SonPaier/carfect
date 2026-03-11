import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PageLoaderProps {
  className?: string;
  label?: string;
}

export const PageLoader = ({ className, label }: PageLoaderProps) => {
  return (
    <div className={cn('min-h-[200px] flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
};
