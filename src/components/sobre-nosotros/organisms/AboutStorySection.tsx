"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";
import { AboutStoryMosaic } from "../molecules/AboutStoryMosaic";

export function AboutStorySection() {
  return (
    <section className="bg-background py-16 md:py-20 dark:bg-(--color-surface)">
      <Container>
        <div className="grid gap-14 xl:grid-cols-[1.05fr_1fr] xl:items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
          >
            <AboutStoryMosaic />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
            className="space-y-6"
          >
            <SectionTag label="NUESTRA HISTORIA" icon={Sparkles} />

            <h2 className="text-balance text-5xl leading-[1.08] font-semibold text-foreground md:text-7xl">
              {"Empezó con una "}
              <span className="text-(--color-accent)">{"frustración"}</span>
              {" compartida"}
            </h2>

            <div className="space-y-6 text-base leading-8 text-(--color-muted) md:text-lg">
              <p>
                {
                  "En 2022, Sebastián y Mateo se conocieron en un hackathon de salud digital en Bogotá. Ambos habían intentado llevar un registro nutricional y ambos habían fracasado por la misma razón: era demasiado tedioso."
                }
              </p>
              <p>
                {
                  "Las apps existentes pedían pesar ingredientes, buscar entre bases de datos interminables y calcular macros manualmente. Era un trabajo de tiempo completo, no una herramienta de bienestar."
                }
              </p>
              <p>
                {
                  "En 48 horas construyeron el primer prototipo de lo que hoy es Fudia: tomas una foto, la IA hace el resto. Ganaron el primer lugar, y más importante, validaron que millones de personas tenían el mismo problema."
                }
              </p>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
