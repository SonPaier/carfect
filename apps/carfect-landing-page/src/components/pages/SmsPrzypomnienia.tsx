"use client";
import Link from "next/link";
import { MessageSquare, Bell, Check, Car, Sparkles, BarChart3, TrendingUp, Package, AlertTriangle } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

const SmsPrzypomnienia = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-sky-900 text-white py-32 md:py-48">
          <div className="container mx-auto px-4">
            <h1 id="automatyczne-sms-przypomnienia-dla-myjni-i-detailingu" className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl leading-tight">
              Automatyczne SMS Przypomnienia dla Myjni i Detailingu
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">
              Zmniejsz no-show o 80%. Przypomnienia o przeglądach powłoki. 100 SMS miesięcznie w cenie pakietu.
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
        {/* No-show Problem Section */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 id="problem-no-show-w-branzy-automotive" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-6">
              Problem no-show w branży automotive
            </h2>
            <p className="text-muted-foreground text-center max-w-3xl mx-auto text-lg mb-12">
              Nawet 15% rezerwacji w myjniach i studiach detailingu nie dochodzi do skutku. Puste stanowisko to utracone przychody i zmarnowany czas zespołu. Automatyczne przypomnienia SMS rozwiązują ten problem – klient pamięta o wizycie, a Ty nie musisz do niego dzwonić.
            </p>

            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 max-w-5xl mx-auto">
              <div className="flex-1">
                <div className="bg-destructive/10 rounded-2xl p-8 border border-destructive/20">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                    <h3 id="bez-przypomnien" className="text-xl font-semibold text-foreground">Bez przypomnień</h3>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">✕</span>
                      <span>Nawet 15% rezerwacji nie dochodzi do skutku</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">✕</span>
                      <span>Puste stanowiska = utracone przychody</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">✕</span>
                      <span>Ręczne dzwonienie do klientów zabiera czas</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-primary/10 rounded-2xl p-8 border border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Check className="w-8 h-8 text-primary" />
                    <h3 id="z-sms-carfect" className="text-xl font-semibold text-foreground">Z SMS Carfect</h3>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>Tylko 3-5% no-show dzięki przypomnieniom SMS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>Automatyczne przypomnienia bez Twojego udziału</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>Więcej czasu na rozwój biznesu</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SMS Types Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 id="rodzaje-sms-w-carfect" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Rodzaje SMS w Carfect
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
              {/* SMS Type 1 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 id="potwierdzenie-rezerwacji" className="text-xl font-semibold text-foreground mb-3">
                      Potwierdzenie rezerwacji
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Wysyłany automatycznie zaraz po utworzeniu rezerwacji. Klient dostaje datę, godzinę, adres i możliwość odwołania lub przełożenia wizyty w linku.
                    </p>
                    <div className="bg-muted rounded-lg p-4 text-sm">
                      <p className="text-muted-foreground italic">
                        "Dziękujemy za rezerwację w [Nazwa]. Czekamy na Ciebie 15.02 o 10:00. Adres: ul. Przykładowa 1. Odwołaj: odpisz ANULUJ"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMS Type 2 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 id="przypomnienie-24h-i-1h-przed-wizyta" className="text-xl font-semibold text-foreground mb-3">
                      Przypomnienie 24h i 1h przed wizytą
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      System sam wysyła przypomnienie 24h i opcjonalnie 1h przed wizytą.
                    </p>
                    <div className="bg-muted rounded-lg p-4 text-sm">
                      <p className="text-muted-foreground italic">
                        "Przypomnienie: jutro o 10:00 masz wizytę w [Nazwa]. Do zobaczenia! Pytania? Zadzwoń: 123 456 789"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMS Type 3 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 id="informacja-o-gotowym-pojezdzie" className="text-xl font-semibold text-foreground mb-3">
                      Informacja o gotowym pojeździe
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Po zakończeniu usługi wysyłasz klientowi SMS o gotowości pojazdu do odbioru – z godziną zamknięcia i adresem. Jedno kliknięcie w aplikacji.
                    </p>
                    <div className="bg-muted rounded-lg p-4 text-sm">
                      <p className="text-muted-foreground italic">
                        "Twój pojazd BMW X5 jest gotowy do odbioru! Czekamy do 18:00. [Nazwa], ul. Przykładowa 1"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMS Type 4 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 id="przypomnienie-o-odswiezeniu-powloki-i-serwisach" className="text-xl font-semibold text-foreground mb-3">
                      Przypomnienie o odświeżeniu powłoki i serwisach
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      System pamięta o klientach po usługach premium. W odpowiednich cyklach (np. co 6 miesięcy) sam wyśle zaproszenie na płatny przegląd powłoki ceramicznej czy serwis folii PPF – to stały, łatwy dochód.
                    </p>
                    <div className="bg-muted rounded-lg p-4 text-sm">
                      <p className="text-muted-foreground italic">
                        "Minęło 6 miesięcy od aplikacji powłoki ceramicznej. Czas na przegląd! Zarezerwuj: [link]"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 id="statystyki-i-efektywnosc" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Statystyki i efektywność
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Stat 1 */}
              <div className="bg-card rounded-2xl p-8 shadow-sm border border-border text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 id="80-procent" className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  80%
                </h3>
                <h4 className="text-xl font-semibold text-foreground mb-3">
                  mniej no-show dzięki przypomnieniom
                </h4>
                <p className="text-muted-foreground">
                  Klienci korzystający z automatycznych przypomnień SMS w Carfect odnotowują drastyczny spadek nieobecności – z kilkunastu procent do zaledwie kilku.
                </p>
              </div>

              {/* Stat 2 */}
              <div className="bg-card rounded-2xl p-8 shadow-sm border border-border text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h3 id="plus-35-procent" className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  +35%
                </h3>
                <h4 className="text-xl font-semibold text-foreground mb-3">
                  większy zysk z usług premium
                </h4>
                <p className="text-muted-foreground">
                  Automatyczne przypomnienia o przeglądach powłok i serwisach PPF generują stały dochód z powracających klientów. Odświeżanie powłoki to szybka i łatwa usługa – wystarczy, że klient o niej przypomni sobie dzięki SMS.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 id="100-sms-miesiecznie-w-cenie" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              100 SMS miesięcznie w cenie
            </h2>

            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-2xl p-8 md:p-12 border-2 border-primary shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 id="100-sms-w-kazdym-pakiecie" className="text-2xl font-bold text-foreground">
                      100 SMS w każdym pakiecie
                    </h3>
                    <p className="text-muted-foreground">
                      Zarówno Myjnia jak i Detailing
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-8">
                  W każdym pakiecie (Myjnia i Detailing) dostajesz 100 SMS-ów miesięcznie bez dodatkowych opłat. Wykorzystujesz je na potwierdzenia, przypomnienia i powiadomienia o gotowości pojazdu. W panelu widzisz ile SMS-ów zostało.
                </p>

                <div className="border-t border-border pt-8">
                  <h4 className="text-lg font-semibold text-foreground mb-4">
                    Po przekroczeniu limitu?
                  </h4>
                  <p className="text-muted-foreground">
                    Po wykorzystaniu 100 SMS-ów w danym miesiącu, każdy kolejny SMS kosztuje <span className="font-semibold text-foreground">12 groszy</span>. Bez ukrytych opłat, bez zobowiązań – płacisz tylko za to, co faktycznie wysyłasz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Features */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 id="powiazane-funkcje" className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Powiązane funkcje
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link
                href="/funkcje/kalendarz-rezerwacji"
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors group"
              >
                <Bell className="w-8 h-8 text-primary mb-3" />
                <h3 id="kalendarz-rezerwacji" className="font-semibold text-foreground group-hover:text-primary transition-colors">Kalendarz rezerwacji</h3>
                <p className="text-sm text-muted-foreground mt-1">Zarządzanie terminami i stanowiskami</p>
              </Link>
              <Link 
                href="/funkcje/zarzadzanie-zespolem"
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors group"
              >
                <MessageSquare className="w-8 h-8 text-primary mb-3" />
                <h3 id="zarzadzanie-zespolem" className="font-semibold text-foreground group-hover:text-primary transition-colors">Zarządzanie zespołem</h3>
                <p className="text-sm text-muted-foreground mt-1">Grafiki i uprawnienia pracowników</p>
              </Link>
              <Link
                href="/crm/crm-dla-myjni-samochodowych"
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors group"
              >
                <BarChart3 className="w-8 h-8 text-primary mb-3" />
                <h3 id="crm-dla-myjni" className="font-semibold text-foreground group-hover:text-primary transition-colors">CRM dla myjni</h3>
                <p className="text-sm text-muted-foreground mt-1">Pełne rozwiązanie dla myjni</p>
              </Link>
            </div>
          </div>
        </section>

        </article>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-sky-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 id="zacznij-wysylac-przypomnienia-juz-dzis" className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">
              Zacznij wysyłać przypomnienia już dziś
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              100 SMS miesięcznie w cenie pakietu. Zmniejsz no-show i zwiększ przychody z przeglądów.
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

export default SmsPrzypomnienia;
