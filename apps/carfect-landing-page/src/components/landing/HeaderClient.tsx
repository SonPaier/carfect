'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import HeaderNav from './HeaderNav';
import CarfectLogo from './CarfectLogo';
import type { SiteSettings } from '@/types/sanity';

interface HeaderClientProps {
  settings?: SiteSettings;
}

export default function HeaderClient({ settings }: HeaderClientProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const hasSolidBackground = !isHomePage || isScrolled;

  // Use nav from siteSettings if available, otherwise fallback
  const navItems = settings?.header?.navLinks?.map((link) => ({
    label: link.label || '',
    href: link.href || '#',
    children: link.children?.map((child) => ({
      label: child.label || '',
      href: child.href || '#',
    })),
  })) || [
    {
      label: 'CRM',
      href: '/crm',
      children: [
        { label: 'CRM dla myjni', href: '/crm/crm-dla-myjni-samochodowych' },
        { label: 'CRM dla detailingu', href: '/crm/crm-dla-studia-detailingu' },
      ],
    },
    {
      label: 'Funkcje',
      href: '/funkcje',
      children: [
        { label: 'Kalendarz rezerwacji', href: '/funkcje/kalendarz-rezerwacji' },
        { label: 'Generator ofert', href: '/funkcje/generator-ofert' },
        { label: 'SMS przypomnienia', href: '/funkcje/sms-przypomnienia' },
        { label: 'Zarządzanie zespołem', href: '/funkcje/zarzadzanie-zespolem' },
        { label: 'Protokół przyjęcia', href: '/funkcje/protokol-przyjecia-pojazdu' },
        { label: 'Analityka i raporty', href: '/funkcje/analityka-raporty' },
      ],
    },
    { label: 'Cennik', href: '/cennik-crm-myjnia-detailing' },
    { label: 'Historie Klientów', href: '/case-studies' },
    { label: 'Dlaczego Carfect?', href: '/dlaczego-carfect' },
    { label: 'Blog', href: '/blog' },
    { label: 'Kontakt', href: '/kontakt' },
  ];

  const ctaText = settings?.header?.ctaText || 'Umów prezentację';
  const ctaLink = settings?.header?.ctaLink || '/umow-prezentacje';

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasSolidBackground
          ? isHomePage
            ? 'bg-background/95 backdrop-blur-md shadow-sm border-b border-border'
            : 'bg-black shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="transition-all hover:opacity-80">
            <CarfectLogo className={`h-6 md:h-7 w-auto transition-all duration-300 ${hasSolidBackground && isHomePage ? 'text-foreground' : 'text-white'}`} />
          </Link>

          <HeaderNav items={navItems} isScrolled={hasSolidBackground && isHomePage} />

          <Link href={ctaLink} className="hidden md:inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-sm transition-colors bg-primary text-primary-foreground hover:bg-primary/90">
            {ctaText}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className={`md:hidden ${!hasSolidBackground ? 'text-white hover:text-white/80 hover:bg-white/10' : isHomePage ? '' : 'text-white hover:text-white/80 hover:bg-white/10'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md max-h-[70vh] overflow-y-auto">
            <HeaderNav items={navItems} isScrolled={true} onItemClick={closeMobileMenu} isMobile />
            <div className="px-4 pb-4">
              <Link href={ctaLink} onClick={closeMobileMenu} className="block w-full text-center px-5 py-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                {ctaText}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
