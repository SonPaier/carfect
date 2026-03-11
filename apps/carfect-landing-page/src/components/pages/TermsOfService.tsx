"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/landing/Footer";
// import Image from "next/image";
// import logo from "@/assets/n2washcom-logo.svg";

const TermsOfService = () => {
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
            Regulamin
          </h1>
          
          <div className="prose prose-lg max-w-none text-foreground/80">
            <p className="text-lg text-foreground font-medium mb-8 text-center">
              Świadczenia Usług Drogą Elektroniczną carfect.pl
            </p>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">§1</span>
                Postanowienia Ogólne
              </h2>
              <div className="pl-11 space-y-4">
                <p className="leading-relaxed">
                  Właścicielem i operatorem Serwisu dostępnego pod adresem carfect.pl oraz powiązanych subdomen jest <strong>Tomasz Nastały Sinpai</strong>, ul. Prezydenta Lecha Kaczyńskiego 31 lok. 19, 81-810 Gdańsk, NIP 5851474597 (dalej: „Operator").
                </p>
                <p className="leading-relaxed">
                  Niniejszy Regulamin określa zasady korzystania z platformy carfect.pl przez Klientów oraz Partnerów.
                </p>
                <p className="leading-relaxed">
                  Serwis służy do dokonywania rezerwacji usług mycia i pielęgnacji pojazdów u Partnerów oraz zarządzania tymi rezerwacjami.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">§2</span>
                Definicje
              </h2>
              <div className="pl-11 space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <h3 className="font-semibold text-foreground mb-2">Partner</h3>
                  <p className="text-sm leading-relaxed">
                    Podmiot prowadzący działalność gospodarczą, który na podstawie umowy z Operatorem korzysta z Serwisu w celu oferowania swoich usług i zarządzania rezerwacjami we własnej domenie (subdomenie carfect.pl).
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <h3 className="font-semibold text-foreground mb-2">Klient</h3>
                  <p className="text-sm leading-relaxed">
                    Osoba fizyczna, prawna lub jednostka organizacyjna korzystająca z Serwisu w celu dokonania rezerwacji usługi u Partnera.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <h3 className="font-semibold text-foreground mb-2">Serwis</h3>
                  <p className="text-sm leading-relaxed">
                    System rezerwacyjny online działający w domenie carfect.pl oraz subdomenach Partnerów.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">§3</span>
                Usługi dla Partnera i Rozliczenia
              </h2>
              <ul className="pl-11 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Operator świadczy na rzecz Partnera usługę dostępu do platformy SaaS ułatwiającej zarządzanie rezerwacjami.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Za korzystanie z Serwisu Partner zobowiązuje się do uiszczania opłaty abonamentowej lub prowizyjnej zgodnie z wybranym planem usług.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Operator wystawia Partnerowi faktury VAT za świadczone usługi.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Partner wyraża zgodę na przesyłanie faktur drogą elektroniczną na adres e-mail podany podczas rejestracji.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Faktury wystawiane są w cyklu miesięcznym i płatne w terminie wskazanym na dokumencie.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Partner jest zobowiązany do podania prawdziwych danych do faktury i ich aktualizacji w panelu administracyjnym.</span>
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">§4</span>
                Usługi dla Klienta
              </h2>
              <ul className="pl-11 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Korzystanie z Serwisu przez Klienta w celu dokonania rezerwacji jest bezpłatne.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Klient dokonuje rezerwacji poprzez formularz, podając dane identyfikacyjne, kontaktowe oraz dane pojazdu.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Klient ma możliwość zarządzania swoją rezerwacją (edycja, anulowanie) za pośrednictwem Serwisu.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Płatność za usługę mycia pojazdu odbywa się bezpośrednio u Partnera po wykonaniu usługi. Serwis nie obsługuje płatności online od Klientów.</span>
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">§5</span>
                Odpowiedzialność
              </h2>
              <ul className="pl-11 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Operator zapewnia zaplecze techniczne Serwisu, nie jest jednak stroną umowy o świadczenie usługi mycia pojazdu. Stronami tej umowy są Klient oraz Partner.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Partner ponosi pełną odpowiedzialność za rzetelność informacji o swoich usługach, cenach oraz terminach.</span>
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">§6</span>
                Postanowienia Końcowe
              </h2>
              <ul className="pl-11 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>Operator zastrzega sobie prawo do zmiany Regulaminu. O zmianach Partnerzy zostaną poinformowani drogą mailową.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                  <span>W sprawach nieuregulowanych mają zastosowanie przepisy Kodeksu Cywilnego oraz ustawy o świadczeniu usług drogą elektroniczną.</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TermsOfService;
