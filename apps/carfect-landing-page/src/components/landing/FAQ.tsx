"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Jak wygląda wdrożenie?",
    answer:
      "Pomagamy od A do Z. Ustawiamy aplikację pod Twoje usługi i cennik, przenosimy bazę klientów z Excela, zeszytu czy innego systemu. Całość trwa 1–3 dni. Szkolenie dla Ciebie i zespołu to ok. 30 minut.",
  },
  {
    question: "Czy mogę wypróbować za darmo?",
    answer:
      "Tak — oferujemy 14 dni bezpłatnego okresu próbnego z pełnym dostępem do wszystkich funkcji. Bez podawania karty kredytowej, bez zobowiązań.",
  },
  {
    question: "Czy system działa na telefonie?",
    answer:
      "Tak. Carfect działa w przeglądarce na każdym urządzeniu — laptopie, tablecie i telefonie. Nie musisz instalować żadnej aplikacji. Tworzysz oferty, zarządzasz kalendarzem i sprawdzasz raporty z dowolnego miejsca.",
  },
  {
    question: "Czy moi pracownicy mogą korzystać z systemu?",
    answer:
      "Tak. Każdy pracownik dostaje własny widok na tablecie lub telefonie — widzi harmonogram, raportuje czas pracy i aktualizuje statusy zleceń. Ty masz pełną kontrolę nad tym, co kto widzi.",
  },
  {
    question: "Co się stanie z moimi danymi jeśli zrezygnuję?",
    answer:
      "Twoje dane należą do Ciebie. W każdej chwili możesz wyeksportować bazę klientów i historię rezerwacji. Po rezygnacji dane przechowujemy jeszcze 30 dni na wypadek, gdybyś chciał wrócić.",
  },
  {
    question: "Ile kosztuje SMS do klienta?",
    answer:
      "W cenie pakietu masz 100 SMS-ów miesięcznie. Kolejne kosztują 13 groszy netto za sztukę. Sam decydujesz, o czym powiadamiać klientów — przypomnienia o wizytach, potwierdzenia, zaproszenia na przegląd powłoki.",
  },
  {
    question: "Czy klienci muszą zakładać konto, żeby się zapisać?",
    answer:
      "Nie. Twój zewnętrzny kalendarz rezerwacji działa bez rejestracji — klient wybiera usługę, datę i godzinę, podaje imię i telefon. Żadnych kont, żadnych haseł.",
  },
  {
    question: "Jak działa integracja z Fakturownia / iFirma?",
    answer:
      "Po podłączeniu konta Fakturownia lub iFirma możesz wystawiać faktury bezpośrednio z poziomu Carfect — jednym kliknięciem przy zamykaniu zlecenia. Dane klienta i kwota uzupełniają się automatycznie.",
  },
  {
    question: "Czy mogę mieć kilka stanowisk?",
    answer:
      "Tak. Pierwsze stanowisko w cenie pakietu, każde kolejne to 49 zł/mies. System obsługuje do 20 stanowisk — myjnia, detailing, PPF, folia — każde z osobnym harmonogramem.",
  },
  {
    question: "Czy Carfect nadaje się do myjni ręcznej bez detailingu?",
    answer:
      "Jak najbardziej. Pakiet Myjnia jest stworzony właśnie pod myjnie ręczne — kalendarz, rezerwacje online, SMS-y, zarządzanie zespołem. Funkcje detailingowe (oferty, protokoły) są w pakiecie Detailing.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="py-20 md:py-32 bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Najczęściej zadawane pytania
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Odpowiedzi na pytania, które słyszymy najczęściej od właścicieli myjni i studiów detailingu
            </p>
          </header>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="bg-card rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-left"
                  >
                    <span className="text-base md:text-lg font-semibold text-foreground pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-96 pb-5 md:pb-6" : "max-h-0"
                    }`}
                  >
                    <p className="px-5 md:px-6 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
