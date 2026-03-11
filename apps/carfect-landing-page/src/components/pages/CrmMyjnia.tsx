"use client";
import Link from "next/link";
import { Calendar, Users, MessageSquare, BarChart3, Monitor, Clock, Car } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import kalendarzMobile from "@/assets/crm-kalendarz-mobile.png";
import widokHala from "@/assets/crm-studio-detailing-myjnia-reczna.webp";
import smsPrzypomnienie from "@/assets/crm-sms-przypomnienie.jpg";
const CrmMyjnia = () => {
  return <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-sky-900 text-white py-32 md:py-48">
          <div className="container mx-auto px-4">
            <h1 id="crm-dla-recznej-myjni-samochodowej" className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl leading-tight">CRM dla ręcznej myjni samochodowej</h1>
            
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">System CRM dedykowany dla myjni ręcznych. Rezerwacje, kalendarz, baza klientów, przypomnienia SMS, raportowanie czasu pracy.</p>

            <div className="mt-8">
              <Button asChild className="h-12 px-8 text-base font-semibold rounded-xl bg-white text-primary hover:bg-white/90">
                <Link href="/umow-prezentacje">Umów prezentację</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-white/60">
              Od 89 zł/msc • Bez zobowiązań • 30 dni za darmo
            </p>
          </div>
        </section>

        <article>
        {/* Why CRM Section */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 id="dlaczego-myjnie-reczne-potrzebuja-dedykowanego-crm" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-6">
              Dlaczego myjnie ręczne potrzebują dedykowanego CRM?
            </h2>
            <p className="text-muted-foreground text-center max-w-3xl mx-auto text-lg">Prowadzenie myjni to nie tylko mycie aut – to walka o optymalne obłożenie grafiku. Uniwersalne programy do zarządzania czy arkusze w Excelu nie rozumieją specyfiki Twojej pracy. Dedykowany system CRM zamienia chaos w uporządkowaną maszynę do zarabiania pieniędzy.</p>
          </div>
        </section>

        {/* Challenges Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 id="najwieksze-wyzwania-wlascicieli-myjni" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Największe wyzwania właścicieli myjni
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Challenge 1 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 id="ciagle-telefony-w-trakcie-pracy" className="text-xl font-semibold text-foreground mb-3">Ciągłe telefony w trakcie pracy</h3>
                    <p className="text-muted-foreground">Praca z lancą w ręku i ciągłe odbieranie rezerwacji to przepis na błędy. Nieodebrane połączenie to klient, który pojedzie do konkurencji.</p>
                  </div>
                </div>
              </div>

              {/* Challenge 2 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 id="klienci-zapominaja-o-umowionych-wizytach" className="text-xl font-semibold text-foreground mb-3">
                      Klienci zapominają o umówionych wizytach
                    </h3>
                    <p className="text-muted-foreground">Klient nie przyjeżdża, nie odbiera i nie uprzedza. Ty zostajesz z opłaconym pracownikiem, wolnym stanowiskiem i stratą w portfelu.</p>
                  </div>
                </div>
              </div>

              {/* Challenge 3 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <Car className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 id="brak-historii-mycia-pojazdu" className="text-xl font-semibold text-foreground mb-3">
                      Brak historii mycia pojazdu
                    </h3>
                    <p className="text-muted-foreground">Brak bazy danych to zgadywanie przy każdym aucie. Tracisz szansę na dodatkową sprzedaż, bo nie wiesz, czego klient potrzebuje.</p>
                  </div>
                </div>
              </div>

              {/* Challenge 4 */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 id="trudnosci-z-organizacja-pracy-stanowisk" className="text-xl font-semibold text-foreground mb-3">
                      Trudności z organizacją pracy stanowisk
                    </h3>
                    <p className="text-muted-foreground">Zapisy na kartkach lub w głowie prowadzą do błędów w rezerwacjach. Chaos na stanowiskach frustruje pracowników, klientów i psuje Twoją opinię.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Section with Images */}
        <section className="py-16 md:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 id="jak-carfect-pomaga-zarzadzac-myjnia" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Jak Carfect pomaga zarządzać myjnią?
            </h2>

            {/* Solution 1 - Image Right */}
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-16 lg:mb-20">
              <div className="flex-1 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <h3 id="kalendarz-rezerwacji-dla-wielu-stanowisk" className="text-xl md:text-2xl font-semibold text-foreground">Kalendarz rezerwacji dla wielu stanowisk</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">Widzisz wszystkie stanowiska na jednym ekranie. Od razu wiesz, gdzie jest wolne. Koniec z bazgraniem w zeszycie i nakładaniem się aut.</p>
              </div>
              <div className="flex-1 order-1 lg:order-2">
                <div className="bg-muted rounded-2xl overflow-hidden border border-border flex items-center justify-center p-4">
                  <Image src={kalendarzMobile} alt="Kalendarz rezerwacji myjni na telefonie z podziałem na stanowiska" className="max-h-[500px] w-auto rounded-xl" sizes="(max-width: 1024px) 100vw, 50vw" />
                </div>
              </div>
            </div>

            {/* Solution 2 - Image Left */}
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-16 lg:mb-20">
              <div className="flex-1">
                <div className="rounded-2xl overflow-hidden border border-border">
                  <Image src={widokHala} alt="Pracownicy myjni korzystający z tabletu na hali" className="w-full h-auto" sizes="(max-width: 1024px) 100vw, 50vw" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <h3 id="widok-na-zywo-dla-pracownikow-na-hali" className="text-xl md:text-2xl font-semibold text-foreground">
                    Widok na żywo dla pracowników na hali
                  </h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">Monitor lub tablet na hali lub w biurze by każdy pracownik widział grafik. Koniec z ciągłym pytaniem managera „co teraz wjeżdża?”. Ty decydujesz, które detale rezerwacji widzi pracownik.</p>
              </div>
            </div>

            {/* Solution 3 - Image Right */}
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-16 lg:mb-20">
              <div className="flex-1 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <h3 id="automatyczne-sms-przypomnienia" className="text-xl md:text-2xl font-semibold text-foreground">
                    Automatyczne SMS przypomnienia
                  </h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">System sam wyśle SMS-a danymi wizyty i nazwą Twojej myjni do klienta dzień wcześniej i godziny przed myciem. Koniec z „zapominalskimi” i pustymi stanowiskami. Ty pracujesz, a telefon pilnuje Twoich pieniędzy.</p>
              </div>
              <div className="flex-1 order-1 lg:order-2">
                <div className="bg-muted rounded-2xl overflow-hidden border border-border flex items-center justify-center p-4">
                  <Image src={smsPrzypomnienie} alt="SMS przypomnienie o wizycie w myjni z systemu Carfect" className="max-h-[500px] w-auto rounded-xl" sizes="(max-width: 1024px) 100vw, 50vw" />
                </div>
              </div>
            </div>

            {/* Solution 4 - Full Width */}
            <div className="bg-card rounded-2xl p-8 md:p-12 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h3 id="raportowanie-czasu-pracy" className="text-xl md:text-2xl font-semibold text-foreground">Raportowanie czasu pracy</h3>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">Pracownicy w prosty sposób raportują czas pracy na tablecie lub telefonie. Mogą podać czas pracy, lub klikać START / STOP, jeśli zależy Ci na dokładnym raportowaniu czasu przez pracowników.</p>
            </div>
          </div>
        </section>

        </article>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-sky-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 id="gotowy-by-usprawnic-swoja-myjnie" className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">
              Gotowy, by usprawnić swoją myjnię?
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">Dołącz do wielu myjni, które już korzystają z Carfect. Zacznij bezpłatny okres próbny już dziś.</p>
            <Button asChild className="h-12 px-8 text-base font-semibold rounded-xl bg-white text-primary hover:bg-white/90">
              <Link href="/umow-prezentacje">Umów bezpłatną prezentację</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>;
};
export default CrmMyjnia;