"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { BillingToggle, type BillingCycle } from "../molecules/BillingToggle";
import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";

type PricingHeroSectionProps = {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
};

export function PricingHeroSection({
  billingCycle,
  onBillingCycleChange,
}: PricingHeroSectionProps) {
  return (
    <section className="pb-14 pt-18 md:pb-20 md:pt-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="mx-auto max-w-5xl space-y-7 text-center"
        >
          <SectionTag label="PLANES" icon={Sparkles} />

          <h1 className="text-balance text-5xl leading-[1.06] font-semibold text-foreground md:text-8xl">
            Elige el plan que
            <span className="block text-(--color-accent)">transforma tu vida</span>
          </h1>

          <p className="mx-auto max-w-4xl text-lg leading-8 text-(--color-muted) md:text-xl">
            Empieza gratis. Escala cuando estes listo. Sin sorpresas.
          </p>

          <BillingToggle value={billingCycle} onChange={onBillingCycleChange} />
        </motion.div>
      </Container>
    </section>
  );
}
