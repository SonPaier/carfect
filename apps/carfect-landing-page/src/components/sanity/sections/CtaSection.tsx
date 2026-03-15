import Link from 'next/link';
import type { CtaSection as CtaSectionType } from '@/types/sanity';

interface CtaSectionProps {
  data: CtaSectionType;
}

export default function CtaSection({ data }: CtaSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/5 via-amber-500/5 to-primary/10 rounded-3xl p-8 md:p-12 border border-primary/10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            {data.heading}
          </h2>

          {data.subheading && (
            <p className="mt-4 text-lg text-muted-foreground">{data.subheading}</p>
          )}

          {data.ctaText && data.ctaLink && (
            <div className="mt-8">
              <Link
                href={data.ctaLink}
                className="inline-flex items-center justify-center h-14 px-8 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-300"
              >
                {data.ctaText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
