"use client";

import { motion } from "framer-motion";
import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";
import { Sparkles } from "lucide-react";
import { AboutFounderCard } from "../molecules/AboutFounderCard";

const founders = [
  {
    name: "Sebastián Torres",
    role: "Co-fundador & CEO",
    badge: "Co-fundador & CEO",
    initial: "S",
    tone: "lime" as const,
    bio: "Ingeniero de sistemas de la Universidad de los Andes con una obsesión por los productos que realmente cambian hábitos. Antes de Fudia trabajó en machine learning aplicado a salud en un startup de telemedicina. Sube montañas los fines de semana y tiene una relación amor-odio con el conteo de calorías que lo llevó a crear la solución definitiva.",
    tags: ["Product Strategy", "Machine Learning", "Fundraising", "Growth"],
  },
  {
    name: "Mateo Ríos",
    role: "Co-fundador & CTO",
    badge: "Co-fundador & CTO",
    initial: "M",
    tone: "blue" as const,
    bio: "Ingeniero de software apasionado por la visión computacional y las interfaces móviles. Construyó los primeros modelos de reconocimiento de alimentos de Fudia desde cero integrando OpenAI Vision con un pipeline de validación nutricional propio. Fan del café de especialidad, los keyboards mecánicos y la arquitectura de software limpia.",
    tags: ["React Native", "Computer Vision", "Backend", "DevOps"],
  },
];

export function AboutFoundersSection() {
  return (
    <section className="bg-(--color-surface) py-20 md:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <SectionTag label="EL EQUIPO FUNDADOR" icon={Sparkles} />
          <h2 className="mt-6 text-balance text-5xl leading-[1.08] font-semibold text-foreground md:text-7xl">
            {"Las personas detrás de "}
            <span className="text-(--color-accent)">Fudia</span>
          </h2>
          <p className="mt-5 text-base leading-8 text-(--color-muted) md:text-lg">
            {
              "Dos ingenieros con pasión por la salud, la inteligencia artificial y el diseño de producto."
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
          className="mt-14 grid gap-8 xl:grid-cols-2"
        >
          {founders.map((founder) => (
            <AboutFounderCard key={founder.name} {...founder} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
