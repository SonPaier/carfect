"use client";
import Link from "next/link";
import Image from "next/image";
import { FileText, Camera, Bell, TrendingUp, Palette, Shield, Clock, CheckCircle } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import generatorOfert from "@/assets/studio-detailing-szablony-ofert.webp";
import protokolPrzyjecia from "@/assets/studio-detailing-protokol-przyjecia-samochodu.webp";
import przypomnieniaSMS from "@/assets/studio-detailing-przypomnienia-sms-powloki-ceramiczne.webp";

const CrmDetailing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-sky-900 text-white py-32 md:py-48">
          <div className="container mx-auto px-4">
            <h1 id="crm-dla-studia-detailingu-system-rezerwacji-i-ofert-detailingowych" className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl leading-tight">CRM dla studia detailingu – System rezerwacji i ofert detailingowych

            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">Oprogramowanie CRM dla studiów detailingu. Generator ofert, kalendarz, protokoły przyjęcia, przypomnienia o przeglądach powłok.

            </p>

            <div className="mt-8">
              <Button
                asChild
                className="h-12 px-8 text-base font-semibold rounded-xl bg-white text-primary hover:bg-white/90">

                <Link href="/umow-prezentacje">Umów prezentację</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-white/60">
              Od 139 zł/msc • Bez zobowiązań • 30 dni za darmo
            </p>
          </div>
        </section>

        <article>
        {/* What's Different Section */}
        <section className="py-16 md:py-20 border-b border-border">
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
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-amber-600" />
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
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-amber-600" />
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
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-6 h-6 text-amber-600" />
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
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-amber-600" />
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
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 id="funkcje-dedykowane-dla-detailingu-w-carfect" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Funkcje dedykowane dla detailingu w Carfect
            </h2>

            {/* Feature 1 - Image Right */}
            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 mb-16 lg:mb-20">
              <div className="w-full lg:w-4/5 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <h3 id="generator-ofert-z-wariantami" className="text-xl md:text-2xl font-semibold text-foreground">Generator ofert z wariantami

                  </h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">Znasz ten ból gdy Klient prosi o ofertę na PPF Full Body + PPF Full Front + Ceramika na resztę karoserii? a najlepiej w wersji tańszej i droższej? Z generatorem ofert Carfect, przygotowanie takiej oferty, to 3 minuty. Dodatkowo, oferta ma profesjonalny wygląd, podkreśla atuty Twojego studia i jest natychmiastowo wysłana do Klienta, prosto z aplikacji.

                </p>
              </div>
              <div className="w-full lg:w-1/5 order-1 lg:order-2">
                <div className="rounded-2xl overflow-hidden border border-border">
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
                <div className="rounded-2xl overflow-hidden border border-border">
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
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
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
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <h3 id="automatyczne-przypomnienia-o-serwisach" className="text-xl md:text-2xl font-semibold text-foreground">
                    Automatyczne przypomnienia o serwisach
                  </h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">Odświeżanie powłok ceramicznych czy serwis folii PPF to szybki, stały i łatwy dochód. System Carfect śledzi Twoje realizacje, sam planuje przypomnienia wg Twojego harmonogramu i w odpowiednich cyklach, wysyła do Klienta zaproszenie na usługę.

                </p>
              </div>
              <div className="w-full lg:w-1/5 order-1 lg:order-2">
                <div className="rounded-2xl overflow-hidden border border-border">
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
            <div className="bg-card rounded-2xl p-8 md:p-12 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
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
              <div className="bg-card rounded-2xl p-8 md:p-12 border-2 border-primary shadow-lg">
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

                  <Link href="/umow-prezentacje">Umów bezpłatną prezentację</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 id="przyklady-ofert-stworzonych-w-carfect" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-6">
              Przykłady ofert stworzonych w Carfect
            </h2>
            <p className="text-muted-foreground text-center max-w-3xl mx-auto text-lg mb-12">Zobacz, jak wyglądają oferty stworzone w naszej aplikacji. Dodatkowo, wiesz czy i kiedy Klient obejrzał ofertę.

            </p>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <a href="https://demo.carfect.pl/offers/cbqwwa2l" target="_blank" rel="noopener noreferrer" className="bg-muted rounded-2xl aspect-[4/1] flex items-center justify-center border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <p className="text-muted-foreground font-medium text-sm">Przykładowa oferta nr 1 na usługi car detailingu</p>
              </a>
              <a href="https://demo.carfect.pl/offers/fui6o14o" target="_blank" rel="noopener noreferrer" className="bg-muted rounded-2xl aspect-[4/1] flex items-center justify-center border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <p className="text-muted-foreground font-medium text-sm">Przykładowa oferta nr 2 na usługi car detailingu</p>
              </a>
              <a href="https://demo.carfect.pl/offers/opl7z9zt" target="_blank" rel="noopener noreferrer" className="bg-muted rounded-2xl aspect-[4/1] flex items-center justify-center border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <p className="text-muted-foreground font-medium text-sm">Przykładowa oferta nr 3 na usługi car detailingu</p>
              </a>
            </div>
          </div>
        </section>

        </article>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-sky-900 text-white">
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

              <Link href="/umow-prezentacje">Umów bezpłatną prezentację</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>);

};

export default CrmDetailing;