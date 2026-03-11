"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useTranslation } from "@/hooks/useTranslation";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

const KontaktPage = () => {
  const { t } = useTranslation();
  const footer = t("footer");

  const contacts = [
    {
      icon: Mail,
      label: "Email",
      value: footer.email,
      href: `mailto:${footer.email}`,
      description: "Odpowiadamy w ciągu 24h",
    },
    {
      icon: Phone,
      label: "Tomek",
      value: footer.phone1,
      href: `tel:${footer.phone1.replace(/\s/g, "")}`,
      description: "Sprzedaż, wdrożenia, wsparcie",
    },
    {
      icon: Phone,
      label: "Rafał",
      value: footer.phone2,
      href: `tel:${footer.phone2.replace(/\s/g, "")}`,
      description: "Sprzedaż, wdrożenia, wsparcie",
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
                Kontakt
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Masz pytania? Chętnie pomożemy. Skontaktuj się z nami telefonicznie, mailowo lub umów prezentację.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="py-20 md:py-28 bg-section-alt">
          <div className="container px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {contacts.map((contact, index) => (
                <a
                  key={index}
                  href={contact.href}
                  className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all group"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                    <contact.icon className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{contact.label}</p>
                  <p className="text-lg font-bold text-foreground mb-2">{contact.value}</p>
                  <p className="text-xs text-muted-foreground">{contact.description}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-6">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-4">Lokalizacja</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Działamy zdalnie na terenie całej Polski. Prezentacje i wdrożenia przeprowadzamy zdalnie, w obrębie Trójmiasta i okolic, na miejscu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 to-background">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Wolisz zobaczyć system w akcji?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Umów bezpłatną prezentację i przekonaj się, jak Carfect może usprawnić Twój biznes.
              </p>
              <a
                href="/#hero"
                className="inline-flex h-14 px-8 items-center justify-center gap-2 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-sky-500 text-primary-foreground hover:from-primary/90 hover:to-sky-500/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Umów prezentację
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default KontaktPage;
