import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { RelatedFeaturesSection as RelatedFeaturesSectionType } from '@/types/sanity';

interface RelatedFeaturesSectionProps {
  data: RelatedFeaturesSectionType;
}

function getIcon(name?: string) {
  if (!name) return null;
  const pascal = name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
  const Icon = (LucideIcons as Record<string, any>)[pascal];
  return Icon || null;
}

export default function RelatedFeaturesSection({ data }: RelatedFeaturesSectionProps) {
  const items = data.items || [];

  return (
    <section className="py-16 md:py-24 bg-muted/20 border-t border-border">
      <div className="container px-4">
        {data.heading && (
          <header className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{data.heading}</h2>
          </header>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {items.map((item, index) => {
            const Icon = getIcon(item.icon);
            return (
              <Link key={index} href={item.href} className="group p-6 rounded-2xl bg-background border border-border hover:border-primary/20 transition-all hover:shadow-md">
                <div className="flex items-start gap-4">
                  {Icon && (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-1">{item.title}</h3>
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
