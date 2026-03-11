"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Image from "next/image";
import { z } from "zod";
import heroBg from "@/assets/car-detailing-myjnia-reczna-hero.webp";
const contactSchema = z.object({
  contact: z.string().refine(val => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{9}$/;
    return emailRegex.test(val) || phoneRegex.test(val.replace(/\s/g, ""));
  }, {
    message: "Podaj poprawny email lub numer telefonu (9 cyfr)"
  })
});
const Hero = () => {
  const {
    t
  } = useTranslation();
  const hero = t("hero");
  const {
    toast
  } = useToast();
  const [contact, setContact] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse({
      contact
    });
    if (!result.success) {
      toast({
        title: "Błąd",
        description: hero.validationError,
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('send-contact-email', {
        body: {
          contact
        }
      });
      if (error) throw error;
      toast({
        title: "Sukces!",
        description: hero.success
      });
      setContact("");
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Błąd",
        description: hero.error,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <section id="hero" className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Background image with 16:10 aspect ratio preserved */}
      <div className="absolute inset-0 w-full h-full">
        <Image src={heroBg} alt="" className="w-full h-full object-cover object-center" fill priority sizes="100vw" />
      </div>
      {/* Dark blue overlay with multiply blend to enhance photo colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/70 to-sky-900/80 mix-blend-multiply" />
      
      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-tight">
            {hero.title}
          </h1>
          
          <p className="mt-6 md:mt-8 text-lg md:text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-medium">
            {hero.subtitle}
          </p>
          
          <form onSubmit={handleSubmit} className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <Input type="text" placeholder={hero.placeholder} value={contact} onChange={e => setContact(e.target.value)} className="h-14 px-6 text-base rounded-xl border-border bg-card text-foreground focus:border-primary" />
            <Button type="submit" disabled={isLoading} className="h-14 px-8 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-sky-500 hover:from-primary/90 hover:to-sky-500/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
              {isLoading ? "Wysyłanie..." : hero.cta}
            </Button>
          </form>
        </div>
      </div>
    </section>;
};
export default Hero;