"use client";

import { motion } from "framer-motion";
import { Camera, Mic, Pencil } from "lucide-react";
import { HowItWorksStepBadge } from "../atoms/HowItWorksStepBadge";
import { CaptureMethodCard } from "../molecules/CaptureMethodCard";
import { HowItWorksImagePanel } from "../molecules/HowItWorksImagePanel";
import { Container } from "@/src/components/shared/atoms/Container";

const captureMethods = [
  {
    icon: Camera,
    title: "Foto",
    description: "Apunta la cámara a tu plato, eso es todo",
  },
  {
    icon: Mic,
    title: "Voz",
    description: "Habla naturalmente mientras cocinas o comes",
  },
  {
    icon: Pencil,
    title: "Texto",
    description: "Escribe o busca en nuestra base de 1M+ alimentos",
  },
];

export function HowItWorksCaptureSection() {
  return (
    <section className="pb-12 md:pb-16">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="space-y-6"
          >
            <HowItWorksStepBadge step="01" label="REGISTRA" />

            <h2 className="text-balance text-3xl leading-tight font-semibold text-foreground md:text-6xl">
              Captura tu comida como quieras
            </h2>

            <p className="max-w-3xl text-base leading-8 text-(--color-muted) md:text-xl">
              Fudia te da tres formas para que nunca tengas excusa de no
              registrar. Usa la que prefieras en cada momento.
            </p>

            <div className="space-y-3">
              {captureMethods.map((method) => (
                <CaptureMethodCard
                  key={method.title}
                  icon={method.icon}
                  title={method.title}
                  description={method.description}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <HowItWorksImagePanel
              src="/media/step1-salad.webp"
              alt="Registro de comida con foto en Fudia"
              title="Registro de comida con foto en Fudia"
              priority
            />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
