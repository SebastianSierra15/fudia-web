"use client";

import { motion } from "framer-motion";
import { HowItWorksBulletItem } from "../atoms/HowItWorksBulletItem";
import { HowItWorksStepBadge } from "../atoms/HowItWorksStepBadge";
import { HowItWorksImagePanel } from "../molecules/HowItWorksImagePanel";
import { Container } from "@/src/components/shared/atoms/Container";

const insights = [
  "Resumen diario con semáforo de macros",
  "Gráficas de tendencia semanal y mensual",
  "Recomendaciones personalizadas por IA",
  "Alertas cuando te alejas de tus metas",
];

export function HowItWorksImproveSection() {
  return (
    <section className="bg-background py-14 md:py-20">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="space-y-6"
          >
            <HowItWorksStepBadge step="03" label="MEJORA" />

            <h2 className="text-balance text-3xl leading-tight font-semibold text-foreground md:text-6xl">
              Insights que realmente cambian hábitos
            </h2>

            <p className="max-w-3xl text-base leading-8 text-(--color-muted) md:text-xl">
              Tu dashboard personal te muestra patrones, tendencias y
              oportunidades de mejora para mantenerte constante.
            </p>

            <ul className="space-y-1.5">
              {insights.map((item) => (
                <HowItWorksBulletItem key={item} text={item} />
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <HowItWorksImagePanel
              src="/media/step3-monitor.webp"
              alt="Insights de salud y nutrición en Fudia"
              title="Insights de salud y nutrición en Fudia"
            />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
