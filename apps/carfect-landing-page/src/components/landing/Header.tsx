"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import HeaderNav from "./HeaderNav";
// import Image from "next/image";
// import logoCarfect from "@/assets/n2washcom-logo.svg";

const Header = () => {
  const { t } = useTranslation();
  const nav = t("nav");
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Determine if header should have solid background
  const hasSolidBackground = !isHomePage || isScrolled;

  const navItems = [
    {
      label: nav.crm,
      href: "/crm",
      children: [
        { label: nav.crmMyjnia, href: "/crm/crm-dla-myjni-samochodowych" },
        { label: nav.crmDetailing, href: "/crm/crm-dla-studia-detailingu" },
      ],
    },
    {
      label: nav.funkcje,
      href: "/funkcje",
      children: [
        { label: nav.kalendarzRezerwacji, href: "/funkcje/kalendarz-rezerwacji" },
        { label: nav.generatorOfert, href: "/funkcje/generator-ofert" },
        { label: nav.smsPrzypomnienia, href: "/funkcje/sms-przypomnienia" },
        { label: nav.zarzadzanieZespolem, href: "/funkcje/zarzadzanie-zespolem" },
        { label: nav.protokolPrzyjecia, href: "/funkcje/protokol-przyjecia-pojazdu" },
        { label: nav.analitykaRaporty, href: "/funkcje/analityka-raporty" },
      ],
    },
    { label: nav.cennik, href: "/cennik-crm-myjnia-detailing" },
    // { label: nav.opinie, href: "/opinie" }, // TODO: Dokończyć stronę opinii
    { label: "Historie Klientów", href: "/case-studies" },
    { label: nav.dlaczegoN2wash, href: "/dlaczego-carfect" },
    { label: nav.blog, href: "/blog" },
    { label: nav.kontakt, href: "/kontakt" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasSolidBackground
          ? isHomePage
            ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
            : "bg-primary shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="transition-all hover:opacity-80"
          >
            {/* TODO: Podmienić na nowe logo SVG */}
            {/* <Image
              src={logoCarfect}
              alt="Carfect.pl"
              className={`h-6 md:h-7 w-auto transition-all duration-300 ${
                hasSolidBackground && isHomePage ? "" : "brightness-0 invert"
              }`}
              priority
            /> */}
            <span className={`text-xl md:text-2xl font-bold tracking-tight transition-all duration-300 ${
              hasSolidBackground && isHomePage ? "text-foreground" : "text-white"
            }`}>
              CARFECT
            </span>
          </Link>

          {/* Desktop Navigation */}
          <HeaderNav items={navItems} isScrolled={hasSolidBackground && isHomePage} />

          {/* CTA Button - Desktop */}
          <Link
            href="/umow-prezentacje"
            className={`hidden md:inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              hasSolidBackground && isHomePage
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-white text-primary hover:bg-white/90"
            }`}
          >
            {nav.umowPrezentacje}
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`md:hidden ${!hasSolidBackground ? "text-white hover:text-white/80 hover:bg-white/10" : isHomePage ? "" : "text-white hover:text-white/80 hover:bg-white/10"}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md max-h-[70vh] overflow-y-auto">
            <HeaderNav
              items={navItems}
              isScrolled={true}
              onItemClick={closeMobileMenu}
              isMobile
            />
            <div className="px-4 pb-4">
              <Link
                href="/umow-prezentacje"
                onClick={closeMobileMenu}
                className="block w-full text-center px-5 py-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {nav.umowPrezentacje}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
