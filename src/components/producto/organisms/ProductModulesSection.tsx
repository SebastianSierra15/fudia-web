"use client";

import { Camera, Mic, TrendingUp, WandSparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ProductModuleCard } from "../molecules/ProductModuleCard";
import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";

const modules = [
  {
    icon: Camera,
    title: "Escaner de comida",
    description: "IA que reconoce mas de 1 millon de alimentos con una sola foto.",
    imageSrc: "/media/card-cake.webp",
    imageAlt: "Escaneo de plato de comida en Fudia",
    imageTitle: "Escaneo de plato de comida en Fudia",
  },
  {
    icon: Mic,
    title: "Registro por voz",
    description: "Habla naturalmente y Fudia transcribe, interpreta y registra.",
    imageSrc: "/media/card-apron.webp",
    imageAlt: "Registro por voz en la app Fudia",
    imageTitle: "Registro por voz en la app Fudia",
    highlighted: true,
  },
  {
    icon: TrendingUp,
    title: "Dashboard nutricional",
    description:
      "Calorias, proteinas, carbos, grasas y micronutrientes en tiempo real con graficas semanales y mensuales.",
    imageSrc: "/media/card-cucumber.webp",
    imageAlt: "Dashboard nutricional con metricas en Fudia",
    imageTitle: "Dashboard nutricional con metricas en Fudia",
  },
];

export function ProductModulesSection() {
  return (
    <section className="bg-(--color-surface) py-16 md:py-20">
      <Container>
        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="mx-auto max-w-4xl space-y-4 text-center"
          >
            <SectionTag label="MODULOS" icon={WandSparkles} />
            <h2 className="text-balance text-5xl leading-tight font-semibold text-foreground md:text-7xl">
              Cada feature, pensada para ti
            </h2>
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-3">
            {modules.map((item, index) => (
              <ProductModuleCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                imageSrc={item.imageSrc}
                imageAlt={item.imageAlt}
                imageTitle={item.imageTitle}
                highlighted={item.highlighted}
                delay={index * 0.08}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
