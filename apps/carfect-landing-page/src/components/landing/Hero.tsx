"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { z } from "zod";

import appDesktop from "@/assets/app-desktop.png";
import appMobile from "@/assets/studio-detailing-myjnia-reczna-kalendarz-rezerwacji-telefon.webp";

const contactSchema = z.object({
  contact: z.string().refine(
    (val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\d{9}$/;
      return emailRegex.test(val) || phoneRegex.test(val.replace(/\s/g, ""));
    },
    { message: "Podaj poprawny email lub numer telefonu (9 cyfr)" }
  ),
});

const Hero = () => {
  const { t } = useTranslation();
  const hero = t("hero");
  const { toast } = useToast();
  const [contact, setContact] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse({ contact });
    if (!result.success) {
      toast({
        title: "Błąd",
        description: hero.validationError,
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({ title: "Sukces!", description: hero.success });
      setContact("");
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Błąd",
        description: hero.error,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="hero" className="relative min-h-[100vh] flex flex-col overflow-hidden bg-[#0c0a09]">
      {/* Background effects */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 20%, hsl(45 100% 32% / 0.12), transparent),
            radial-gradient(ellipse 60% 40% at 30% 50%, hsl(45 80% 20% / 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 70% 40%, hsl(30 60% 15% / 0.06), transparent)
          `,
        }}
      />
      {/* Diagonal streaks */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -35deg,
            transparent,
            transparent 80px,
            rgba(255,255,255,0.5) 80px,
            rgba(255,255,255,0.5) 81px,
            transparent 81px,
            transparent 200px
          )`,
        }}
      />
      {/* Secondary streaks — opposite direction, wider spacing */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            35deg,
            transparent,
            transparent 120px,
            rgba(255,255,255,0.6) 120px,
            rgba(255,255,255,0.6) 122px,
            transparent 122px,
            transparent 300px
          )`,
        }}
      />

      {/* Content — centered */}
      <div className="relative z-10 flex-1 flex items-center justify-center pt-24 pb-0 md:pt-32 md:pb-0">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Skup się na detailingu,{" "}
              <span className="text-primary">chaos zostaw nam.</span>
            </h1>

            <p className="mt-6 md:mt-8 text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              {hero.subtitle}
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <Input
                type="text"
                placeholder={hero.placeholder}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="h-12 px-5 text-base rounded-lg bg-white/10 text-white placeholder:text-white/40 focus:bg-white/15"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 px-6 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                {isLoading ? "Wysyłanie..." : hero.cta}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* App mockups — peeking from bottom */}
      <div className="relative z-10 mt-8 md:mt-12">
        <div className="max-w-5xl mx-auto px-4 relative">
          {/* Desktop — main, centered */}
          <div
            className="relative mx-auto w-[85%] rounded-t-xl overflow-hidden"
            style={{
              maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
            }}
          >
            <Image
              src={appDesktop}
              alt="Carfect — kalendarz rezerwacji"
              className="w-full h-auto"
              sizes="(max-width: 1024px) 90vw, 800px"
              priority
              loading="eager"
              fetchPriority="high"
            />
          </div>

          {/* Mobile — overlapping right side */}
          <div
            className="absolute -right-2 md:right-4 bottom-4 w-[25%] md:w-[20%] rounded-t-2xl overflow-hidden hidden sm:block"
            style={{
              maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
            }}
          >
            <Image
              src={appMobile}
              alt="Carfect — kalendarz na telefonie"
              className="w-full h-auto"
              sizes="200px"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
