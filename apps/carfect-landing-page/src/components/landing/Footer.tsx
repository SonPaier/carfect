'use client';

import { Mail, Phone, Globe } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import CarfectLogo from './CarfectLogo';

const Footer = () => {
  const { t } = useTranslation();
  const footer = t('footer');

  return (
    <footer id="contact" className="bg-black text-background py-12 md:py-16 relative overflow-hidden">
      {/* Geometric pattern — organic scattered shapes fading from right */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1400 400"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="footerFade" x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="45%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id="footerMask">
            <rect width="100%" height="100%" fill="url(#footerFade)" />
          </mask>
        </defs>
        <g mask="url(#footerMask)" fill="none">
          {/* Long diagonal lines — varying angles and lengths */}
          <line x1="620" y1="-20" x2="920" y2="420" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" />
          <line x1="780" y1="-40" x2="1050" y2="380" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" />
          <line x1="1000" y1="-10" x2="1300" y2="350" stroke="rgba(255,255,255,0.17)" strokeWidth="0.7" />
          <line x1="1150" y1="0" x2="1400" y2="280" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <line x1="850" y1="50" x2="1200" y2="400" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          {/* Cross lines */}
          <line x1="700" y1="320" x2="1100" y2="60" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          <line x1="950" y1="380" x2="1350" y2="30" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
          {/* Scattered triangles — different sizes */}
          <polygon points="880,55 920,110 840,110" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
          <polygon points="1120,180 1175,250 1065,250" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
          <polygon points="1260,40 1290,85 1230,85" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" />
          <polygon points="750,240 785,290 715,290" stroke="rgba(255,255,255,0.14)" strokeWidth="0.3" />
          {/* Hexagon fragments */}
          <path d="M1050,80 L1080,60 L1110,80 L1110,115 L1080,135 L1050,115Z" stroke="rgba(255,255,255,0.16)" strokeWidth="0.5" />
          <path d="M1300,200 L1325,185 L1350,200 L1350,230 L1325,245 L1300,230Z" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" />
          {/* Dots — accent */}
          <circle cx="920" cy="160" r="2" fill="rgba(255,255,255,0.2)" />
          <circle cx="1180" cy="90" r="1.5" fill="rgba(255,255,255,0.17)" />
          <circle cx="1050" cy="300" r="2.5" fill="rgba(255,255,255,0.15)" />
          <circle cx="780" cy="140" r="1" fill="rgba(255,255,255,0.2)" />
          <circle cx="1320" cy="310" r="1.5" fill="rgba(255,255,255,0.16)" />
        </g>
      </svg>
      <div className="container px-4 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <CarfectLogo className="h-5 w-auto mb-4 text-white" />
            <p className="text-background/70 text-sm leading-relaxed max-w-xs mb-5">
              CRM i system rezerwacji dla myjni samochodowych i studiów detailingu.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/carfect.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/carfect.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
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
                  href="tel:+48666610222"
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
