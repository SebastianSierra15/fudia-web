"use client";

import { motion } from "framer-motion";
import { Dna, Earth, Search, Zap } from "lucide-react";
import { Container } from "@/src/components/shared/atoms/Container";
import { AboutValueCard } from "../atoms/AboutValueCard";

const values = [
  {
    icon: Zap,
    title: "Velocidad con propósito",
    description:
      "Iteramos rápido, pero nunca sacrificamos la calidad del dato nutricional. La precisión no es negociable.",
  },
  {
    icon: Search,
    title: "Transparencia radical",
    description:
      "Te mostramos exactamente cómo calculamos tus macros. Sin cajas negras, sin estimados vagos.",
  },
  {
    icon: Earth,
    title: "Acceso para todos",
    description:
      "Diseñamos primero para Latinoamérica. Nuestros modelos reconocen arepas, bandeja paisa y aguadepanela.",
  },
  {
    icon: Dna,
    title: "Ciencia primero",
    description:
      "Cada recomendación está respaldada por evidencia nutricional real, no por tendencias de redes sociales.",
  },
];

export function AboutValuesSection() {
  return (
    <section className="bg-(--color-surface) py-16 md:py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <h2 className="text-balance text-5xl leading-[1.08] font-semibold text-foreground md:text-7xl">
            Lo que nos <span className="text-(--color-accent)">define</span>
          </h2>
          <p className="mt-5 text-base leading-8 text-(--color-muted) md:text-lg">
            {
              "Cuatro principios que guían cada decisión de producto, de negocio y de equipo."
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
          className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4"
        >
          {values.map((value) => (
            <AboutValueCard key={value.title} {...value} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
