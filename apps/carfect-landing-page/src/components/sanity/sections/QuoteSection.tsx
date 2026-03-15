import { Quote } from 'lucide-react';
import type { QuoteSection as QuoteSectionType } from '@/types/sanity';

interface QuoteSectionProps {
  data: QuoteSectionType;
}

export default function QuoteSection({ data }: QuoteSectionProps) {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Quote className="w-10 h-10 text-primary/30 mx-auto mb-6" />
          <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed italic">
            &ldquo;{data.text}&rdquo;
          </blockquote>
          {(data.author || data.role || data.company) && (
            <footer className="mt-6">
              {data.author && <cite className="not-italic font-semibold text-foreground block">{data.author}</cite>}
              {(data.role || data.company) && (
                <span className="text-sm text-muted-foreground">
                  {[data.role, data.company].filter(Boolean).join(', ')}
                </span>
              )}
            </footer>
          )}
        </div>
      </div>
    </section>
  );
}
