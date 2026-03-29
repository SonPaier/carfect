"use client";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import SubpageHero from "@/components/landing/SubpageHero";

const ClockIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
    <circle cx="24" cy="24" r="18" fill="currentColor" fillOpacity="0.08" />
    <path d="M24 14v10l6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="24" cy="24" r="2" fill="currentColor" />
    <path d="M24 6v3M24 39v3M6 24h3M39 24h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </svg>
);

const FileTextIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6h20l10 10v26a2 2 0 01-2 2H10a2 2 0 01-2-2V8a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" />
    <path d="M10 6h20l10 10v26a2 2 0 01-2 2H10a2 2 0 01-2-2V8a2 2 0 012-2z" fill="currentColor" fillOpacity="0.08" />
    <path d="M30 6v10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 24h16M16 30h16M16 36h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 16h6l4-6h16l4 6h6a2 2 0 012 2v22a2 2 0 01-2 2H6a2 2 0 01-2-2V18a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" />
    <path d="M6 16h6l4-6h16l4 6h6a2 2 0 012 2v22a2 2 0 01-2 2H6a2 2 0 01-2-2V18a2 2 0 012-2z" fill="currentColor" fillOpacity="0.08" />
    <circle cx="24" cy="28" r="8" stroke="currentColor" strokeWidth="2" />
    <circle cx="24" cy="28" r="4" fill="currentColor" fillOpacity="0.2" />
    <circle cx="38" cy="20" r="2" fill="currentColor" opacity="0.4" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 6a14 14 0 0114 14v8l4 6H6l4-6v-8A14 14 0 0124 6z" stroke="currentColor" strokeWidth="2" />
    <path d="M24 6a14 14 0 0114 14v8l4 6H6l4-6v-8A14 14 0 0124 6z" fill="currentColor" fillOpacity="0.1" />
    <path d="M20 34a4 4 0 008 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M24 6v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="14" r="2" fill="currentColor" opacity="0.25" />
  </svg>
);

const PaletteIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
    <circle cx="24" cy="24" r="18" fill="currentColor" fillOpacity="0.07" />
    <circle cx="16" cy="18" r="3" fill="currentColor" fillOpacity="0.35" />
    <circle cx="28" cy="14" r="3" fill="currentColor" fillOpacity="0.35" />
    <circle cx="34" cy="24" r="3" fill="currentColor" fillOpacity="0.35" />
    <circle cx="30" cy="34" r="3" fill="currentColor" fillOpacity="0.35" />
    <path d="M32 36a6 6 0 010-6 6 6 0 016 0v2a4 4 0 01-4 4h-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 34l10-12 8 6 12-14 6-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 10h10v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 42h36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    <path d="M6 34l10-12 8 6 12-14" fill="none" stroke="currentColor" strokeWidth="0" />
    <path d="M6 42V34l10-12 8 6 12-14 6-4v16H6z" fill="currentColor" fillOpacity="0.08" />
  </svg>
);
import generatorOfert from "@/assets/studio-detailing-szablony-ofert.webp";
import protokolPrzyjecia from "@/assets/studio-detailing-protokol-przyjecia-samochodu.webp";
import przypomnieniaSMS from "@/assets/studio-detailing-przypomnienia-sms-powloki-ceramiczne.webp";

const CrmDetailing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <SubpageHero breadcrumbs={[
          { name: "Strona główna", href: "/" },
          { name: "CRM", href: "/crm" },
          { name: "CRM dla detailingu", href: "/crm/crm-dla-studia-detailingu" },
        ]}>
            <h1 id="crm-dla-studia-detailingu-system-rezerwacji-i-ofert-detailingowych" className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl leading-tight">CRM dla studia detailingu – System rezerwacji i ofert detailingowych

            </h1>

            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">Oprogramowanie CRM dla studiów detailingu. Generator ofert, kalendarz, protokoły przyjęcia, przypomnienia o przeglądach powłok.

            </p>

            <div className="mt-8">
              <Button
                asChild
                className="h-12 px-8 text-base font-semibold rounded-xl bg-white text-primary hover:bg-white/90">

                <Link href="tel:+48666610222">Umów prezentację</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-white/60">
              Od 139 zł/msc • Bez zobowiązań • 30 dni za darmo
            </p>
        </SubpageHero>

        <article>
        {/* What's Different Section */}
        <section className="py-16 md:py-20 border-b">
          <div className="container mx-auto px-4">
            <h2 id="czym-rozni-sie-crm-dla-studia-detailingu-od-zwyklego-crm" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-6">Czym różni się CRM dla studia detailingu od zwykłego CRM?

            </h2>
            <p className="text-muted-foreground text-center max-w-3xl mx-auto text-lg">CRM dla studia detailingu przede wszystkim jest dostosowany do specyfiki branży. Obsługa wielu pojazdów jednego klienta, generowanie wielo-wariantowych ofert na usługi car detailing czy prosty widok CRM na telefonie. Ale różnic jest znacznie więcej!

            </p>
          </div>
        </section>

        {/* Specific Needs Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 id="specyficzne-potrzeby-studiow-detailingu" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Specyficzne potrzeby studiów detailingu
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Need 1 */}
              <div className="bg-card rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                    <ClockIcon />
                  </div>
                  <div>
                    <h3 id="wielodniowe-zlecenia" className="text-xl font-semibold text-foreground mb-3">Wielodniowe zlecenia

                    </h3>
                    <p className="text-muted-foreground">Usługi car-detailing jak położenie powłoki ceramicznej czy folii PPF to najczęściej praca od 2 do 5 dni. Dobry kalendarz dla studia detailingu, pozwaa szybko dodawać wielodniowe rezerwacje.

                    </p>
                  </div>
                </div>
              </div>

              {/* Need 2 */}
              <div className="bg-card rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                    <FileTextIcon />
                  </div>
                  <div>
                    <h3 id="zlozone-oferty-z-wariantami-cenowymi" className="text-xl font-semibold text-foreground mb-3">
                      Złożone oferty z wariantami cenowymi
                    </h3>
                    <p className="text-muted-foreground">Klient często prosi o ofertę PPF Full body oraz na PPF Full Front plus Powłoka ceramiczna na resztę karoserii. Przygotowanie dobrze opisanej i rozbudowanej oferty jest czasochłonne.

                    </p>
                  </div>
                </div>
              </div>

              {/* Need 3 */}
              <div className="bg-card rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                    <CameraIcon />
                  </div>
                  <div>
                    <h3 id="protokoly-przyjecia-pojazdu-ze-zdjeciami" className="text-xl font-semibold text-foreground mb-3">
                      Protokoły przyjęcia pojazdu ze zdjęciami
                    </h3>
                    <p className="text-muted-foreground">Protokół przyjęcia samochodu jest na złe czasy. Stan licznika, zdjęcia samochodu, podpis Klienta - wszystko to chroni Twoje studio przed nieprzewidzianymi sytuacjami.

                    </p>
                  </div>
                </div>
              </div>

              {/* Need 4 */}
              <div className="bg-card rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                    <BellIcon />
                  </div>
                  <div>
                    <h3 id="przypomnienia-o-przegladach-powloki-ceramicznej" className="text-xl font-semibold text-foreground mb-3">
                      Przypomnienia o przeglądach powłoki ceramicznej
                    </h3>
                    <p className="text-muted-foreground">Przypomnienia SMS o odświeżeniu powłoki ceramicznej, to skuteczna strategia na stały dochód. Jednak bez dobrego harmonogramu przypomnień SMS nie jest to łatwe zadanie.

                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Images */}
        <section className="py-16 md:py-20 border-b">
          <div className="container mx-auto px-4">
            <h2 id="funkcje-dedykowane-dla-detailingu-w-carfect" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Funkcje dedykowane dla detailingu w Carfect
            </h2>

            {/* Feature 1 - Image Right */}
            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 mb-16 lg:mb-20">
              <div className="w-full lg:w-4/5 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                    <PaletteIcon />
                  </div>
                  <h3 id="generator-ofert-z-wariantami" className="text-xl md:text-2xl font-semibold text-foreground">Generator ofert z wariantami

                  </h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">Znasz ten ból gdy Klient prosi o ofertę na PPF Full Body + PPF Full Front + Ceramika na resztę karoserii? a najlepiej w wersji tańszej i droższej? Z generatorem ofert Carfect, przygotowanie takiej oferty, to 3 minuty. Dodatkowo, oferta ma profesjonalny wygląd, podkreśla atuty Twojego studia i jest natychmiastowo wysłana do Klienta, prosto z aplikacji.

                </p>
              </div>
              <div className="w-full lg:w-1/5 order-1 lg:order-2">
                <div className="rounded-2xl overflow-hidden">
                  <Image
                    src={generatorOfert}
                    alt="Generator ofert dla studia detailingu - tworzenie profesjonalnych ofert z wariantami cenowymi w kilka minut"
                    className="w-full h-auto"
                    sizes="(max-width: 1024px) 100vw, 20vw"
                  />
                </div>
              </div>
            </div>

            {/* Feature 2 - Image Left */}
            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 mb-16 lg:mb-20">
              <div className="w-full lg:w-1/5 order-1">
                <div className="rounded-2xl overflow-hidden">
                  <Image
                    src={protokolPrzyjecia}
                    alt="Protokół przyjęcia samochodu w studio detailingu - dokumentacja stanu pojazdu ze zdjęciami i podpisem cyfrowym"
                    className="w-full h-auto"
                    sizes="(max-width: 1024px) 100vw, 20vw"
                  />
                </div>
              </div>
              <div className="w-full lg:w-4/5 order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                    <CameraIcon />
                  </div>
                  <h3 id="protokol-przyjecia-z-diagramem-uszkodzen" className="text-xl md:text-2xl font-semibold text-foreground">
                    Protokół przyjęcia z diagramem uszkodzeń
                  </h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">Aplikacja Carfect pozwala Ci szybko tworzyć protokoły przyjęcia i odbioru samochodu. Koniec z papierem. Protokół jest powiązany z rezerwacją w kalendarzu i automatycznie wysłany do Klienta po wykonaniu. Wszystko zrobisz za pomocą paru kliknięć w telefonie.

                </p>
              </div>
            </div>

            {/* Feature 3 - Image Right */}
            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 mb-16 lg:mb-20">
              <div className="w-full lg:w-4/5 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                    <BellIcon />
                  </div>
                  <h3 id="automatyczne-przypomnienia-o-serwisach" className="text-xl md:text-2xl font-semibold text-foreground">
                    Automatyczne przypomnienia o serwisach
                  </h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">Odświeżanie powłok ceramicznych czy serwis folii PPF to szybki, stały i łatwy dochód. System Carfect śledzi Twoje realizacje, sam planuje przypomnienia wg Twojego harmonogramu i w odpowiednich cyklach, wysyła do Klienta zaproszenie na usługę.

                </p>
              </div>
              <div className="w-full lg:w-1/5 order-1 lg:order-2">
                <div className="rounded-2xl overflow-hidden">
                  <Image
                    src={przypomnieniaSMS}
                    alt="Automatyczne przypomnienia SMS o przeglądach powłok ceramicznych - zwiększ stały dochód ze świadczonych usług"
                    className="w-full h-auto"
                    sizes="(max-width: 1024px) 100vw, 20vw"
                  />
                </div>
              </div>
            </div>

            {/* Feature 4 - Full Width */}
            <div className="bg-card rounded-2xl p-8 md:p-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUpIcon />
                </div>
                <h3 id="wsparcie-sprzedazy" className="text-xl md:text-2xl font-semibold text-foreground">Wsparcie sprzedaży

                </h3>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">Dzięki historii rezerwacji Klienta, znasz jego nawyki. System automatycznie podpowiada dodatkowe usługi do zaproponowania Klientowi, na podstawie jego poprzednich rezerwacji.

              </p>
            </div>
          </div>
        </section>

        {/* Pricing Plan Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 id="plan-detailing-pelna-funkcjonalnosc" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Plan Detailing – pełna funkcjonalność
            </h2>

            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-2xl p-8 md:p-12 border-2 border-primary">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                  <div>
                    <h3 id="139-zl-za-pierwsze-stanowisko" className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      139 zł za pierwsze stanowisko
                    </h3>
                    <p className="text-muted-foreground">
                      + 49 zł za każde kolejne stanowisko/miesiąc
                    </p>
                  </div>
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                    -20% przy płatności rocznej
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-foreground mb-4">
                  Co dodatkowo w planie Detailing?
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Generator ofert</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">prosty kalendarz działający dobrze na telefonie</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Protokoły przyjęcia samochodów ze zdjęciami</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">przypomnienia SMS o wizytach dla Klientów</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Przypomnienia SMS o odświeżaniu powłok</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Wsparcie sprzedaży</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Raportowanie czasu przez pracowników</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Formularz na Twoją stronę do zbierania zapytań na folie PPF i powłoki ceramiczne czy elastomerowe</span>
                  </div>
                </div>

                <Button
                  asChild
                  className="w-full h-12 text-base font-semibold rounded-xl">

                  <Link href="tel:+48666610222">Umów bezpłatną prezentację</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>


        </article>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-amber-950 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 id="gotowy-by-profesjonalizowac-swoje-studio" className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">
              Gotowy, by profesjonalizować swoje studio?
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Dołącz do studiów detailingu, które już korzystają z Carfect. Zacznij bezpłatny okres próbny już dziś.
            </p>
            <Button
              asChild
              className="h-12 px-8 text-base font-semibold rounded-xl bg-white text-primary hover:bg-white/90">

              <Link href="tel:+48666610222">Umów bezpłatną prezentację</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>);

};

export default CrmDetailing;