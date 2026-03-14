import { X } from 'lucide-react';

interface Instance {
  id: string;
  name: string;
  logo_url: string | null;
  phone?: string | null;
  email?: string | null;
}

interface ProtocolHeaderProps {
  instance: Instance | null;
  protocolNumber?: string;
  onClose?: () => void;
}

export const ProtocolHeader = ({ instance, protocolNumber, onClose }: ProtocolHeaderProps) => {
  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="w-full max-w-3xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Company name - both mobile and desktop */}
          <div className="flex items-center gap-3">
            {instance?.logo_url ? (
              <img 
                src={instance.logo_url} 
                alt={instance.name} 
                className="h-10 sm:h-12 object-contain" 
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-base sm:text-lg">
                  {instance?.name?.charAt(0) || 'P'}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-base sm:text-lg">{instance?.name || 'Protokół'}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {protocolNumber 
                  ? `Protokół #${protocolNumber}` 
                  : 'Protokół przyjęcia pojazdu'}
              </p>
            </div>
          </div>

          {/* Right side: Contact info (desktop) + Close button */}
          <div className="flex items-center gap-4">
            {/* Contact info hidden on public view for privacy */}

            {/* Close button */}
            {onClose && (
              <button 
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-hover transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
