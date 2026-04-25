"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { PricingPlanCard } from "../molecules/PricingPlanCard";
import type { BillingCycle } from "../molecules/BillingToggle";
import { Container } from "@/src/components/shared/atoms/Container";

type PricingPlansSectionProps = {
  billingCycle: BillingCycle;
};

const starterFeatures = [
  { text: "5 registros de comida por dia" },
  { text: "Analisis basico de macronutrientes" },
  { text: "Historial de 7 dias" },
  { text: "Registro por voz", available: false },
];

const proFeatures = [
  { text: "Registros ilimitados por dia" },
  { text: "Analisis IA completo de macros y micros" },
  { text: "Registro por foto y voz ilimitado" },
  { text: "Historial completo + graficas avanzadas" },
];

export function PricingPlansSection({ billingCycle }: PricingPlansSectionProps) {
  const proPrice = billingCycle === "yearly" ? "$7.99" : "$9.99";
  const starterDescriptionRef = useRef<HTMLParagraphElement>(null);
  const proDescriptionRef = useRef<HTMLParagraphElement>(null);
  const [descriptionMinHeight, setDescriptionMinHeight] = useState<number>(0);

  useLayoutEffect(() => {
    const measureDescriptionHeights = () => {
      const heights = [starterDescriptionRef.current, proDescriptionRef.current]
        .map((node) => node?.offsetHeight ?? 0)
        .filter((height) => height > 0);

      if (!heights.length) {
        return;
      }

      setDescriptionMinHeight(Math.max(...heights));
    };

    measureDescriptionHeights();
    const rafId = window.requestAnimationFrame(measureDescriptionHeights);
    window.addEventListener("resize", measureDescriptionHeights);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", measureDescriptionHeights);
    };
  }, [billingCycle]);

  return (
    <section className="pb-18 md:pb-24" id="precios">
      <Container>
        <div className="grid gap-5 lg:grid-cols-2">
          <PricingPlanCard
            pillLabel="GRATIS"
            title="Starter"
            description="Para empezar a conocer tu alimentacion sin compromiso."
            priceMain="$0"
            priceSuffix="/ mes"
            ctaLabel="Empezar gratis"
            ctaHref="/login"
            ctaTone="dark"
            features={starterFeatures}
            descriptionRef={starterDescriptionRef}
            descriptionMinHeight={descriptionMinHeight}
          />

          <PricingPlanCard
            pillLabel="MAS POPULAR"
            pillTone="accent"
            title="Pro"
            description="Para quienes se toman en serio su nutricion y quieren resultados reales."
            priceMain={proPrice}
            priceSuffix="/ mes"
            ctaLabel="Comenzar con Pro"
            ctaHref="/login"
            ctaTone="accent"
            highlighted
            delay={0.08}
            features={proFeatures}
            descriptionRef={proDescriptionRef}
            descriptionMinHeight={descriptionMinHeight}
          />
        </div>
      </Container>
    </section>
  );
}
