"use client";

import { motion } from "framer-motion";
import { Check, Smartphone } from "lucide-react";
import { AppPreviewPhone } from "../molecules/AppPreviewPhone";
import { Container } from "@/src/components/shared/atoms/Container";

const bullets = [
  "Registro en menos de 10 segundos",
  "Base de datos de más de 1 millón de alimentos",
  "Disponible en iOS y Android",
];

export function DesignedSection() {
  return (
    <section className="bg-(--color-surface) py-16 md:py-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="max-w-2xl space-y-6"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-2) px-4 py-2 text-sm font-semibold tracking-wide text-(--color-accent)">
              <Smartphone size={15} strokeWidth={2.1} />
              LA APP
            </p>

            <div className="space-y-4">
              <h2 className="text-balance text-4xl leading-tight font-semibold text-foreground md:text-6xl">
                Diseñada para
                <span className="block text-(--color-accent)">
                  que no abandones
                </span>
              </h2>
              <p className="text-base leading-7 text-(--color-muted) md:text-xl">
                Una interfaz tan sencilla que registrar tu alimentación toma
                menos de 10 segundos y te ayuda a mantener el rumbo.
              </p>
            </div>

            <ul className="space-y-3 text-lg text-foreground">
              {bullets.map((item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.34,
                    ease: "easeOut",
                    delay: 0.1 + index * 0.06,
                  }}
                  className="flex items-center gap-3"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface-2) text-(--color-accent)">
                    <Check size={14} strokeWidth={2.6} />
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <div className="mx-auto w-full max-w-3xl">
            <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
              <AppPreviewPhone
                src="/media/mock-salmon.webp"
                alt="Comida saludable con salmon en app de Fudia"
                title="Comida saludable con salmon en app de Fudia"
                className="sm:translate-y-8"
                delay={0.06}
              />
              <AppPreviewPhone
                src="/media/mock-green.webp"
                alt="Pantalla principal de la app Fudia"
                title="Pantalla principal de la app Fudia"
                borderClassName="border-(--color-accent)"
                className="-translate-y-2 sm:-translate-y-8"
                delay={0.16}
                priority
              />
              <AppPreviewPhone
                src="/media/mock-lemon.webp"
                alt="Vista de alimentos en la app Fudia"
                title="Vista de alimentos en la app Fudia"
                className="sm:translate-y-8"
                delay={0.26}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
