"use client";

import Link from "next/link";
import Image from "next/image";
import { Link2, CheckCircle } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import SubpageHero from "@/components/landing/SubpageHero";
import protokolImg from "@/assets/studio-detailing-protokol-przyjecia-samochodu.webp";

const FileTextIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4h20l10 10v30a2 2 0 01-2 2H10a2 2 0 01-2-2V6a2 2 0 012-2z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M30 4v10h10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M16 22h16M16 29h16M16 36h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 10l3-4h10l3 4h8a3 3 0 013 3v22a3 3 0 01-3 3H8a3 3 0 01-3-3V13a3 3 0 013-3h8z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="2" />
    <circle cx="24" cy="24" r="3.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="38" cy="16" r="2" fill="currentColor" fillOpacity="0.4" />
  </svg>
);

const PenToolIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
    <path d="M34 6l8 8-22 22H12v-8L34 6z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M28 12l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 36l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <path d="M8 44h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <path d="M20 16l-8 4v8l4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L6 12v14c0 10.28 7.68 19.9 18 22 10.32-2.1 18-11.72 18-22V12L24 4z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M16 24l6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AwardIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="20" r="14" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
    <path d="M17 32l-4 12 11-6 11 6-4-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    <path d="M24 12l2.5 5 5.5.8-4 3.9.94 5.5L24 25l-4.94 2.2.94-5.5-4-3.9 5.5-.8L24 12z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const FolderOpenIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12a3 3 0 013-3h12l4 4h18a3 3 0 013 3v4H4v-8z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M4 20h40l-4 22H8L4 20z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M16 30h16M16 36h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const ProtokolPrzyjecia = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <SubpageHero>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl leading-tight">
              Protokół Przyjęcia Pojazdu dla Studia Detailingu – Cyfrowy Protokół ze Zdjęciami
            </h1>

            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">
              Diagram uszkodzeń, zdjęcia, podpis klienta online. Koniec z papierowymi kartkami. Publiczny link dla klienta.
            </p>

            <div className="mt-8">
              <Button
                asChild
                className="h-12 px-8 text-base font-semibold rounded-xl bg-white text-primary hover:bg-white/90"
              >
                <Link href="tel:+48666610222">Umów prezentację</Link>
              </Button>
            </div>
        </SubpageHero>

        <article>
        {/* Why Protocol Section */}
        <section className="py-16 md:py-20 border-b">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-6">
              Dlaczego warto mieć protokół przyjęcia i wydania pojazdu?
            </h2>
            <p className="text-muted-foreground text-center max-w-3xl mx-auto text-lg mb-12">
              Profesjonalny protokół przyjęcia to Twoja ochrona przed nieuzasadnionymi reklamacjami. Dokumentujesz każde uszkodzenie ze zdjęciami i podpisem klienta – w razie sporu masz niepodważalny dowód stanu pojazdu przed pracą. To buduje zaufanie i profesjonalny wizerunek studia.
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-card rounded-2xl p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldIcon />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Ochrona przed reklamacjami</h3>
                <p className="text-sm text-muted-foreground">
                  Dokumentujesz stan pojazdu przed rozpoczęciem prac. W razie sporu masz zdjęcia i podpis klienta potwierdzający istniejące wcześniej uszkodzenia.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CameraIcon />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Dowód fotograficzny</h3>
                <p className="text-sm text-muted-foreground">
                  Każde zdjęcie ma automatyczną datę i godzinę wykonania. To niepodważalny dowód w przypadku roszczeń o nowe uszkodzenia po odebraniu auta.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <PenToolIcon />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Podpis klienta</h3>
                <p className="text-sm text-muted-foreground">
                  Klient potwierdza stan pojazdu cyfrowym podpisem na tablecie lub telefonie. Prawnie wiążące – jak tradycyjny podpis na papierze.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Looks Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Jak wygląda protokół w Carfect?
            </h2>

            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 max-w-5xl mx-auto">
              <div className="flex-1">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={protokolImg}
                    alt="Cyfrowy protokół przyjęcia pojazdu Carfect z diagramem uszkodzeń i zdjęciami"
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Interaktywny diagram pojazdu</h3>
                    <p className="text-muted-foreground text-sm">
                      Klikasz na schemacie auta i zaznaczasz uszkodzenia – rysy, wgniecenia, odpryski lakieru. Diagram automatycznie zapisuje lokalizację każdego defektu.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Galeria zdjęć</h3>
                    <p className="text-muted-foreground text-sm">
                      Robisz zdjęcia bezpośrednio z aparatu telefonu lub tabletu. Każde zdjęcie automatycznie dostaje datę i godzinę – dowód, kiedy dokładnie zostało wykonane.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Dane pojazdu i klienta</h3>
                    <p className="text-muted-foreground text-sm">
                      System automatycznie pobiera dane z CRM – marka, model, numer rejestracyjny, dane klienta. Możesz też uzupełnić je ręcznie, jeśli to nowy klient.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Notatki i uwagi</h3>
                    <p className="text-muted-foreground text-sm">
                      Zapisujesz życzenia klienta, specjalne instrukcje czy historię pojazdu. Wszystko w jednym miejscu – pracownicy widzą notatki przy każdej wizycie.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Podpis cyfrowy</h3>
                    <p className="text-muted-foreground text-sm">
                      Klient potwierdza stan pojazdu podpisując się palcem na ekranie. Podpis zapisywany razem z protokołem – tak samo ważny jak tradycyjny podpis na papierze.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Public Link Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 max-w-5xl mx-auto">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Klient dostaje protokół na maila
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  Po podpisaniu protokołu, klient automatycznie otrzymuje link do protokołu na swojego maila. Może przeglądać wszystkie zdjęcia, sprawdzić zaznaczone uszkodzenia – w dowolnym momencie, z telefonu lub komputera.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Automatyczny mail z linkiem zaraz po podpisaniu</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Wszystkie zdjęcia w pełnej rozdzielczości</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Protokół zostaje dodany do listy protokołów</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-20 border-b">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Korzyści
            </h2>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Benefit 1 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <ShieldIcon />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Brak sporów o stan pojazdu
                </h3>
                <p className="text-muted-foreground">
                  Zdjęcia i diagram są niepodważalnym dowodem stanu przed pracą. Klient podpisał protokół – potwierdził istniejące uszkodzenia. Koniec z kłótniami o rysy, które były już wcześniej.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <AwardIcon />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Profesjonalny wizerunek
                </h3>
                <p className="text-muted-foreground">
                  Cyfrowy protokół ze zdjęciami i podpisem na tablecie robi wrażenie. Wyróżniasz się od konkurencji nadal używającej papierowych kartek. Klient widzi, że jest w dobrych rękach.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <FolderOpenIcon />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Wszystko w jednym systemie
                </h3>
                <p className="text-muted-foreground">
                  Koniec z szukaniem papierowych kartek w szafie. Wszystkie protokoły w chmurze, wyszukiwanie po numerze rejestracyjnym, powiązanie z rezerwacją i ofertą. Cała historia pojazdu w jednym miejscu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Related Features */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Powiązane funkcje
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link
                href="/funkcje/generator-ofert"
                className="bg-card rounded-xl p-6 transition-colors group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-4">
                  <FileTextIcon />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Generator ofert</h3>
                <p className="text-sm text-muted-foreground mt-1">Twórz profesjonalne wyceny</p>
              </Link>
              <Link
                href="/crm/crm-dla-studia-detailingu"
                className="bg-card rounded-xl p-6 transition-colors group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-4">
                  <CameraIcon />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">CRM dla detailingu</h3>
                <p className="text-sm text-muted-foreground mt-1">Pełne rozwiązanie dla studia</p>
              </Link>
              <Link
                href="/funkcje/sms-przypomnienia"
                className="bg-card rounded-xl p-6 transition-colors group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-4">
                  <ShieldIcon />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">SMS przypomnienia</h3>
                <p className="text-sm text-muted-foreground mt-1">Automatyczne powiadomienia</p>
              </Link>
            </div>
          </div>
        </section>

        </article>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-amber-950 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">
              Koniec z papierowymi protokołami
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Przejdź na cyfrowe protokoły przyjęcia i chroń swoje studio przed nieuzasadnionymi reklamacjami.
            </p>
            <Button
              asChild
              className="h-12 px-8 text-base font-semibold rounded-xl bg-white text-primary hover:bg-white/90"
            >
              <Link href="tel:+48666610222">Umów bezpłatną prezentację</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProtokolPrzyjecia;
