"use client";
import Link from "next/link";
import Image from "next/image";
import { FileText, Layers, Link2, Mail, Eye, Palette, Globe, CheckCircle, Clock } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import szablonyOfertImg from "@/assets/studio-detailing-szablony-ofert.webp";
import generatorOfertImg from "@/assets/studio-detailing-generator-ofert-korzysci.webp";
import ofertaKlientImg from "@/assets/studio-detailing-oferta-klient.webp";
import listaOfertImg from "@/assets/studio-detailingu-lista-ofert.webp";

const GeneratorOfert = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-sky-900 text-white py-32 md:py-48">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl leading-tight">
              Generator Ofert Detailingowych – Twórz Profesjonalne Wyceny w 5 Minut
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">
              Kreator ofert z wariantami cenowymi, dodatkami i automatyczną wysyłką e-mail. Publiczny link dla klienta zwiększa skuteczność sprzedaży.
            </p>

            <div className="mt-8">
              <Button 
                asChild
                className="h-12 px-8 text-base font-semibold rounded-xl bg-white text-primary hover:bg-white/90"
              >
                <Link href="/umow-prezentacje">Umów prezentację</Link>
              </Button>
            </div>
          </div>
        </section>

        <article>
        {/* Why Professional Offer Matters */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-6">
              Dlaczego profesjonalna oferta ma znaczenie?
            </h2>
            <p className="text-muted-foreground text-center max-w-3xl mx-auto text-lg mb-12">
              Klient, który dostaje profesjonalną ofertę z logo Twojej firmy, wariantami cenowymi i czytelnym opisem usług – traktuje Cię poważniej. To buduje zaufanie i pozwala uzasadnić wyższe ceny. A Ty oszczędzasz czas, bo nie musisz liczyć wszystkiego na kartce.
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">5 minut</h3>
                <p className="text-muted-foreground">
                  Tyle zajmuje stworzenie rozbudowanej, profesjonalnej oferty z wariantami cenowymi i dodatkami.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">+20% skuteczności sprzedaży</h3>
                <p className="text-muted-foreground">
                  Profesjonalnie wyglądająca i szybko wysłana oferta zwiększa szansę na domknięcie sprzedaży w porównaniu do wyceny „na oko" i wysłanej po wielu dniach.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Twój branding</h3>
                <p className="text-muted-foreground">
                  Oferty z Twoim logo, kolorami firmowymi i danymi kontaktowymi – wyglądają profesjonalnie.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How to Create Offer */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Jak stworzyć ofertę w Carfect?
            </h2>

            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-16">
              <div className="w-full lg:w-[30%] flex justify-center">
                <div className="rounded-2xl overflow-hidden border border-border bg-muted shadow-lg max-w-[200px] sm:max-w-[220px] lg:max-w-[240px]">
                  <Image
                    src={szablonyOfertImg}
                    alt="Wybór szablonów usług detailingowych w generatorze ofert Carfect"
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 200px, 240px"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="space-y-8">
                  {/* Step 1 - Templates */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Szablony
                      </h3>
                      <p className="text-muted-foreground">
                        Gotowe szablony dla PPF, powłok ceramicznych, korekty lakieru czy detailingu wnętrza. Możesz też tworzyć własne szablony dopasowane do Twojej oferty usługowej.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 - Services */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Usługi
                      </h3>
                      <p className="text-muted-foreground">
                        Dodawaj warianty cenowe (np. tańszy i droższy), opcjonalne dodatki i rabaty. System automatycznie kalkuluje ceny – koniec z ręcznym liczeniem na kartce.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Public Link Section */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Publiczny link dla klienta
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
              {/* Feature 1 */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Wyślij bezpośrednio z systemu
                </h3>
                <p className="text-muted-foreground text-sm">
                  Jednym kliknięciem wysyłasz ofertę do klienta prosto z aplikacji. Link do oferty trafia na email lub SMS – bez konieczności tworzenia PDF-ów.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Klient ogląda ofertę w przeglądarce
                </h3>
                <p className="text-muted-foreground text-sm">
                  Klient otwiera link i widzi ofertę dopasowaną do telefonu lub komputera. Przejrzysty układ, zdjęcia usług, opisy wariantów – bez pobierania plików.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Branding Twojej firmy
                </h3>
                <p className="text-muted-foreground text-sm">
                  Oferta z Twoim logo, kolorami firmowymi i danymi kontaktowymi. Profesjonalny wygląd, który buduje zaufanie klienta.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Link2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Status: obejrzana
                </h3>
                <p className="text-muted-foreground text-sm">
                  Wiesz, czy i kiedy klient otworzył ofertę. Dzięki temu wiesz, kiedy zadzwonić i dopytać – zwiększasz skuteczność sprzedaży.
                </p>
              </div>
            </div>

            {/* Offer Preview Screenshot */}

            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 max-w-5xl mx-auto">

              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-xl font-semibold text-foreground mb-4 text-center">Co widzi Klient</h3>
                <div className="rounded-2xl overflow-hidden border border-border bg-muted shadow-lg max-w-[280px] sm:max-w-[320px]">
                  <Image
                    src={ofertaKlientImg}
                    alt="Widok oferty detailingowej na telefonie klienta z wariantami PPF i cenami"
                    className="w-full h-auto"
                    sizes="(max-width: 640px) 280px, 320px"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-xl font-semibold text-foreground mb-4 text-center">Lista Twoich ofert</h3>
                <div className="rounded-2xl overflow-hidden border border-border bg-muted shadow-lg max-w-[280px] sm:max-w-[320px]">
                  <Image
                    src={listaOfertImg}
                    alt="Lista ofert detailingowych ze statusami obejrzana, zaakceptowana w panelu Carfect"
                    className="w-full h-auto"
                    sizes="(max-width: 640px) 280px, 320px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Widget Integration Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-1 order-2 lg:order-1">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Integracja z widgetem do ofertowania na Twojej stronie
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  Osadź widget na swojej stronie WWW, by klienci mogli sami wybrać interesujące ich usługi i otrzymać wstępną wycenę. Formularz zbiera dane pojazdu i automatycznie tworzy zapytanie w Twoim CRM.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Klient sam wybiera usługi i opcje</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Lead trafia do CRM z danymi pojazdu</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Łatwe osadzenie na Twojej stronie WWW</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 order-1 lg:order-2">
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-white">
                  <iframe
                    src="https://demo.carfect.pl/embed"
                    width="100%"
                    height={700}
                    frameBorder="0"
                    style={{ border: "none", borderRadius: "8px" }}
                    title="Widget do ofertowania usług detailingowych Carfect"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Features */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Powiązane funkcje
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                href="/funkcje/protokol-przyjecia-pojazdu"
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors group"
              >
                <FileText className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Protokół przyjęcia</h3>
                <p className="text-sm text-muted-foreground mt-1">Dokumentacja stanu pojazdu ze zdjęciami</p>
              </Link>
              <Link
                href="/crm/crm-dla-studia-detailingu"
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors group"
              >
                <Layers className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">CRM dla detailingu</h3>
                <p className="text-sm text-muted-foreground mt-1">Pełne rozwiązanie dla studia</p>
              </Link>
              <Link 
                href="/crm/crm-dla-studia-detailingu"
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors group"
              >
                <Palette className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">CRM dla detailingu</h3>
                <p className="text-sm text-muted-foreground mt-1">Pełne rozwiązanie dla studia</p>
              </Link>
            </div>
          </div>
        </section>

        </article>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-sky-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">
              Stwórz pierwszą ofertę w 5 minut
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Wypróbuj generator ofert Carfect i przekonaj się, jak łatwo tworzyć profesjonalne wyceny dla klientów.
            </p>
            <Button 
              asChild
              className="h-12 px-8 text-base font-semibold rounded-xl bg-white text-primary hover:bg-white/90"
            >
              <Link href="/umow-prezentacje">Umów bezpłatną prezentację</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default GeneratorOfert;
