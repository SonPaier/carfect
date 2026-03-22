'use client';

import { Mail, Phone, Globe } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import CarfectLogo from './CarfectLogo';

const Footer = () => {
  const { t } = useTranslation();
  const footer = t('footer');

  return (
    <footer id="contact" className="bg-black text-background py-12 md:py-16">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <CarfectLogo className="h-5 w-auto mb-4 text-white" />
            <p className="text-background/70 text-sm leading-relaxed max-w-xs">
              CRM i system rezerwacji dla myjni samochodowych i studiów detailingu.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">{footer.contact}</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${footer.email}`}
                  className="flex items-center gap-3 text-background/70 hover:text-background transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  {footer.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${footer.phone1.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 text-background/70 hover:text-background transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  {footer.phone1} (Tomek)
                </a>
              </li>
              <li>
                <a
                  href={`tel:${footer.phone2.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 text-background/70 hover:text-background transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  {footer.phone2} (Rafał)
                </a>
              </li>
              <li>
                <a
                  href={`https://${footer.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-background/70 hover:text-background transition-colors text-sm"
                >
                  <Globe className="w-4 h-4" />
                  {footer.website}
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Nawigacja</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/funkcje"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Funkcje
                </Link>
              </li>
              <li>
                <Link
                  href="/cennik-crm-myjnia-detailing"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Cennik
                </Link>
              </li>
              <li>
                <Link
                  href="/opinie"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Opinie
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/dlaczego-carfect"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Dlaczego Carfect?
                </Link>
              </li>
              <li>
                <Link
                  href="/umow-prezentacje"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Umów prezentację
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Informacje</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/polityka-prywatnosci"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  {footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href="/regulamin"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  {footer.terms}
                </Link>
              </li>
              <li className="pt-2 text-background/50 text-xs">VAT EU: PL 585 147 45 97</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-background/10 text-center">
          <p className="text-background/50 text-sm">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
