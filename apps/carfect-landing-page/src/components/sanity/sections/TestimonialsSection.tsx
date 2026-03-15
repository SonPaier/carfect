import Image from 'next/image';
import { Star } from 'lucide-react';
import type { TestimonialsSection as TestimonialsSectionType } from '@/types/sanity';
import { urlFor } from '@/lib/sanity/image';

interface TestimonialsSectionProps {
  data: TestimonialsSectionType;
}

export default function TestimonialsSection({ data }: TestimonialsSectionProps) {
  const testimonials = data.testimonials || [];

  return (
    <section id="testimonials" className="py-20 md:py-32 bg-white">
      <div className="container px-4">
        {data.heading && (
          <header className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{data.heading}</h2>
          </header>
        )}

        <div className={`max-w-4xl mx-auto ${testimonials.length === 1 ? '' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'}`}>
          {testimonials.map((testimonial, index) => {
            const logoUrl = testimonial.logo ? urlFor(testimonial.logo).width(128).url() : null;

            return (
              <article key={index} className={`p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors ${testimonials.length === 1 ? 'w-full' : ''}`}>
                {testimonial.rating && (
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < testimonial.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                )}

                <blockquote className={`text-foreground leading-relaxed mb-6 ${testimonials.length === 1 ? 'text-lg' : ''}`}>
                  &ldquo;{testimonial.text}&rdquo;
                </blockquote>

                <footer className="flex items-center gap-4">
                  {logoUrl ? (
                    <Image src={logoUrl} alt={`${testimonial.company} logo`} width={128} height={64} className="h-16 w-auto object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {testimonial.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                  )}
                  <div>
                    <cite className="not-italic font-semibold text-foreground block">{testimonial.name}</cite>
                    {testimonial.companyUrl ? (
                      <a href={testimonial.companyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                        {testimonial.company}
                      </a>
                    ) : testimonial.company ? (
                      <span className="text-sm text-muted-foreground">{testimonial.company}</span>
                    ) : null}
                    {testimonial.location && <span className="text-sm text-muted-foreground block">{testimonial.location}</span>}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
