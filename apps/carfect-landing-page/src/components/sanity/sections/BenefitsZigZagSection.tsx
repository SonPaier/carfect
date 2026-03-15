import Image from 'next/image';
import { Check } from 'lucide-react';
import type { BenefitsZigZagSection as BenefitsZigZagSectionType } from '@/types/sanity';
import { urlFor } from '@/lib/sanity/image';

interface BenefitsZigZagSectionProps {
  data: BenefitsZigZagSectionType;
}

export default function BenefitsZigZagSection({ data }: BenefitsZigZagSectionProps) {
  const items = data.items || [];

  return (
    <section id="benefits" className="py-20 md:py-32 bg-white border-y border-gray-200">
      <div className="container px-4">
        <header className="text-center mb-16 md:mb-24">
          {data.sectionTitle && (
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{data.sectionTitle}</h2>
          )}
          {data.sectionSubtitle && (
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{data.sectionSubtitle}</p>
          )}
        </header>

        <div className="space-y-16 md:space-y-24 max-w-6xl mx-auto">
          {items.map((item, index) => {
            const isReversed = index % 2 === 1;
            const imageUrl = item.image ? urlFor(item.image).width(800).height(600).url() : null;

            return (
              <div
                key={index}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-16`}
              >
                {imageUrl && (
                  <div className="w-full lg:w-1/2">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        width={800}
                        height={600}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                )}

                <div className={`w-full ${imageUrl ? 'lg:w-1/2' : ''}`}>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{item.title}</h3>
                  {item.subtitle && <p className="text-muted-foreground mb-6">{item.subtitle}</p>}
                  {item.points && item.points.length > 0 && (
                    <ul className="space-y-3">
                      {item.points.map((point, pointIndex) => (
                        <li key={pointIndex} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
