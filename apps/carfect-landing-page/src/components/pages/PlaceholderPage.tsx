"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const PlaceholderPage = () => {
  const pathname = usePathname();
  const pageName = pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ")
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) || "Strona";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Wróć do strony głównej
          </Link>

          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🚧</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {pageName}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Ta strona jest w przygotowaniu. Wkrótce znajdziesz tutaj więcej informacji.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Wróć do strony głównej
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlaceholderPage;
