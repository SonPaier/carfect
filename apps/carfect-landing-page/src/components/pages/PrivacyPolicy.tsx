"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/landing/Footer";
// import Image from "next/image";
// import logo from "@/assets/n2washcom-logo.svg";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md shadow-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="transition-all hover:opacity-80">
              {/* TODO: Podmienić na nowe logo SVG */}
              {/* <Image
                src={logo}
                alt="Carfect.pl"
                className="h-6 md:h-7 w-auto"
              /> */}
              <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                CARFECT
              </span>
            </Link>
            <Link 
              href="/" 
              className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Powrót na stronę główną
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-center">
            Polityka Prywatności
          </h1>
          
          <div className="prose prose-lg max-w-none text-foreground/80">
            <p className="text-lg text-foreground font-medium mb-8 text-center">
              Serwisu Carfect.pl
            </p>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
                Administrator Danych
              </h2>
              <p className="leading-relaxed pl-11">
                Administratorem danych osobowych w zakresie funkcjonowania platformy carfect.pl oraz rozliczeń z Partnerami jest: <strong>Tomasz Nastały Sinpai</strong>, ul. Prezydenta Lecha Kaczyńskiego 31 lok. 19, 81-810 Gdańsk, NIP 5851474597 (dalej: „Operator").
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">2</span>
                Zakres i Cel Przetwarzania Danych
              </h2>
              <div className="pl-11 space-y-4">
                <p className="leading-relaxed">Operator przetwarza dane w następujących celach:</p>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h3 className="font-semibold text-foreground mb-2">Realizacja rezerwacji (Klienci)</h3>
                    <p className="text-sm leading-relaxed">
                      Przekazanie danych (imię, telefon, dane pojazdu) do wybranego Partnera w celu wykonania usługi (Art. 6 ust. 1 lit. b RODO).
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h3 className="font-semibold text-foreground mb-2">Obsługa techniczna i historia</h3>
                    <p className="text-sm leading-relaxed">
                      Przechowywanie danych w bazie carfect.pl w celu umożliwienia Klientowi zarządzania rezerwacjami oraz wysyłki powiadomień SMS o statusie rezerwacji (Art. 6 ust. 1 lit. b RODO).
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h3 className="font-semibold text-foreground mb-2">Rozliczenia z Partnerami</h3>
                    <p className="text-sm leading-relaxed">
                      Przetwarzanie danych firmowych Partnerów niezbędnych do wystawiania faktur VAT i prowadzenia księgowości (Art. 6 ust. 1 lit. c RODO).
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h3 className="font-semibold text-foreground mb-2">Marketing Partnera</h3>
                    <p className="text-sm leading-relaxed">
                      W przypadku wyrażenia zgody przez Klienta na subdomenie Partnera, dane mogą być wykorzystane przez tego Partnera do wysyłki okazjonalnych informacji marketingowych. W tym zakresie Partner staje się osobnym Administratorem danych.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">3</span>
                Odbiorcy Danych
              </h2>
              <div className="pl-11">
                <p className="leading-relaxed mb-4">Dane osobowe mogą być przekazywane:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span><strong>Partnerom (Myjniom):</strong> Wyłącznie tym, u których Klient dokonuje rezerwacji.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span><strong>Podmiotom wspierającym:</strong> Dostawcom serwerów, systemów do wysyłki SMS oraz biurom rachunkowym (w zakresie faktur Partnerów).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span><strong>Organom państwowym:</strong> Jeśli wynika to z obowiązku prawnego.</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">4</span>
                Okres Przechowywania Danych
              </h2>
              <ul className="pl-11 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Dane rezerwacyjne przechowywane są przez okres niezbędny do realizacji usługi oraz utrzymania konta Klienta.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Dane do faktur (Partnerzy) przechowywane są przez okres 5 lat, zgodnie z wymogami prawa podatkowego.</span>
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">5</span>
                Prawa Użytkownika
              </h2>
              <div className="pl-11">
                <p className="leading-relaxed mb-4">Każdej osobie, której dane dotyczą, przysługuje prawo do:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span>Dostępu do swoich danych oraz otrzymania ich kopii.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span>Sprostowania (poprawiania) danych.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span>Usunięcia danych („prawo do bycia zapomnianym").</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span>Ograniczenia przetwarzania danych.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span>Wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">6</span>
                Pliki Cookies
              </h2>
              <p className="leading-relaxed pl-11">
                Serwis wykorzystuje pliki cookies w celach technicznych (sesja, utrzymanie zalogowania) oraz analitycznych. Użytkownik może zarządzać plikami cookies z poziomu ustawień swojej przeglądarki.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
