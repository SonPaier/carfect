"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import SubpageHero from "@/components/landing/SubpageHero";

const WashIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 36l6-16h36l6 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <rect x="6" y="36" width="52" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="50" r="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="46" cy="50" r="5" stroke="currentColor" strokeWidth="2" />
    <path d="M20 28h24" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <path d="M14 12c2-4 6-4 8 0s6 4 8 0s6-4 8 0s6 4 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </svg>
);

const DetailingIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2" />
    <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    <circle cx="32" cy="32" r="6" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
    <path d="M32 10v6M32 48v6M10 32h6M48 32h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <path d="M18 18l4 4M42 42l4 4M18 46l4-4M42 22l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
  </svg>
);

const solutions = [
  {
    icon: WashIcon,
    title: "CRM dla myjni samochodowych",
    description:
      "System stworzony specjalnie dla myjni ręcznych. Kalendarz z widokiem na stanowiska, rezerwacje online 24/7, automatyczne SMS-y, obsługa aut z placu i zarządzanie zespołem. Wszystko czego potrzebujesz, żeby przestać prowadzić myjnię na kartce.",
    href: "/crm/crm-dla-myjni-samochodowych",
    price: "od 89 zł / mies.",
  },
  {
    icon: DetailingIcon,
    title: "CRM dla studia detailingu",
    description:
      "Wszystko z pakietu Myjnia, plus narzędzia dedykowane dla detailingu: generator profesjonalnych ofert, protokół przyjęcia pojazdu ze zdjęciami i diagramem uszkodzeń, automatyczne przypomnienia o przeglądach powłok ceramicznych i wsparcie sprzedaży.",
    href: "/crm/crm-dla-studia-detailingu",
    price: "od 139 zł / mies.",
  },
];

const CrmPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <SubpageHero
          breadcrumbs={[
            { name: "Strona główna", href: "/" },
            { name: "CRM", href: "/crm" },
          ]}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl leading-tight">
            CRM dla myjni i detailingu
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">
            Wybierz rozwiązanie dopasowane do Twojego biznesu. Myjnia ręczna czy studio detailingowe — mamy system stworzony z myślą o Tobie.
          </p>
        </SubpageHero>

        <section className="py-20 md:py-28">
          <div className="container px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {solutions.map((solution, index) => (
                <Link
                  key={index}
                  href={solution.href}
                  className="bg-card rounded-2xl p-8 md:p-10 group flex flex-col"
                >
                  <div className="w-20 h-20 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6">
                    <solution.icon />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {solution.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
                    {solution.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {solution.price}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Dowiedz się więcej
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CrmPage;
