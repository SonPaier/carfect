'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { z } from 'zod';
import type { HeroSection as HeroSectionType, SiteSettings } from '@/types/sanity';
import { urlFor } from '@/lib/sanity/image';

const contactSchema = z.object({
  contact: z.string().refine(
    (val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\d{9}$/;
      return emailRegex.test(val) || phoneRegex.test(val.replace(/\s/g, ''));
    },
    { message: 'Podaj poprawny email lub numer telefonu (9 cyfr)' },
  ),
});

interface HeroSectionProps {
  data: HeroSectionType;
  settings?: SiteSettings;
}

export default function HeroSection({ data }: HeroSectionProps) {
  const { toast } = useToast();
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse({ contact });
    if (!result.success) {
      toast({ title: 'Błąd', description: 'Podaj poprawny email lub numer telefonu', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({ title: 'Sukces!', description: 'Wkrótce się z Tobą skontaktujemy!' });
      setContact('');
    } catch {
      toast({ title: 'Błąd', description: 'Wystąpił błąd. Spróbuj ponownie.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const bgImageUrl = data.backgroundImage ? urlFor(data.backgroundImage).width(1920).quality(80).url() : null;

  return (
    <section id="hero" className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {bgImageUrl && (
        <div className="absolute inset-0 w-full h-full">
          <Image src={bgImageUrl} alt="" className="w-full h-full object-cover object-center" fill priority sizes="100vw" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/90 via-yellow-950/80 to-stone-900/90 mix-blend-multiply" />

      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-tight">
            {data.heading}
          </h1>

          {data.subheading && (
            <p className="mt-6 md:mt-8 text-lg md:text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-medium">
              {data.subheading}
            </p>
          )}

          {data.priceNote && (
            <p className="mt-4 text-sm text-white/60">{data.priceNote}</p>
          )}

          <form onSubmit={handleSubmit} className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <Input
              type="text"
              placeholder="Email lub numer telefonu"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="h-14 px-6 text-base rounded-xl border-border bg-card text-foreground focus:border-primary"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 px-8 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              {isLoading ? 'Wysyłanie...' : data.ctaText || 'Umów prezentację'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
