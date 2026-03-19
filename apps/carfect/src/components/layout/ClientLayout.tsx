import { ReactNode, forwardRef, useEffect, useState } from 'react';
import { Car, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
interface Instance {
  id: string;
  name: string;
  phone: string | null;
  logo_url: string | null;
}
interface ClientLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
}
const ClientLayout = forwardRef<HTMLDivElement, ClientLayoutProps>(
  ({ children, hideHeader = false, hideFooter = false }, ref) => {
    const [instance, setInstance] = useState<Instance | null>(null);
    useEffect(() => {
      const fetchInstance = async () => {
        // Get subdomain from hostname
        const hostname = window.location.hostname;
        let slug = 'demo'; // default fallback

        if (hostname.endsWith('.carfect.pl')) {
          slug = hostname.replace('.carfect.pl', '');
        }
        const { data } = await supabase
          .from('instances')
          .select('id, name, phone, logo_url')
          .eq('slug', slug)
          .single();
        if (data) {
          setInstance(data);
        }
      };
      fetchInstance();
    }, []);
    return (
      <div ref={ref} className="min-h-screen flex flex-col bg-background overflow-x-hidden">
        {/* Header */}
        {!hideHeader && (
          <header className="bg-background">
            <div className="container py-4">
              <div className="flex items-center justify-center pt-[16px]">
                {instance?.logo_url ? (
                  <img
                    src={instance.logo_url}
                    alt={instance.name}
                    className="max-h-20 w-auto rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                    <Car className="w-12 h-12 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-x-hidden">{children}</main>

        {/* Footer */}
        {!hideFooter && (
          <footer className="border-t border-border/50 bg-muted/30 shrink-0 mt-auto">
            <div className="container py-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-muted-foreground">
                {/* Brand & company info */}
                <div className="flex flex-col gap-2">
                  <a
                    href="https://carfect.pl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity inline-flex items-center gap-2"
                  >
                    <img src="/carfect-logo.svg" alt="Carfect" className="h-5" />
                  </a>
                  <p>System rezerwacji online</p>
                  <p className="text-xs">VAT EU: PL 585 147 45 97</p>
                </div>

                {/* Navigation links */}
                <div className="flex flex-col gap-2">
                  <span className="text-foreground font-medium text-xs uppercase tracking-wider">
                    Nawigacja
                  </span>
                  <a href="/" className="hover:text-foreground transition-colors w-fit">
                    Rezerwacja
                  </a>
                  <a href="/res" className="hover:text-foreground transition-colors w-fit">
                    Moja rezerwacja
                  </a>
                  <a
                    href="https://carfect.pl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors w-fit"
                  >
                    O Carfect
                  </a>
                </div>

                {/* Contact */}
                <div className="flex flex-col gap-2">
                  <span className="text-foreground font-medium text-xs uppercase tracking-wider">
                    Kontakt
                  </span>
                  {instance?.phone && (
                    <a
                      href={`tel:${instance.phone}`}
                      className="hover:text-foreground transition-colors inline-flex items-center gap-1.5 w-fit"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {instance.phone}
                    </a>
                  )}
                  <a
                    href="mailto:kontakt@carfect.pl"
                    className="hover:text-foreground transition-colors inline-flex items-center gap-1.5 w-fit"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    kontakt@carfect.pl
                  </a>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-6 pt-4 border-t border-border/50 text-xs text-muted-foreground text-center">
                © {new Date().getFullYear()} Carfect. Wszelkie prawa zastrzeżone.
              </div>
            </div>
          </footer>
        )}
      </div>
    );
  },
);
ClientLayout.displayName = 'ClientLayout';
export default ClientLayout;
