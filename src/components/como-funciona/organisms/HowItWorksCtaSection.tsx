"use client";

import { motion } from "framer-motion";
import { Play, Smartphone } from "lucide-react";
import { Container } from "@/src/components/shared/atoms/Container";
import { StoreDownloadButton } from "@/src/components/shared/molecules/StoreDownloadButton";

export function HowItWorksCtaSection() {
  return (
    <section className="bg-(--color-accent) py-16 md:py-20" id="precios">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="mx-auto max-w-5xl space-y-6 text-center text-(--color-accent-contrast)"
        >
          <h2 className="text-balance text-5xl leading-tight font-semibold md:text-7xl">
            ¿Listo para empezar?
          </h2>

          <p className="mx-auto max-w-4xl text-xl leading-8 text-black/45">
            Descarga Fudia y registra tu primera comida en menos de 30 segundos.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <StoreDownloadButton
              icon={Smartphone}
              label="Descargar en App Store"
              className="border-[#1d2d58] bg-[#071633] text-white hover:bg-[#102450] [&_svg]:text-(--color-accent)"
            />
            <StoreDownloadButton
              icon={Play}
              label="Google Play"
              className="border-black/15 bg-(--color-accent) text-(--color-accent-contrast) hover:bg-[#a9e96b]"
            />
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

