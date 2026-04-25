"use client";

import { Bot, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { ProductTrustPill } from "../atoms/ProductTrustPill";
import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";
import { HeroImageCard } from "@/src/components/shared/molecules/HeroImageCard";

export function ProductHeroSection() {
  return (
    <section className="overflow-hidden border-b border-(--color-border) py-14 md:py-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-6"
          >
            <SectionTag label="EL PRODUCTO" icon={Sparkles} />

            <h1 className="text-balance text-5xl leading-[1.05] font-semibold text-foreground md:text-7xl">
              Una app construida
              <span className="block text-(--color-accent)">
                para que comas mejor
              </span>
            </h1>

            <p className="max-w-4xl text-base leading-8 text-(--color-muted) md:text-lg">
              Fudia es el companero nutricional que siempre quisiste. Sencilla
              por fuera, poderosa por dentro.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <ProductTrustPill icon={Bot} label="Powered by GPT-4o" />
              <ProductTrustPill icon={ShieldCheck} label="Datos cifrados" />
              <ProductTrustPill icon={Zap} label="Analisis en < 3 s" />
            </div>
          </motion.div>

          <div className="mx-auto w-full max-w-lg">
            <div className="grid grid-cols-2 items-end gap-4 sm:gap-6">
              <HeroImageCard
                src="/media/price-food.webp"
                alt="Alimentos saludables en la app de Fudia"
                title="Alimentos saludables en la app de Fudia"
                delay={0.05}
                priority
                borderClassName="border-black/45 dark:border-(--color-border)"
              />
              <HeroImageCard
                src="/media/price-jogger.webp"
                alt="Mujer trotando y usando Fudia"
                title="Mujer trotando y usando Fudia"
                delay={0.14}
                className="sm:translate-y-8"
                priority
                borderClassName="border-(--color-accent)"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
