"use client";

import { motion } from "framer-motion";
import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";
import { Sparkles } from "lucide-react";

export function AboutHeroSection() {
  return (
    <section className="bg-background py-16 md:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="max-w-4xl space-y-7"
        >
          <SectionTag label="SOBRE NOSOTROS" icon={Sparkles} />

          <h1 className="text-balance text-5xl leading-[1.05] font-semibold text-foreground md:text-7xl">
            {"Construidos para "}
            <span className="text-(--color-accent)">cambiar</span>
            {" la relación con tu comida"}
          </h1>

          <p className="max-w-3xl text-base leading-8 text-(--color-muted) md:text-lg">
            {
              "Somos un equipo pequeño con una convicción enorme: que la tecnología puede hacer que comer bien sea simple, placentero y accesible para todos."
            }
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
