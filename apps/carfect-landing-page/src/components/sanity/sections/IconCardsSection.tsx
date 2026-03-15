import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import type { IconCardsSection as IconCardsSectionType } from '@/types/sanity';

interface IconCardsSectionProps {
  data: IconCardsSectionType;
}

function getIcon(name?: string) {
  if (!name) return null;
  // Convert kebab-case to PascalCase
  const pascal = name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
  const Icon = (LucideIcons as Record<string, any>)[pascal];
  return Icon || null;
}

export default function IconCardsSection({ data }: IconCardsSectionProps) {
  const items = data.items || [];
  const cols = data.columns || 3;
  const gridClass = cols === 2 ? 'md:grid-cols-2' : cols === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3';

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        {(data.heading || data.subheading) && (
          <header className="text-center mb-12 md:mb-16">
            {data.heading && <h2 className="text-3xl md:text-4xl font-bold text-foreground">{data.heading}</h2>}
            {data.subheading && <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{data.subheading}</p>}
          </header>
        )}

        <div className={`grid ${gridClass} gap-6 md:gap-8 max-w-6xl mx-auto`}>
          {items.map((item, index) => {
            const Icon = getIcon(item.icon);
            const content = (
              <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors h-full">
                {Icon && (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                )}
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                {item.description && <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>}
              </div>
            );

            if (item.link) {
              return <Link key={index} href={item.link} className="block">{content}</Link>;
            }
            return <div key={index}>{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
