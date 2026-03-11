"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import StatBox from "@/components/case-study/StatBox";
import ImagePlaceholder from "@/components/case-study/ImagePlaceholder";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import caseStudy1 from "@/assets/studio-car-detailing-case-study-armcar-gdansk.jpg";
import caseStudy2 from "@/assets/studio-car-detailing-case-study-armcar-gdansk-2.webp";
import caseStudy3 from "@/assets/studio-car-detailing-case-study-armcar-gdansk-3.jpg";
import { MessageSquare, FileText, Users, RefreshCw, ArrowRight } from "lucide-react";
const CaseStudiesPage = () => {
  return <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        <article>
        {/* Hero Section */}
        <section className="pt-24 pb-10 md:pb-14 bg-gradient-to-b from-muted to-background bg-white py-[12px] my-0 md:pt-[128px]">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h1 id="jak-studio-arm-car-detailing-odzyskalo-10-godzin-tygodniowo" className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-center">
                Jak studio Arm Car Detailing odzyskało{" "}
                <span className="text-primary">10 godzin tygodniowo</span>{" "}
                i zwiększyło obroty dzięki Carfect
              </h1>
            </div>
          </div>
        </section>

        {/* O kliencie Section */}
        <section className="py-10 md:py-[57px] pt-[24px]">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 id="o-kliencie" className="text-xl md:text-3xl font-bold text-foreground mb-6">
                O kliencie
              </h2>
              <p className="text-foreground/80 leading-relaxed">
                
Arm Car Detailing & Wrapping to studio detailingowe z Gdańska. Firma dysponuje czterema stanowiskami: dwa przeznaczone na myjnię ręczną, jedno na detailing oraz jedno na oklejanie folią ochronną PPF. W ofercie znajduje się pełen zakres usług – od mycia premium, przez korekty lakieru i aplikację powłok ceramicznych, aż po wrapping i zmianę koloru karoserii.

Armen, właściciel studia, zna swój fach jak mało kto. Jednak sukces w branży przyniósł ze sobą niespodziewanego przeciwnika: chaos organizacyjny.
              </p>
            </div>
          </div>
        </section>

        {/* Wyzwanie Section */}
        <section className="py-10 md:py-14 pb-[24px] bg-white">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 id="wyzwanie-codziennosc-w-cieniu-papierowego-zeszytu" className="text-xl md:text-3xl font-bold text-foreground mb-6">
                Wyzwanie: Codzienność w cieniu papierowego zeszytu
              </h2>
              
              <Image src={caseStudy1} alt="Aplikacja folii ochronnej PPF na Mercedesa w studiu Arm Car Detailing" className="w-full rounded-2xl mb-6" />
              
              <p className="text-foreground/80 leading-relaxed mb-4">
                Przed wdrożeniem Carfect, sercem firmy był papierowy kalendarz i arkusz w Excelu. 
                Każda rezerwacja wymagała fizycznej obecności właściciela przy zeszycie lub dziesiątek 
                telefonów po godzinach pracy.
              </p>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Statystyki były nieubłagane: <strong className="text-foreground">co dziesiąty zapis 
                kończył się pomyłką w terminach</strong>, a <strong className="text-foreground">5-10% 
                klientów po prostu nie pojawiało się na wizycie</strong>.
              </p>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Nakładające się terminy, zgubione rezerwacje i nieczytelne, przekreślone wpisy w zeszycie były codziennością. Klienci twierdzili, że byli zapisani na inną godzinę niż ta w zeszycie, co prowadziło do konfliktów i utraty zaufania.
              </p>
              <p className="text-foreground/80 leading-relaxed mb-6">
                Brak dostępu do kalendarza poza biurem (zeszyt nie był przecież mobilny) utrudniał szybkie zapisywanie klientów czy dokonywanie zmian. Armen pracował po 50 godzin tygodniowo, czując narastające zmęczenie ciągłą koniecznością bycia „pod telefonem" przez całą dobę.
              </p>
              
              <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 bg-muted/30 rounded-r-lg">
                <p className="text-foreground italic text-lg">
                  „Musiałem być dostępny non-stop. Pół dnia spędzałem na telefonach zamiast rozwijać biznes. Bałem się, że stracę klienta, jeśli nie odbieram wieczorem."
                </p>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Rozwiązanie Section */}
        <section className="py-10 md:py-14 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 id="rozwiazanie-cyfrowa-rewolucja-w-trzy-dni" className="text-xl md:text-3xl font-bold text-foreground mb-6">
                Rozwiązanie: Cyfrowa rewolucja w trzy dni
              </h2>
              
              <Image src={caseStudy2} alt="Kalendarz Carfect na tablecie i telefonie w studiu detailingowym" className="w-full rounded-2xl mb-6" />
              
              <p className="text-foreground/80 leading-relaxed mb-4">
                Jak każdy właściciel biznesu, Armen miał wątpliwości przed podjęciem decyzji o zmianie systemu na w pełni cyfrowy.

Czy aplikacja nie będzie skomplikowana w codziennym użyciu? Czy będzie działać sprawnie na telefonie? Czy pracownicy – przyzwyczajeni do zeszytu – przestawią się na nową technologię? Czy system będzie naprawdę dostosowany do specyfiki myjni i detailingu?
              </p>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Zespół Carfect <strong className="text-foreground">w zaledwie trzy dni</strong> przeniósł 
                bazę klientów i cennik do aplikacji. Armen otrzymał gotowe narzędzie, które już od pierwszego dnia wyeliminowało błędy i ograniczyło puste przebiegi.
              </p>
              <p className="text-foreground/80 leading-relaxed">
                <strong className="text-foreground">Koszt systemu okazał się inwestycją</strong>, która 
                zwraca się już przy dwóch uratowanych rezerwacjach.
              </p>
            </div>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="py-10 md:py-14 bg-white">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 id="kluczowe-zmiany-w-liczbach" className="text-xl md:text-3xl font-bold text-foreground mb-2 text-left pb-[24px]">
                Kluczowe zmiany w liczbach
              </h2>
              
              
              <div className="grid grid-cols-3 gap-4">
                <StatBox value="40h" label="odzyskanego czasu" sublabel="miesięcznie" variant="primary" size="md" />
                <StatBox value="+10%" label="wzrost obrotów" sublabel="miesięcznie" variant="success" size="md" />
                <StatBox value="-90%" label="no-show i pomyłek" sublabel="w rezerwacjach" variant="success" size="md" />
              </div>
            </div>
          </div>
        </section>

        {/* Rezultaty Section */}
        <section className="py-10 md:py-14 bg-muted/30 pb-[24px]">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 id="rezultaty-oszczednosc-czasu-i-wzrost-rentownosci" className="text-xl md:text-3xl font-bold text-foreground mb-6">Rezultaty: oszczędność czasu i wzrost rentowności

            </h2>
              
              <p className="text-foreground/80 leading-relaxed mb-4">Carfect zmienił sposób działania studia. Funkcja ewidencji czasu pracy pozwoliła Armenowi zrozumieć, ile realnie trwają poszczególne usługi, co umożliwiło precyzyjną korektę cennika i wyższą rentowność.


              <strong className="text-foreground"> precyzyjną korektę cennika i wyższą rentowność</strong>.
              </p>
              


              <p className="text-foreground/80 leading-relaxed mb-6">
                Najbardziej spektakularnym efektem była jednak <strong className="text-foreground">niemal 
                całkowita eliminacja zjawiska „no-show"</strong> dzięki automatycznym przypomnieniom SMS 
                wysyłanym do klientów. Armen uruchomił również dostęp do publicznego kalendarza online, dzięki czemu już teraz jedna piąta klientów samodzielnie rezerwuje swoje wizyty.
              </p>
              
              <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 bg-background/50 rounded-r-lg">
                <p className="text-foreground italic text-lg">
                  „Wcześniej musiałem przeszukiwać zeszyt, żeby znaleźć numer do klienta. Teraz klikam w rezerwację i dzwonię bezpośrednio z aplikacji."
                </p>
              </blockquote>

              <Image src={caseStudy3} alt="Protokół przyjęcia pojazdu i kalendarz rezerwacji Carfect na tabletach" className="w-full rounded-2xl mb-6" />
              
              <p className="text-foreground/80 leading-relaxed mb-6">
                <strong className="text-foreground">Pracownicy zyskali autonomię</strong> – sami raportują postępy na tabletach, dodają dokumentację zdjęciową i wysyłają powiadomienia o odbiorze auta. Dzięki temu Armen może zarządzać studiem zdalnie, mając wgląd w każdą rezerwację i czas pracy zespołu bezpośrednio ze swojego telefonu, bez konieczności ciągłego dzwonienia do pracowników.

Co więcej, Armen nie musi już prowadzić oddzielnych arkuszy czasu pracy, dzwonić do pracowników aby sprawdzić dostępność, ani zgadywać ile kto przepracował w miesiącu. Wszystko dostępne jest z poziomu aplikacji Carfect.
              </p>

              <p className="text-foreground/80 leading-relaxed mb-6">
                <strong className="text-foreground">Jedną z opcji systemu, którą Armen bardzo ceni, jest generator ofert.</strong> Wcześniej stworzenie szczegółowej oferty detailingowej (np. korekta + ceramika + folia na reflektory) zajmowało mu średnio 30 minut. Teraz tworzy profesjonalne oferty <strong className="text-foreground">w kilka minut</strong> – nawet podczas swoich treningów na siłowni. System wysyła ofertę do klienta e-mailem. Szybkie odpowiedzi pozytywnie wpływają na skuteczność sprzedaży – klient niepotrzebnie nie czeka kilka dni na przedstawienie oferty, co zmniejsza ryzyko przejścia do konkurencji.
              </p>

              <p className="text-foreground/80 leading-relaxed mb-6">
                Dodatkowo Carfect zapewnia porządek: na liście ofert można łatwo sprawdzić, czy klient już się zapoznał z propozycją i na jakim etapie sprzedaży jesteśmy.
              </p>

              <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 bg-background/50 rounded-r-lg">
                <p className="text-foreground italic text-lg">
                  „Dzięki lepszej skuteczności ofert i praktycznie zerowym no-show zarabiam więcej, pracując mniej. Koszt aplikacji zwraca się wielokrotnie już w pierwszym miesiącu."
                </p>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Benefits List Section */}
        <section className="py-10 md:py-14 bg-white">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 id="co-zyskalo-studio" className="text-xl md:text-3xl font-bold text-foreground mb-6">
                Co zyskało studio?
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 id="automatyczne-przypomnienia-sms" className="font-semibold text-foreground mb-1">Automatyczne przypomnienia SMS</h3>
                    <p className="text-foreground/70 text-sm">
                      Koniec z zapominalskimi klientami – no-show spadło niemal do zera.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 id="generator-ofert" className="font-semibold text-foreground mb-1">Generator ofert</h3>
                    <p className="text-foreground/70 text-sm">
                      Tworzenie profesjonalnych ofert w kilka minut – w dowolnej chwili i z dowolnego urządzenia.          
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 id="autonomia-zespolu" className="font-semibold text-foreground mb-1">Autonomia zespołu</h3>
                    <p className="text-foreground/70 text-sm">
                      Pracownicy sami zarządzają statusami prac i raportują czas wykonania usług.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 id="powracalnosc-klientow" className="font-semibold text-foreground mb-1">Powracalność klientów</h3>
                    <p className="text-foreground/70 text-sm">
                      System automatycznie przypomina o przeglądach powłok, co zwiększyło liczbę powracających klientów .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        </article>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-primary/5 via-primary/3 to-sky-500/5">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 id="twoj-biznes-tez-moze-dzialac-bez-twojej-ciaglej-obecnosci" className="text-xl md:text-3xl font-bold text-foreground mb-4">
                Twój biznes też może działać bez Twojej ciągłej obecności
              </h2>
              <p className="text-foreground/70 mb-8">
                Jeśli masz dość zeszytów i uciekających rezerwacji – umów się na bezpłatną prezentację Carfect.
              </p>
              <Button asChild size="lg" className="text-base px-6 py-5 h-auto rounded-full">
                <Link href="/kontakt">
                  Umów bezpłatną prezentację
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>;};export default CaseStudiesPage;