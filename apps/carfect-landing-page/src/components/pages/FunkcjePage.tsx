"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import SubpageHero from "@/components/landing/SubpageHero";

const CalendarIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="12" width="48" height="42" rx="4" stroke="currentColor" strokeWidth="2" />
    <path d="M8 24h48" stroke="currentColor" strokeWidth="2" />
    <path d="M20 6v12M44 6v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="16" y="30" width="10" height="8" rx="2" fill="currentColor" opacity="0.15" />
    <rect x="16" y="42" width="10" height="8" rx="2" fill="currentColor" opacity="0.15" />
    <rect x="30" y="30" width="10" height="8" rx="2" fill="currentColor" opacity="0.25" />
    <rect x="44" y="30" width="10" height="8" rx="2" fill="currentColor" opacity="0.1" />
  </svg>
);

const BookingIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2" />
    <path d="M32 16v18l12 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="32" cy="32" r="3" fill="currentColor" opacity="0.3" />
    <path d="M18 8l-6-4M46 8l6-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const OfferIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="6" width="32" height="44" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M18 18h16M18 26h10M18 34h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="46" cy="44" r="14" stroke="currentColor" strokeWidth="2" />
    <path d="M40 44l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProtocolIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="36" height="46" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M14 22h20M14 30h14M14 38h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="34" y="6" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="46" cy="16" r="5" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <path d="M14 46h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 44c2-2 4-2 6 0s4 2 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SmsIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="8" width="36" height="48" rx="5" stroke="currentColor" strokeWidth="2" />
    <path d="M14 16h36M14 48h36" stroke="currentColor" strokeWidth="2" />
    <circle cx="32" cy="53" r="2.5" fill="currentColor" opacity="0.3" />
    <rect x="22" y="24" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="28" cy="31" r="1.5" fill="currentColor" />
    <circle cx="32" cy="31" r="1.5" fill="currentColor" />
    <circle cx="36" cy="31" r="1.5" fill="currentColor" />
  </svg>
);

const TeamIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="18" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M6 50c0-8.837 7.163-16 16-16s16 8.837 16 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="46" cy="22" r="6" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <path d="M36 50c0-6.627 4.477-12 10-12s10 5.373 10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const CrmIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="20" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 54c0-11.046 8.954-20 20-20s20 8.954 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="22" y="44" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <path d="M28 50h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="52" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
    <path d="M6 14h52" stroke="currentColor" strokeWidth="2" />
    <rect x="14" y="22" width="8" height="16" rx="1" fill="currentColor" opacity="0.15" />
    <rect x="26" y="28" width="8" height="10" rx="1" fill="currentColor" opacity="0.25" />
    <rect x="38" y="20" width="8" height="18" rx="1" fill="currentColor" opacity="0.2" />
    <path d="M14 54h36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 54v4M38 54v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const features = [
  {
    icon: CalendarIcon,
    title: "Kalendarz rezerwacji",
    description: "Główny kalendarz z widokiem na stanowiska, statusy prac i dostępność zespołu. Jedno miejsce zamiast zeszytu.",
    href: "/funkcje/kalendarz-rezerwacji",
  },
  {
    icon: BookingIcon,
    title: "Rezerwacje online 24/7",
    description: "Klienci rezerwują terminy sami, o każdej porze. Ty tylko potwierdzasz — bez telefonów wieczorami.",
    href: "/funkcje/kalendarz-rezerwacji",
  },
  {
    icon: OfferIcon,
    title: "Generator ofert",
    description: "Profesjonalne oferty detailingowe w kilka minut. Z telefonu, z tabletu — nawet na siłowni.",
    href: "/funkcje/generator-ofert",
  },
  {
    icon: ProtocolIcon,
    title: "Protokół przyjęcia pojazdu",
    description: "Dokumentacja stanu auta ze zdjęciami, diagramem uszkodzeń i podpisem cyfrowym klienta.",
    href: "/funkcje/protokol-przyjecia-pojazdu",
  },
  {
    icon: SmsIcon,
    title: "Przypomnienia SMS",
    description: "Automatyczne powiadomienia o wizytach. No-show spada do zera, a Ty nie musisz dzwonić.",
    href: "/funkcje/sms-przypomnienia",
  },
  {
    icon: TeamIcon,
    title: "Zarządzanie zespołem",
    description: "Ewidencja czasu pracy, grafiki, przypisywanie do stanowisk. Pracownicy widzą zadania na tablecie.",
    href: "/funkcje/zarzadzanie-zespolem",
  },
  {
    icon: CrmIcon,
    title: "Baza klientów",
    description: "Historia wizyt, pojazdy, kontakty — wszystko w jednym miejscu. Klikasz i dzwonisz.",
    href: "/crm/crm-dla-myjni-samochodowych",
  },
  {
    icon: AnalyticsIcon,
    title: "Analityka i raporty",
    description: "Obłożenie stanowisk, przychody, czas usług — dane które pomagają podejmować decyzje.",
    href: "/funkcje/analityka-raporty",
  },
];

const FunkcjePage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <SubpageHero
          breadcrumbs={[
            { name: "Strona główna", href: "/" },
            { name: "Funkcje", href: "/funkcje" },
          ]}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl leading-tight">
            Wszystkie funkcje Carfect
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">
            Kompletny zestaw narzędzi do zarządzania myjnią ręczną i studiem detailingu. Od kalendarza po analitykę — wszystko w jednym systemie.
          </p>
        </SubpageHero>

        <section className="py-20 md:py-28">
          <div className="container px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Link
                  key={index}
                  href={feature.href}
                  className="bg-card rounded-2xl p-8 group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6">
                    <feature.icon />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Czytaj więcej
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FunkcjePage;
