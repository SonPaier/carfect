import { Mail, Phone } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const TrialCTA = () => {
  const { t } = useTranslation();
  const footer = t("footer");

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* CARFECT watermark text */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none" aria-hidden="true">
        <span
          className="text-[12rem] md:text-[18rem] lg:text-[22rem] font-black tracking-widest text-foreground/[0.02] whitespace-nowrap"
          style={{ transform: "rotate(-12deg)" }}
        >
          CARFECT
        </span>
      </div>
      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            Wypróbuj bezpłatnie przez 14 dni.
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
