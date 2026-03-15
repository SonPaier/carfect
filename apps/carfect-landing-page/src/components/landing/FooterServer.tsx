import { Mail, Phone, Globe } from 'lucide-react';
import Link from 'next/link';
import CarfectLogo from './CarfectLogo';
import type { SiteSettings } from '@/types/sanity';

interface FooterServerProps {
  settings?: SiteSettings;
}

export default function FooterServer({ settings }: FooterServerProps) {
  const contact = settings?.contact;
  const footer = settings?.footer;

  const email = contact?.email || footer?.email || 'hello@carfect.pl';
  const phone1 = contact?.phone1 || footer?.phone || '+48 690 028 436';
  const phone2 = contact?.phone2 || '';

  return (
    <footer id="contact" className="bg-black text-background py-12 md:py-16">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <CarfectLogo className="h-5 w-auto mb-4 text-white" />
            <p className="text-background/70 text-sm leading-relaxed max-w-xs">
              CRM i system rezerwacji dla myjni samochodowych i studiów detailingu.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-3 text-background/70 hover:text-background transition-colors text-sm">
                  <Mail className="w-4 h-4" />
                  {email}
                </a>
              </li>
              {phone1 && (
                <li>
                  <a href={`tel:${phone1.replace(/\s/g, '')}`} className="flex items-center gap-3 text-background/70 hover:text-background transition-colors text-sm">
                    <Phone className="w-4 h-4" />
                    {phone1}
                  </a>
                </li>
              )}
              {phone2 && (
                <li>
                  <a href={`tel:${phone2.replace(/\s/g, '')}`} className="flex items-center gap-3 text-background/70 hover:text-background transition-colors text-sm">
                    <Phone className="w-4 h-4" />
                    {phone2}
                  </a>
                </li>
              )}
              <li>
                <a href="https://carfect.pl" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-background/70 hover:text-background transition-colors text-sm">
                  <Globe className="w-4 h-4" />
                  carfect.pl
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Informacje</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/polityka-prywatnosci" className="text-background/70 hover:text-background transition-colors text-sm">
                  Polityka Prywatności
                </Link>
              </li>
              <li>
                <Link href="/regulamin" className="text-background/70 hover:text-background transition-colors text-sm">
                  Regulamin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10 text-center">
          <p className="text-background/50 text-sm">
            &copy; {new Date().getFullYear()} Carfect.pl. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </div>
    </footer>
  );
}
