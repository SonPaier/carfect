"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import { Star, Quote, Phone, Users, FileText, Calendar, MessageSquare, Clock } from "lucide-react";
import logoArmcar from "@/assets/logo-armcar.png";

const OpiniePage = () => {
  const testimonials = [
    {
      name: "Armen",
      company: "ARM-CAR Detailing & Wrapping",
      logo: logoArmcar,
      quote:
        "Odkąd korzystam z Carfect, mój kalendarz rezerwacji jest uporządkowany, klienci otrzymują automatyczne przypomnienia, a ja oszczędzam mnóstwo czasu. Generator ofert pomógł mi domykać więcej zleceń – klienci są pod wrażeniem profesjonalnych wycen.",
      rating: 5,
    },
    {
      name: "Tomasz K.",
      company: "Myjnia Ręczna AutoSpa",
      logo: null,
      quote:
        "Rezerwacje online to był strzał w dziesiątkę. Telefon dzwoni o 70% mniej, a klienci sami wybierają dogodny termin. Widok na tablecie dla pracowników – nie wyobrażam sobie już pracy bez tego.",
      rating: 5,
    },
    {
      name: "Marta W.",
      company: "Detailing Studio Premium",
      logo: null,
      quote:
        "System SMS-ów praktycznie wyeliminował no-showy. Wcześniej traciłam 2-3 terminy tygodniowo, teraz to sporadyczne przypadki. Protokół przyjęcia pojazdu ze zdjęciami uratował mnie przed kilkoma nieuzasadnionymi reklamacjami.",
      rating: 5,
    },
  ];

  const appreciatedFeatures = [
    {
      icon: Phone,
      quote: "Rezerwacje online zmniejszyły liczbę telefonów o 70%",
      description:
        "Klienci rezerwują o dowolnej porze, bez konieczności dzwonienia. Ty skupiasz się na pracy, nie na odbieraniu telefonów.",
    },
    {
      icon: Users,
      quote: "Widok dla pracowników to game changer",
      description:
        "Pracownicy widzą harmonogram na tablecie w czasie rzeczywistym. Wiedzą co robić, bez ciągłego dopytywania.",
    },
    {
      icon: FileText,
      quote: "Generator ofert pomógł mi domykać więcej zleceń",
      description:
        "Profesjonalne oferty ze zdjęciami i opisami usług robią wrażenie na klientach i zwiększają konwersję.",
    },
  ];

  const stats = [
    {
      icon: Calendar,
      value: "+30%",
      label: "więcej rezerwacji",
      description: "Dzięki rezerwacjom online dostępnym 24/7",
    },
    {
      icon: MessageSquare,
      value: "-80%",
      label: "no-show dzięki SMS",
      description: "Automatyczne przypomnienia zmniejszają nieodebrane wizyty",
    },
    {
      icon: Clock,
      value: "2h",
      label: "zaoszczędzonego czasu dziennie",
      description: "Na administrację, telefony i organizację pracy",
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
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                Opinie Klientów Carfect – Co Mówią Właściciele Myjni i Studiów Detailingu
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Prawdziwe historie sukcesu od właścicieli, którzy zaufali Carfect
              </p>
            </div>
          </div>
        </section>

        <article>
        {/* Testimonials Section */}
        <section className="py-20 md:py-28 bg-section-alt">
          <div className="container px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Zaufali nam właściciele z całej Polski
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Poznaj opinie właścicieli myjni i studiów detailingu, którzy codziennie korzystają z Carfect
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl border border-border p-8 flex flex-col hover:shadow-lg transition-shadow"
                >
                  <Quote className="w-10 h-10 text-primary/30 mb-4" />
                  <p className="text-muted-foreground leading-relaxed flex-grow mb-6">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {testimonial.logo ? (
                      <Image
                        src={testimonial.logo}
                        alt={testimonial.company}
                        className="w-12 h-12 rounded-full object-cover"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Appreciated Features Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Najczęściej doceniane funkcje
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Te funkcje nasi klienci wymieniają najczęściej jako przełomowe dla ich biznesu
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {appreciatedFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl border border-border p-8 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">
                    "{feature.quote}"
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 to-background">
          <div className="container px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Wyniki liczbowe
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Średnie wyniki raportowane przez naszych klientów po wdrożeniu Carfect
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl border border-border p-8 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <stat.icon className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </p>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {stat.label}
                  </h3>
                  <p className="text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Dołącz do grona zadowolonych właścicieli myjni i studiów detailingu
              </p>
              <a
                href="/#hero"
                className="inline-flex h-14 px-8 items-center justify-center text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-sky-500 text-primary-foreground hover:from-primary/90 hover:to-sky-500/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Wypróbuj Carfect za darmo
              </a>
            </div>
          </div>
        </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default OpiniePage;
