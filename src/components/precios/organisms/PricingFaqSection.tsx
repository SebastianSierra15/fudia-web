"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CircleHelp } from "lucide-react";
import { FaqItem } from "../molecules/FaqItem";
import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";

const faqs = [
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Si, puedes cancelar tu suscripcion en cualquier momento desde la app sin penalizaciones. Tu plan se mantiene activo hasta el final del periodo vigente.",
  },
  {
    question: "¿El plan gratuito tiene publicidad?",
    answer:
      "No. Fudia no tiene publicidad en ningun plan. El plan gratuito tiene limites de uso, pero la experiencia es limpia y sin interrupciones.",
  },
  {
    question: "¿Que tan preciso es el analisis de IA?",
    answer:
      "Nuestro modelo tiene un 98% de precision en identificacion de alimentos comunes. Para preparaciones complejas, puedes editar resultados manualmente.",
  },
  {
    question: "¿Mis datos nutricionales son privados?",
    answer:
      "Absolutamente. Tus datos nunca se venden ni se comparten con terceros. Estan cifrados y solo tu tienes acceso a ellos.",
  },
];

export function PricingFaqSection() {
  const [openQuestion, setOpenQuestion] = useState(faqs[0]?.question ?? "");

  return (
    <section className="bg-(--color-surface) py-16 md:py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="mx-auto max-w-5xl space-y-4 text-center"
        >
          <SectionTag label="PREGUNTAS FRECUENTES" icon={CircleHelp} />
          <h2 className="text-balance text-5xl leading-tight font-semibold text-foreground md:text-7xl">
            Todo lo que necesitas saber
          </h2>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openQuestion === faq.question}
              onToggle={() =>
                setOpenQuestion((prev) => (prev === faq.question ? "" : faq.question))
              }
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

