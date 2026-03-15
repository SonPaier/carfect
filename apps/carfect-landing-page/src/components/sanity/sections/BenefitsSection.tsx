import Image from 'next/image';
import type { BenefitsSection as BenefitsSectionType } from '@/types/sanity';
import { urlFor } from '@/lib/sanity/image';

interface BenefitsSectionProps {
  data: BenefitsSectionType;
}

export default function BenefitsSection({ data }: BenefitsSectionProps) {
  const items = data.items || [];

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container px-4">
        {data.heading && (
          <header className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{data.heading}</h2>
          </header>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {items.map((item, index) => {
            const imageUrl = item.image ? urlFor(item.image).width(400).height(300).url() : null;
            return (
              <div key={index} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors">
                {imageUrl && (
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4">
                    <Image src={imageUrl} alt={item.title} width={400} height={300} className="w-full h-full object-cover" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                {item.description && <p className="text-muted-foreground text-sm">{item.description}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
