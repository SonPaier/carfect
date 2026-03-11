"use client";

import { Clock } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const AnalitykaRaporty = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 flex items-center justify-center">
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-card rounded-2xl p-12 md:p-16 shadow-lg border-2 border-border text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Moduł dostępny wkrótce
                </h1>
                <p className="text-lg text-muted-foreground">
                  Pracujemy nad zaawansowanymi funkcjami analityki i raportowania. Wkrótce będziesz mógł podejmować jeszcze lepsze decyzje biznesowe w oparciu o dane.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AnalitykaRaporty;
