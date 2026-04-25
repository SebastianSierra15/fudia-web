"use client";

import { Play, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { StoreDownloadButton } from "@/src/components/shared/molecules/StoreDownloadButton";
import { Container } from "@/src/components/shared/atoms/Container";

export function ProductCtaSection() {
  return (
    <section className="bg-(--color-accent) py-20 md:py-24" id="precios">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="mx-auto max-w-5xl space-y-7 text-center text-(--color-accent-contrast)"
        >
          <h2 className="text-balance text-5xl leading-tight font-semibold md:text-7xl">
            El cuerpo que quieres
            <span className="mt-2 block text-black/45 dark:text-black/55">
              empieza con lo que comes
            </span>
          </h2>

          <p className="mx-auto max-w-4xl text-xl leading-8 text-black/43">
            Unete a miles de personas que ya estan transformando su
            alimentacion con Fudia.
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
