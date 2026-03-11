"use client";
import Link from "next/link";
import Image from "next/image";
import { Calendar, CalendarDays, Clock, Edit3, Layers, Pause, Users, Globe, MessageSquare } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import kalendarzDesktopImg from "@/assets/studio-detailing-myjnia-reczna-kalendarz.png";
import edycjaRezerwacjiImg from "@/assets/kalendarz-rezerwacji-myjnia-reczna-korzysci-1.webp";
import rezerwacjaWielodniowaImg from "@/assets/kalendarz-rezerwacji-myjnia-reczna-korzysci-2.webp";
import zewnetrznyKalendarzImg from "@/assets/studio-car-detailing-myjnia-reczna-zewnetrzny-kalendarz.webp";
import smsPotwierdznieImg from "@/assets/studio-detailing-przypomnienia-sms-powloki-ceramiczne.webp";

const KalendarzRezerwacji = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-sky-900 text-white py-32 md:py-48">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl leading-tight">
              Kalendarz Rezerwacji dla Myjni i Detailingu
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">
              Widok dzienny i tygodniowy, przypisanie rezerwacji do stanowisk. Rezerwacje 24/7 bez telefonów.
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
        {/* How It Works Section */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-6">
              Jak działa kalendarz rezerwacji Carfect?
            </h2>
            <p className="text-muted-foreground text-center max-w-3xl mx-auto text-lg mb-12">
              Intuicyjny widok, który łączy grafik z bazą klientów. Wszystko czytelne na Twoim telefonie. Każda rezerwacja jest połączona z profilem klienta – historia wizyt, numery telefonów i pojazdy dostępne jednym kliknięciem. Zmiany widoczne w czasie rzeczywistym dla całego zespołu.
            </p>

            {/* Placeholder for screenshot/video */}
            <div className="max-w-5xl mx-auto">
              <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
                <Image
                  src={kalendarzDesktopImg}
                  alt="Główny widok kalendarza rezerwacji Carfect z rezerwacjami na stanowiskach"
                  className="w-full h-auto"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 1024px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Calendar Views Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Widoki kalendarza
            </h2>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* View 1 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Widok dzienny
                </h3>
                <p className="text-muted-foreground">
                  Szczegółowy podział na godziny z wszystkimi stanowiskami obok siebie. Widzisz obłożenie całego dnia na jednym ekranie i szybko łapiesz wolne sloty.
                </p>
              </div>

              {/* View 2 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Widok tygodniowy
                </h3>
                <p className="text-muted-foreground">
                  Przegląd całego tygodnia pozwala planować z wyprzedzeniem. Szybko identyfikujesz wolne terminy i optymalizujesz grafik, by nie było „dziur" między rezerwacjami.
                </p>
              </div>

              {/* View 3 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Widok stanowisk
                </h3>
                <p className="text-muted-foreground">
                  Każde stanowisko jako osobna kolumna z kolorowymi oznaczeniami usług. Pracownicy widzą zmiany w czasie rzeczywistym – koniec z bieganiem do biura po informacje.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Easy Editing Section */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-1">
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
                  <Image
                    src={edycjaRezerwacjiImg}
                    alt="Edycja rezerwacji w kalendarzu Carfect z powiadomieniem o nowej rezerwacji"
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Wygodna edycja
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Przenoś rezerwacje między stanowiskami i godzinami jednym ruchem. Klikasz w rezerwację – edytujesz szczegóły, dzwonisz do klienta prosto z aplikacji albo zmieniasz status. Czas usługi dostosowany do rodzaju usługi i rozmiaru auta, co pozwala na szybkie dodawanie rezerwacji.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-day Reservations Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-1 order-2 lg:order-1">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Rezerwacje wielodniowe
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Idealne dla studiów detailingu – usługi takie jak położenie folii PPF czy powłoki ceramicznej to praca od 2 do 5 dni. Kalendarz pozwala szybko dodać rezerwację wielodniową, automatycznie blokuje stanowisko i pokazuje postęp prac w przejrzystym widoku.
                </p>
              </div>
              <div className="flex-1 order-1 lg:order-2">
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
                  <Image
                    src={rezerwacjaWielodniowaImg}
                    alt="Klientka rezerwująca wizytę online przez kalendarz Carfect z wyborem daty i godziny"
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Breaks & Closed Days Section */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Przerwy techniczne i dni zamknięte
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Block hours */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Pause className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      Blokowanie godzin lub całych dni
                    </h3>
                    <p className="text-muted-foreground">
                      Jednym kliknięciem blokujesz godziny na przerwę techniczną, konserwację sprzętu czy szkolenie zespołu. Zablokowane terminy automatycznie znikają z kalendarza rezerwacji online.
                    </p>
                  </div>
                </div>
              </div>

              {/* Employee vacations */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      Urlopy pracowników
                    </h3>
                    <p className="text-muted-foreground">
                      Planuj nieobecności zespołu bezpośrednio w kalendarzu. System uwzględnia dostępność załogi przy planowaniu grafiku, byś zawsze miał właściwe osoby w odpowiednim czasie.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Online Booking Integration Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Integracja z rezerwacjami online
            </h2>

            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-12">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                    Zewnętrzny kalendarz to rezerwacje przez całą dobę
                  </h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Zewnętrzny kalendarz dla Twoich klientów, pozwala im rezerwować terminy bez zakładania konta – Ty tylko je potwierdzasz w kalendarzu. Każda rezerwacja online to o jeden telefon mniej. Klienci rezerwują wtedy, gdy o tym myślą – często wieczorami lub w weekendy. Na Booksy, 70% rezerwacji odbywa się poza godzinami pracy salonów.
                </p>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-muted max-w-[280px] sm:max-w-[320px] lg:max-w-none">
                  <Image
                    src={zewnetrznyKalendarzImg}
                    alt="Zewnętrzny kalendarz rezerwacji Carfect osadzony na stronie studia detailingowego"
                    className="w-full h-auto"
                    sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 500px"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-1 order-2 lg:order-1 flex justify-center">
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-muted max-w-[320px] sm:max-w-[380px] lg:max-w-none">
                  <Image
                    src={smsPotwierdznieImg}
                    alt="SMS z przypomnieniem o wizycie w myjni wysłany automatycznie przez Carfect"
                    className="w-full h-auto"
                    sizes="(max-width: 640px) 320px, (max-width: 1024px) 380px, 500px"
                  />
                </div>
              </div>
              <div className="flex-1 order-1 lg:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                    Automatyczne potwierdzenia SMS
                  </h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  SMS-y o nadchodzących wizytach redukują liczbę klientów, którzy nie przyjeżdżają. Potwierdzenie rezerwacji, przypomnienie 24h przed wizytą – wszystko automatycznie. Klient może zmienić lub odwołać wizytę dwoma kliknięciami.
                </p>
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
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Link
                href="/funkcje/sms-przypomnienia"
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors group"
              >
                <MessageSquare className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">SMS przypomnienia</h3>
                <p className="text-sm text-muted-foreground mt-1">Automatyczne powiadomienia dla klientów</p>
              </Link>
              <Link
                href="/funkcje/zarzadzanie-zespolem"
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors group"
              >
                <Users className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Zarządzanie zespołem</h3>
                <p className="text-sm text-muted-foreground mt-1">Grafiki, urlopy i uprawnienia</p>
              </Link>
            </div>
          </div>
        </section>

        </article>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-sky-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">
              Wypróbuj kalendarz Carfect
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Zobacz jak łatwo zarządzać rezerwacjami w Twojej myjni lub studiu detailingu.30 dni za darmo, bez zobowiązań.
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

export default KalendarzRezerwacji;
