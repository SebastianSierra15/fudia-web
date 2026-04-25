"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { StepCard } from "../molecules/StepCard";
import { Container } from "@/src/components/shared/atoms/Container";

const steps = [
  {
    step: "01",
    icon: "camera" as const,
    title: "Fotografía tu comida",
    description:
      "Toma una foto de tu plato y nuestra IA identifica los ingredientes y sus porciones en segundos.",
  },
  {
    step: "02",
    icon: "mic" as const,
    title: "Describela por voz",
    description:
      "Habla naturalmente: 'Almorcé un plato de arroz con pollo' y Fudia registra tu comida al instante.",
    highlighted: true,
  },
  {
    step: "03",
    icon: "trend" as const,
    title: "Revisa tus métricas",
    description:
      "Ve en tiempo real tus calorías, proteínas, carbohidratos y grasas para ajustar tus metas con claridad.",
  },
];

export function StepsSection() {
  return (
    <section className="bg-(--color-surface) py-16 md:py-20" id="como-funciona">
      <Container>
        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="mx-auto max-w-4xl space-y-5 text-center"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-2) px-4 py-2 text-sm font-semibold tracking-wide text-(--color-accent)">
              <Sparkles size={15} strokeWidth={2.1} />
              CÓMO FUNCIONA
            </p>
            <h2 className="text-balance text-4xl leading-tight font-semibold text-foreground md:text-6xl">
              Registra, analiza y mejora
              <span className="block text-(--color-muted)">
                en tres simples pasos
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-7 text-(--color-muted) md:text-xl">
              Sin complicaciones. Fudia hace todo el trabajo pesado por ti.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <StepCard
                key={step.step}
                step={step.step}
                icon={step.icon}
                title={step.title}
                description={step.description}
                highlighted={step.highlighted}
                delay={index * 0.08}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
