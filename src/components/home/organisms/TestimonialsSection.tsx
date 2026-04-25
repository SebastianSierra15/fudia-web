"use client";

import { motion } from "framer-motion";
import { MessageSquareQuote } from "lucide-react";
import { TestimonialCard } from "../molecules/TestimonialCard";
import { Container } from "@/src/components/shared/atoms/Container";

const testimonials = [
  {
    quote:
      "Llevo 3 meses usando Fudia y bajé 8 kilos. La función de registro con foto hace que todo sea más fácil.",
    name: "María García",
    location: "Bogotá, Colombia",
    avatarTone: "accent" as const,
  },
  {
    quote:
      "Como nutricionista, recomiendo Fudia a todos mis pacientes porque simplifica el control de porciones y el seguimiento diario.",
    name: "Dr. Carlos Mendoza",
    location: "Nutricionista, Medellín",
    highlighted: true,
  },
  {
    quote:
      "Me encanta que puedo registrar por voz mientras cocino. Es como tener un acompañamiento nutricional en tiempo real.",
    name: "Valentina Ruiz",
    location: "Cali, Colombia",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-20" id="testimonios">
      <Container>
        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="mx-auto max-w-4xl space-y-5 text-center"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-2) px-4 py-2 text-sm font-semibold tracking-wide text-(--color-accent)">
              <MessageSquareQuote size={15} strokeWidth={2.1} />
              TESTIMONIOS
            </p>
            <h2 className="text-balance text-4xl leading-tight font-semibold text-foreground md:text-6xl">
              Lo que dicen nuestros usuarios
            </h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.name}
                quote={testimonial.quote}
                name={testimonial.name}
                location={testimonial.location}
                highlighted={testimonial.highlighted}
                avatarTone={testimonial.avatarTone}
                delay={index * 0.08}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
