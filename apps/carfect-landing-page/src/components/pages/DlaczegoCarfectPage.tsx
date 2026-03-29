"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import {
  Check,
  X,
  Minus,
  ArrowRight,
  Phone,
  Mail,
} from "lucide-react";

const DetailerIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="16" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M12 44c0-8.837 7.163-16 16-16s16 8.837 16 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M36 30l4-4m0 0l4 4m-4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    <path d="M20 38h-2a2 2 0 00-2 2v4a2 2 0 002 2h20a2 2 0 002-2v-4a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" opacity="0.3" />
  </svg>
);

const MobileIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="6" width="28" height="44" rx="4" stroke="currentColor" strokeWidth="2" />
    <path d="M14 14h28M14 42h28" stroke="currentColor" strokeWidth="2" />
    <circle cx="28" cy="48" r="2" fill="currentColor" opacity="0.3" />
    <rect x="20" y="20" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <rect x="20" y="28" width="10" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <path d="M34 34l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SimpleIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="2" />
    <path d="M20 28l6 6 12-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M28 8v4M28 44v4M8 28h4M44 28h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </svg>
);

const SupportIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 24c0-11.046 8.954-20 20-20s20 8.954 20 20v8a4 4 0 01-4 4h-4v-12h4c0-8.837-7.163-16-16-16S12 15.163 12 24h4v12h-4a4 4 0 01-4-4v-8z" stroke="currentColor" strokeWidth="2" />
    <rect x="12" y="24" width="6" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
    <rect x="38" y="24" width="6" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M44 36v4a4 4 0 01-4 4h-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="28" cy="44" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const DlaczegoCarfectPage = () => {
  const differentiators = [
    {
      icon: DetailerIcon,
      title: "Stworzony PRZEZ detailerów DLA detailerów",
      description:
        "Rozumiemy specyfikę branży car detailngu i myjni ręcznych. System powstał we współpracy z doświadczonymi właścicielami myjni i studiów detailingu.",
    },
    {
      icon: MobileIcon,
      title: "Wszystko działa na telefonie",
      description:
        "Wszystkie akcje wykonasz wygodnie z telefonu, bez znaczenia czy to stworzenie oferty czy dodanie rezerwacji.",
    },
    {
      icon: SimpleIcon,
      title: "Prosty w użyciu",
      description:
        "Szkolenie trwa 30 minut. Intuicyjny interfejs sprawia, że działasz od pierwszego dnia bez czytania instrukcji.",
    },
    {
      icon: SupportIcon,
      title: "Polski support",
      description:
        "Pomoc przez telefon i email w języku polskim. Nie zostawiamy Cię samego z problemem.",
    },
  ];

  const byDetailersFeatures = [
    {
      title: "Rozumiemy specyfikę branży",
      description:
        "Wiemy, że detailing to nie tylko mycie auta. Protokoły przyjęcia, dokumentacja stanu pojazdu, zarządzanie długimi zleceniami – to wszystko mamy.",
    },
    {
      title: "Funkcje, których naprawdę potrzebujesz",
      description:
        "Każda funkcja w Carfect powstała na podstawie realnych potrzeb właścicieli myjni i studiów detailingu. Nic zbędnego.",
    },
    {
      title: "Bez zbędnych modułów",
      description:
        "Nie płacisz za funkcje do zarządzania hotelem czy restauracją. Płacisz tylko za to, czego używasz w swojej branży.",
    },
  ];

  const excelComparison = [
    { feature: "Rezerwacje online 24/7", carfect: true, excel: false },
    { feature: "Automatyczne przypomnienia SMS", carfect: true, excel: false },
    { feature: "Historia klientów i pojazdów", carfect: true, excel: "partial" },
    { feature: "Generator profesjonalnych ofert", carfect: true, excel: false },
    { feature: "Protokół przyjęcia ze zdjęciami", carfect: true, excel: false },
    { feature: "Widok dla pracowników na hali", carfect: true, excel: false },
    { feature: "Raporty i analityka", carfect: true, excel: "partial" },
    { feature: "Dostęp z telefonu", carfect: true, excel: "partial" },
    { feature: "Kopia zapasowa danych", carfect: true, excel: false },
  ];

  const crmComparison = [
    { feature: "Wszystko działa na telefonie", carfect: true, crm: false },
    { feature: "Kalendarz działa na żywo pomiędzy wieloma urządzeniami", carfect: true, crm: false },
    { feature: "Protokół przyjęcia pojazdu", carfect: true, crm: false },
    { feature: "Diagram uszkodzeń", carfect: true, crm: false },
    { feature: "Obsługa aut z placu", carfect: true, crm: false },
    { feature: "Widok na żywo dla hali", carfect: true, crm: false },
    { feature: "Generator ofert detailingowych", carfect: true, crm: false },
    { feature: "Dedykowany dla automotive", carfect: true, crm: false },
    { feature: "Polski support telefoniczny", carfect: true, crm: "partial" },
    { feature: "Szybkie wdrożenie (30 min)", carfect: true, crm: false },
    { feature: "Przypomnienia SMS na cykliczne usługi jak odświeżanie powłok ceramicznych", carfect: true, crm: false },
    { feature: "Wiele samochodów przypisanych do jednego klienta", carfect: true, crm: false },
    { feature: "Raportowanie czasu pracy pracowników prosto z tableta", carfect: true, crm: false },
    { feature: "Możliwość dodania różnych cen usług w zależności od rozmiaru pojazdu", carfect: true, crm: false },
  ];

  const renderComparisonIcon = (value: boolean | string) => {
    if (value === true) {
      return (
        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="w-5 h-5 text-green-600" />
        </div>
      );
    }
    if (value === "partial") {
      return (
        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <Minus className="w-5 h-5 text-yellow-600" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
        <X className="w-5 h-5 text-red-500" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-16 md:pt-48 md:pb-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 id="dlaczego-carfect-system-stworzony-z-doswiadczonymi-detailerami" className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                Dlaczego Carfect? – System Stworzony z Doświadczonymi Detailerami
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Poznaj powody, dla których właściciele myjni i studiów detailingu wybierają właśnie nas
              </p>
            </div>
          </div>
        </section>

        <article>
        {/* Differentiators Grid */}
        <section className="py-20 md:py-28 bg-section-alt">
          <div className="container px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 id="co-wyroznia-carfect-na-tle-konkurencji" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Co wyróżnia Carfect na tle konkurencji?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Nie jesteśmy kolejnym uniwersalnym CRM. Jesteśmy systemem stworzonym specjalnie dla Twojej branży.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {differentiators.map((item, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-8 text-center"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/5 text-primary mb-6">
                    <item.icon />
                  </div>
                  <h3 id={`differentiator-${index}`} className="text-lg font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* By Detailers Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <h2 id="stworzony-przez-detailerow-dla-detailerow" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Stworzony PRZEZ detailerów DLA detailerów
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  System powstał we współpracy z właścicielami myjni i studiów detailingu z całej Polski
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {byDetailersFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-2xl p-8"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-4 text-primary">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8 2.4-7.2-6-4.8h7.6L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 id={`by-detailers-feature-${index}`} className="text-xl font-bold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Simple to Use Section */}
        <section className="py-20 md:py-28 bg-section-alt">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 id="prosty-w-uzyciu" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Prosty w użyciu
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="bg-card rounded-2xl p-8">
                  <p className="text-4xl font-bold text-primary mb-2">30 min</p>
                  <h3 id="szkolenie" className="text-lg font-bold text-foreground mb-2">Szkolenie</h3>
                  <p className="text-sm text-muted-foreground">
                    Tyle zajmuje pełne wdrożenie. Bez tygodni nauki.
                  </p>
                </div>
                <div className="bg-card rounded-2xl p-8">
                  <p className="text-4xl font-bold text-primary mb-2">0</p>
                  <h3 id="instrukcji-do-czytania" className="text-lg font-bold text-foreground mb-2">Instrukcji do czytania</h3>
                  <p className="text-sm text-muted-foreground">
                    Intuicyjny interfejs nie wymaga czytania dokumentacji.
                  </p>
                </div>
                <div className="bg-card rounded-2xl p-8">
                  <p className="text-4xl font-bold text-primary mb-2">1</p>
                  <h3 id="dzien-do-startu" className="text-lg font-bold text-foreground mb-2">Dzień do startu</h3>
                  <p className="text-sm text-muted-foreground">
                    Działasz od pierwszego dnia. Bez czekania.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Polish Support Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 id="polski-support" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Polski support
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Nie zostawiamy Cię samego z problemem. Nasz zespół wsparcia mówi po polsku 
                i rozumie specyfikę Twojej branży. Jesteśmy otwarci na Twoje potrzeby. Po prostu dajesz nam znać czego potrzebujesz, a my sprawdzamy jak szybko możemy to dorzucić do aplikacji.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <div className="flex items-center justify-center gap-3 bg-card rounded-xl px-6 py-4">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Pomoc telefoniczna</span>
                </div>
                <div className="flex items-center justify-center gap-3 bg-card rounded-xl px-6 py-4">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Wsparcie email</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison: Carfect vs Excel */}
        <section className="py-20 md:py-28 bg-section-alt">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 id="carfect-vs-excel-zeszyt" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Carfect vs Excel / Zeszyt
                </h2>
                <p className="text-lg text-muted-foreground">
                  Zobacz, co zyskujesz przechodząc z ręcznego zarządzania na Carfect
                </p>
              </div>

              <div className="bg-card rounded-2xl overflow-hidden">
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 font-semibold text-sm">
                  <div className="text-foreground">Funkcja</div>
                  <div className="text-center text-primary">Carfect</div>
                  <div className="text-center text-muted-foreground">Excel / Zeszyt</div>
                </div>
                {excelComparison.map((row, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-3 gap-4 p-4 items-center ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/30"
                    }`}
                  >
                    <div className="text-sm text-foreground">{row.feature}</div>
                    <div className="flex justify-center">
                      {renderComparisonIcon(row.carfect)}
                    </div>
                    <div className="flex justify-center">
                      {renderComparisonIcon(row.excel)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison: Carfect vs Universal CRM */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 id="carfect-vs-uniwersalne-crm" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Carfect vs Uniwersalne CRM
                </h2>
                <p className="text-lg text-muted-foreground">
                  Dlaczego dedykowany system dla myjni ręcznych i studiów detailingu jest lepszy niż uniwersalne rozwiązanie
                </p>
              </div>

              <div className="bg-card rounded-2xl overflow-hidden">
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 font-semibold text-sm">
                  <div className="text-foreground">Funkcja</div>
                  <div className="text-center text-primary">Carfect</div>
                  <div className="text-center text-muted-foreground">Uniwersalne CRM</div>
                </div>
                {crmComparison.map((row, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-3 gap-4 p-4 items-center ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/30"
                    }`}
                  >
                    <div className="text-sm text-foreground">{row.feature}</div>
                    <div className="flex justify-center">
                      {renderComparisonIcon(row.carfect)}
                    </div>
                    <div className="flex justify-center">
                      {renderComparisonIcon(row.crm)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        </article>

        {/* CTA Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 to-background">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Przekonaj się sam
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Wypróbuj Carfect za darmo przez 30 dni. Bez karty, bez zobowiązań.
              </p>
              <a
                href="/#hero"
                className="inline-flex h-14 px-8 items-center justify-center gap-2 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Umów prezentację
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DlaczegoCarfectPage;
