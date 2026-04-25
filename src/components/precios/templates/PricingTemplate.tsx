"use client";

import { useState } from "react";
import { type BillingCycle } from "../molecules/BillingToggle";
import { PricingFaqSection } from "../organisms/PricingFaqSection";
import { PricingHeroSection } from "../organisms/PricingHeroSection";
import { PricingPlansSection } from "../organisms/PricingPlansSection";
import { FooterSection } from "@/src/components/shared/organisms/FooterSection";
import { NavBar } from "@/src/components/shared/organisms/NavBar";

export function PricingTemplate() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar activeItem="precios" />
      <main className="flex flex-1 flex-col">
        <PricingHeroSection
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
        />
        <PricingPlansSection billingCycle={billingCycle} />
        <PricingFaqSection />
      </main>
      <FooterSection />
    </div>
  );
}

