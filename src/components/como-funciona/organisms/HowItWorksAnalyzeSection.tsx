"use client";

import { motion } from "framer-motion";
import { HowItWorksMetricCard } from "../atoms/HowItWorksMetricCard";
import { HowItWorksStepBadge } from "../atoms/HowItWorksStepBadge";
import { HowItWorksImagePanel } from "../molecules/HowItWorksImagePanel";
import { Container } from "@/src/components/shared/atoms/Container";

const metrics = [
  { value: "< 3s", label: "Tiempo de análisis" },
  { value: "98%", label: "Precisión" },
  { value: "1M+", label: "Alimentos" },
];

export function HowItWorksAnalyzeSection() {
  return (
    <section className="bg-(--color-surface) py-14 md:py-20">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <HowItWorksImagePanel
              src="/media/step2-apple.webp"
              alt="Análisis con IA de alimentos en Fudia"
              title="Análisis con IA de alimentos en Fudia"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="space-y-6"
          >
            <HowItWorksStepBadge step="02" label="ANALIZA" />

            <h2 className="text-balance text-5xl leading-tight font-semibold text-foreground md:text-7xl">
              La IA hace todo el trabajo pesado
            </h2>

            <p className="max-w-3xl text-base leading-8 text-(--color-muted) md:text-xl">
              Nuestros modelos de OpenAI Vision y GPT-4o procesan tu registro en
              tiempo real, identificando cada alimento y calculando sus valores
              nutricionales con precisión científica.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {metrics.map((metric) => (
                <HowItWorksMetricCard
                  key={metric.label}
                  value={metric.value}
                  label={metric.label}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

