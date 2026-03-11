import { Mail, Phone } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const TrialCTA = () => {
  const { t } = useTranslation();
  const footer = t("footer");

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/5 via-sky-500/5 to-primary/10 rounded-3xl p-8 md:p-12 border border-primary/10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            Wypróbuj bezpłatnie przez 30 dni.
            <br />
            <span className="text-primary">Bez karty i zobowiązań!</span>
          </h2>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <a
              href={`mailto:${footer.email}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span className="font-medium">{footer.email}</span>
            </a>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a
                href={`tel:${footer.phone1.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">{footer.phone1}</span>
              </a>
              <a
                href={`tel:${footer.phone2.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">{footer.phone2}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrialCTA;
