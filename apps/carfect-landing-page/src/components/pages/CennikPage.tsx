"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Pricing from "@/components/landing/Pricing";
import { Check, CreditCard, Settings, Calendar } from "lucide-react";

const CennikPage = () => {
  const scrollToHero = () => {
    window.location.href = "/#hero";
  };

  const benefits = [
    {
      icon: CreditCard,
      title: "Bezpłatna migracja danych",
      description:
        "Przenosimy Twoją bazę klientów z Excela, zeszytu czy dowolnego innego systemu. Bez dodatkowych opłat, bez stresu.",
    },
    {
      icon: Settings,
      title: "Pomoc w konfiguracji",
      description:
        "Pomagamy ustawić aplikację dokładnie pod Twoje usługi i cennik. Nie zostaniesz sam z pustym systemem.",
    },
    {
      icon: Calendar,
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
                  className="bg-card rounded-2xl border border-border p-8 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <benefit.icon className="w-8 h-8 text-primary" />
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
              <div className="bg-gradient-to-r from-primary/10 to-sky-500/10 rounded-3xl p-8 md:p-12 text-center border border-primary/20">
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
                  className="h-14 px-8 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-sky-500 text-primary-foreground hover:from-primary/90 hover:to-sky-500/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
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
