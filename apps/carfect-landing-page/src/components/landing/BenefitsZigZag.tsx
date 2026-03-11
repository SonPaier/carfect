import Image, { StaticImageData } from "next/image";
import { Check } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import benefit1 from "@/assets/kalendarz-rezerwacji-myjnia-reczna-korzysci-1.webp";
import benefit2 from "@/assets/kalendarz-rezerwacji-myjnia-reczna-korzysci-2.webp";
import benefit3 from "@/assets/kalendarz-rezerwacji-myjnia-reczna-korzysci-3.webp";
import benefit4 from "@/assets/kalendarz-rezerwacji-myjnia-reczna-korzysci-4.webp";
import benefit5 from "@/assets/kalendarz-rezerwacji-myjnia-reczna-korzysci-5.webp";
import benefit6 from "@/assets/kalendarz-rezerwacji-myjnia-reczna-korzysci-6.webp";

interface FeatureItem {
  title: string;
  subtitle: string;
  points: string[];
}

const BenefitsZigZag = () => {
  const { t } = useTranslation();
  const benefits = t("benefits");
  const features: FeatureItem[] = benefits.features || [];

  return (
    <section id="benefits" className="py-20 md:py-32 bg-white border-y border-gray-200">
      <div className="container px-4">
        {/* Header */}
        <header className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {benefits.sectionTitle}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {benefits.sectionSubtitle}
          </p>
        </header>

        {/* Zig-Zag Features */}
        <div className="space-y-16 md:space-y-24 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const isReversed = index % 2 === 1;
            const images: StaticImageData[] = [benefit1, benefit2, benefit3, benefit4, benefit5, benefit6];
            const currentImage = images[index];
            
            return (
              <div
                key={index}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-16`}
              >
                {/* Image */}
                <div className="w-full lg:w-1/2">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                    <Image
                      src={currentImage}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="w-full lg:w-1/2">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {feature.subtitle}
                  </p>
                  
                  {/* Checkmark list */}
                  <ul className="space-y-3">
                    {feature.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsZigZag;
