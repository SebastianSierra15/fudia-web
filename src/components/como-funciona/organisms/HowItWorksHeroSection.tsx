"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";

export function HowItWorksHeroSection() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="mx-auto max-w-6xl space-y-7 text-center"
        >
          <SectionTag label="CÓMO FUNCIONA" icon={Sparkles} />

          <h1 className="text-balance text-5xl leading-[1.08] font-semibold text-foreground md:text-8xl">
            De la foto al insight
            <span className="block text-(--color-accent)">
              en menos de 3 segundos
            </span>
          </h1>

          <p className="mx-auto max-w-5xl text-base leading-8 text-(--color-muted) md:text-xl">
            Fudia combina visión computacional, procesamiento de lenguaje
            natural y ciencia nutricional para darte análisis instantáneos y
            precisos.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
