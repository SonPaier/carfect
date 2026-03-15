import Image from 'next/image';
import { Check } from 'lucide-react';
import type { FeatureDetailSection as FeatureDetailSectionType } from '@/types/sanity';
import { urlFor } from '@/lib/sanity/image';

interface FeatureDetailSectionProps {
  data: FeatureDetailSectionType;
}

export default function FeatureDetailSection({ data }: FeatureDetailSectionProps) {
  const imageUrl = data.image ? urlFor(data.image).width(800).height(600).url() : null;
  const isLeft = data.imagePosition === 'left';

  const bgClass = data.backgroundVariant === 'muted'
    ? 'bg-muted/30'
    : data.backgroundVariant === 'gradient'
      ? 'bg-gradient-to-b from-muted/30 to-background'
      : 'bg-background';

  return (
    <section className={`py-16 md:py-24 ${bgClass}`}>
      <div className="container px-4">
        <div className={`flex flex-col ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16 max-w-6xl mx-auto`}>
          {imageUrl && (
            <div className="w-full lg:w-1/2">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <Image src={imageUrl} alt={data.heading} width={800} height={600} className="w-full h-full object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
            </div>
          )}

          <div className={`w-full ${imageUrl ? 'lg:w-1/2' : ''}`}>
            {data.subheading && <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">{data.subheading}</p>}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{data.heading}</h2>
            {data.description && <p className="text-muted-foreground mb-6 leading-relaxed">{data.description}</p>}

            {data.bulletPoints && data.bulletPoints.length > 0 && (
              <ul className="space-y-3">
                {data.bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
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
      </div>
    </section>
  );
}
