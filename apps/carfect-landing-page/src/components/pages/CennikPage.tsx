"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Pricing from "@/components/landing/Pricing";
import { Check } from "lucide-react";

const MigrationIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="8" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" opacity="0.4" />
    <path d="M26 18h4l2-2 2 2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 14v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="26" y="22" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M30 30h8M30 34h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ConfigIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2" />
    <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.3" />
    <path d="M24 4v6M24 38v6M4 24h6M38 24h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9.86 9.86l4.24 4.24M33.9 33.9l4.24 4.24M9.86 38.14l4.24-4.24M33.9 14.1l4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const TrialIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="32" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M8 18h32" stroke="currentColor" strokeWidth="2" />
    <path d="M16 6v8M32 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 28l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CennikPage = () => {
  const scrollToHero = () => {
    window.location.href = "/#hero";
  };

  const benefits = [
    {
      icon: MigrationIcon,
      title: "Bezpłatna migracja danych",
      description:
        "Przenosimy Twoją bazę klientów z Excela, zeszytu czy dowolnego innego systemu. Bez dodatkowych opłat, bez stresu.",
    },
    {
      icon: ConfigIcon,
      title: "Pomoc w konfiguracji",
      description:
        "Pomagamy ustawić aplikację dokładnie pod Twoje usługi i cennik. Nie zostaniesz sam z pustym systemem.",
    },
    {
      icon: TrialIcon,
      title: "30 dni za darmo bez karty",
      description:
        "Wypróbuj wszystkie funkcje przez 30 dni. Bez podawania karty, bez zobowiązań. Przekonaj się sam.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-16 md:pt-48 md:pb-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 id="cennik-przejrzyste-plany-dla-myjni-i-detailingu" className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                Cennik – Przejrzyste Plany dla Myjni i Detailingu
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Wybierz plan dopasowany do Twojego biznesu. Bez ukrytych kosztów,
                bez niespodzianek.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section - reused from landing page */}
        <Pricing onScrollToContact={scrollToHero} />

        {/* No Hidden Costs Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 id="bez-ukrytych-kosztow" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Bez ukrytych kosztów
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Płacisz tylko za to, co widzisz. Żadnych niespodzianek na fakturze,
                żadnych dodatkowych opłat za funkcje podstawowe.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-8 text-center"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/5 text-primary mb-6">
                    <benefit.icon />
                  </div>
                  <h3 id={`benefit-${index}`} className="text-xl font-bold text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Trial CTA Box */}
            <div className="mt-16 max-w-3xl mx-auto">
              <div className="bg-gradient-to-r from-primary/10 to-amber-500/10 rounded-3xl p-8 md:p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 id="wyprobuj-za-darmo-przez-30-dni" className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Wypróbuj za darmo przez30 dni
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Bez podawania karty kredytowej. Bez zobowiązań. Pełen dostęp do
                  wszystkich funkcji.
                </p>
                <button
                  onClick={scrollToHero}
                  className="h-14 px-8 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Rozpocznij bezpłatny okres próbny
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CennikPage;
