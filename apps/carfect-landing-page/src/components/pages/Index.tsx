"use client";

import { useRef } from "react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import AppPreview from "@/components/landing/AppPreview";
import BenefitsZigZag from "@/components/landing/BenefitsZigZag";
import Testimonials from "@/components/landing/Testimonials";
import TrialCTA from "@/components/landing/TrialCTA";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import ScrollFadeIn from "@/components/landing/ScrollFadeIn";

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  const scrollToContact = () => {
    const footer = document.querySelector("#footer");
    footer?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div ref={heroRef}>
        <Hero />
      </div>
      <ScrollFadeIn>
        <AppPreview />
      </ScrollFadeIn>
      <ScrollFadeIn delay={0.1}>
        <BenefitsZigZag />
      </ScrollFadeIn>
      <ScrollFadeIn delay={0.1}>
        <section id="testimonials">
          <Testimonials />
        </section>
      </ScrollFadeIn>
      <ScrollFadeIn delay={0.1}>
        <TrialCTA />
      </ScrollFadeIn>
      <ScrollFadeIn delay={0.1}>
        <section id="pricing">
          <Pricing onScrollToContact={scrollToContact} />
        </section>
      </ScrollFadeIn>
      <footer id="footer">
        <Footer />
      </footer>
    </main>
  );
};

export default Index;
