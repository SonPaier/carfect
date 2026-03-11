"use client";

import { useState } from "react";
import { Stepper } from "@/components/ui/stepper";
import { Label } from "@/components/ui/label";
import { Check, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Feature {
  text: string;
  tooltip?: string;
}

interface PricingCardProps {
  title: string;
  firstStationPrice: number;
  additionalStationPrice: number;
  features: Feature[];
  includesPackage?: string;
  isYearly: boolean;
  onScrollToHero: () => void;
  isHighlighted?: boolean;
}

const PricingCard = ({
  title,
  firstStationPrice,
  additionalStationPrice,
  features,
  includesPackage,
  isYearly,
  onScrollToHero,
  isHighlighted = false,
}: PricingCardProps) => {
  const [stations, setStations] = useState(1);

  const discount = 0.2; // 20%

  // Calculate total based on first station being more expensive
  const calculateMonthlyTotal = () => {
    if (stations === 1) return firstStationPrice;
    return firstStationPrice + (stations - 1) * additionalStationPrice;
  };

  const monthlyTotal = calculateMonthlyTotal();
  const yearlyMonthlyTotal = monthlyTotal * (1 - discount);
  const yearlyTotal = yearlyMonthlyTotal * 12;

  const displayFirstPrice = isYearly
    ? (firstStationPrice * (1 - discount)).toFixed(0)
    : firstStationPrice;

  const displayAdditionalPrice = isYearly
    ? (additionalStationPrice * (1 - discount)).toFixed(0)
    : additionalStationPrice;

  return (
    <div
      className={`bg-card rounded-3xl border p-6 md:p-10 flex flex-col h-full ${
        isHighlighted
          ? "border-primary shadow-xl shadow-primary/10"
          : "border-border shadow-xl"
      }`}
    >
      {/* Title */}
      <h3 className="text-2xl font-bold text-foreground text-center mb-6">
        {title}
      </h3>

      {/* Big Price Display */}
      <div className="text-center mb-6">
        <p className="text-5xl md:text-6xl font-bold text-foreground">
          {displayFirstPrice}
          <span className="text-2xl font-normal text-muted-foreground ml-1">
            zł
          </span>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          za pierwsze stanowisko / miesiąc
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Każde kolejne: <span className="font-semibold text-foreground">{displayAdditionalPrice}zł</span>
        </p>
      </div>

      {/* Features */}
      <TooltipProvider delayDuration={100}>
        <div className="mb-8 flex-grow">
          <p className="font-semibold text-foreground text-sm mb-3">
            {includesPackage
              ? `Wszystko z pakietu ${includesPackage}, ponadto:`
              : "Zawarte w cenie:"}
          </p>
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {feature.text}
                </span>
                {feature.tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{feature.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>

      {/* Stations stepper */}
      <div className="mb-8">
        <Label className="block text-center text-sm text-muted-foreground mb-3">
          Liczba stanowisk dla pojazdów w Twojej firmie
        </Label>
        <div className="flex justify-center">
          <Stepper value={stations} onChange={setStations} min={1} max={20} />
        </div>
      </div>

      {/* Total */}
      <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
        <p className="text-sm text-muted-foreground mb-1">
          {isYearly ? "Razem rocznie" : "Razem miesięcznie"}
        </p>
        <p className="text-2xl font-bold text-foreground">
          {isYearly
            ? `${yearlyTotal.toFixed(0)} zł`
            : `${monthlyTotal.toFixed(0)} zł`}
          <span className="text-base font-normal text-muted-foreground ml-1">
            netto
          </span>
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onScrollToHero}
        className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-sky-500 text-primary-foreground hover:from-primary/90 hover:to-sky-500/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 mt-auto"
      >
        Umów prezentację
      </button>
    </div>
  );
};

export default PricingCard;
