'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, HelpCircle, Rocket } from 'lucide-react';
import { Stepper } from '@/components/ui/stepper';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PricingSection as PricingSectionType, PricingConfig } from '@/types/sanity';

interface PricingSectionProps {
  data: PricingSectionType;
  pricingConfig?: PricingConfig;
}

export default function PricingSection({ data, pricingConfig }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 md:py-32 bg-section-alt">
      <div className="container px-4">
        <header className="text-center mb-8 md:mb-12">
          {data.heading && <h2 className="text-3xl md:text-4xl font-bold text-foreground">{data.heading}</h2>}
          {data.subheading && <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{data.subheading}</p>}
        </header>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10 md:mb-14">
          <Label htmlFor="billing-toggle" className={`cursor-pointer transition-colors text-base ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Miesięcznie
          </Label>
          <Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
          <div className="flex items-center gap-2">
            <Label htmlFor="billing-toggle" className={`cursor-pointer transition-colors text-base ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Rocznie
            </Label>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-500/10 text-green-600">20% taniej</span>
          </div>
        </div>

        {/* Plans */}
        {data.plans && data.plans.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto items-stretch">
            {data.plans.map((plan, index) => (
              <PlanCard key={index} plan={plan} isYearly={isYearly} isHighlighted={plan.highlighted} />
            ))}
          </div>
        )}

        {/* Help section */}
        <div className="mt-12 md:mt-16 max-w-3xl mx-auto">
          <div className="bg-background rounded-2xl p-8 md:p-10 text-center border border-border/50 shadow-sm">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5">
              <Rocket className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">Działasz od pierwszego dnia!</h3>
            <p className="text-muted-foreground leading-relaxed">
              Pomagamy ustawić aplikację dokładnie pod Twoje usługi i cennik. Przenosimy też Twoją bazę klientów – z Excela, zeszytu, czy dowolnego innego systemu, którego używasz. Bez stresu, bez dodatkowych opłat.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, isYearly, isHighlighted }: { plan: NonNullable<PricingSectionType['plans']>[number]; isYearly: boolean; isHighlighted?: boolean }) {
  const [stations, setStations] = useState(1);
  const price = parseInt(plan.price) || 0;
  const discount = 0.2;

  const displayPrice = isYearly ? (price * (1 - discount)).toFixed(0) : plan.price;
  const monthlyTotal = price * stations;
  const yearlyMonthlyTotal = monthlyTotal * (1 - discount);
  const yearlyTotal = yearlyMonthlyTotal * 12;

  const scrollToHero = () => document.querySelector('#hero')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className={`bg-card rounded-3xl border p-6 md:p-10 flex flex-col h-full ${isHighlighted ? 'border-primary shadow-xl shadow-primary/10' : 'border-border shadow-xl'}`}>
      <h3 className="text-2xl font-bold text-foreground text-center mb-6">{plan.name}</h3>

      <div className="text-center mb-6">
        <p className="text-5xl md:text-6xl font-bold text-foreground">
          {displayPrice}<span className="text-2xl font-normal text-muted-foreground ml-1">zł</span>
        </p>
        {plan.period && <p className="text-sm text-muted-foreground mt-2">{plan.period}</p>}
      </div>

      {plan.features && plan.features.length > 0 && (
        <TooltipProvider delayDuration={100}>
          <div className="mb-8 flex-grow">
            <p className="font-semibold text-foreground text-sm mb-3">Zawarte w cenie:</p>
            <div className="space-y-2">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>
      )}

      <div className="mb-8">
        <Label className="block text-center text-sm text-muted-foreground mb-3">Liczba stanowisk</Label>
        <div className="flex justify-center">
          <Stepper value={stations} onChange={setStations} min={1} max={20} />
        </div>
      </div>

      <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
        <p className="text-sm text-muted-foreground mb-1">{isYearly ? 'Razem rocznie' : 'Razem miesięcznie'}</p>
        <p className="text-2xl font-bold text-foreground">
          {isYearly ? `${yearlyTotal.toFixed(0)} zł` : `${monthlyTotal.toFixed(0)} zł`}
          <span className="text-base font-normal text-muted-foreground ml-1">netto</span>
        </p>
      </div>

      <button
        onClick={scrollToHero}
        className="w-full h-14 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-auto"
      >
        {plan.ctaText || 'Umów prezentację'}
      </button>
    </div>
  );
}
