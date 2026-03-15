import * as LucideIcons from 'lucide-react';
import type { MetricsSection as MetricsSectionType } from '@/types/sanity';

interface MetricsSectionProps {
  data: MetricsSectionType;
}

function getIcon(name?: string) {
  if (!name) return null;
  const pascal = name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
  const Icon = (LucideIcons as Record<string, any>)[pascal];
  return Icon || null;
}

export default function MetricsSection({ data }: MetricsSectionProps) {
  const items = data.items || [];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        {(data.heading || data.subheading) && (
          <header className="text-center mb-12 md:mb-16">
            {data.heading && <h2 className="text-3xl md:text-4xl font-bold text-foreground">{data.heading}</h2>}
            {data.subheading && <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{data.subheading}</p>}
          </header>
        )}

        <div className={`grid ${items.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-8 max-w-5xl mx-auto`}>
          {items.map((item, index) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={index} className="text-center p-6 rounded-2xl bg-background border border-border shadow-sm">
                {Icon && (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                )}
                <p className="text-4xl md:text-5xl font-bold text-primary mb-2">{item.value}</p>
                <p className="text-foreground font-semibold">{item.label}</p>
                {item.sublabel && <p className="text-sm text-muted-foreground mt-1">{item.sublabel}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
