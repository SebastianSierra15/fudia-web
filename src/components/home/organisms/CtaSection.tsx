"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Container } from "@/src/components/shared/atoms/Container";
import { AppStoreLogo, GooglePlayLogo } from "@/src/components/shared/atoms/StoreLogos";
import { StoreDownloadButton } from "@/src/components/shared/molecules/StoreDownloadButton";

export function CtaSection() {
  return (
    <section className="bg-(--color-accent) py-16 md:py-20" id="precios">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-5xl space-y-8 text-center text-(--color-accent-contrast)"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-black/5 px-4 py-2 text-sm font-semibold tracking-wide">
            <Sparkles size={15} strokeWidth={2.1} />
            EMPIEZA HOY
          </p>

          <h2 className="text-balance text-5xl leading-tight font-semibold md:text-7xl">
            {"Tu nutricionista personal te está esperando"}
          </h2>

          <p className="mx-auto max-w-4xl text-xl leading-8 text-black/45">
            {
              "Descarga Fudia gratis y empieza a transformar tu alimentación hoy mismo."
            }
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <StoreDownloadButton
              icon={<AppStoreLogo className="size-5" />}
              label="Descargar en App Store"
              className="border-[#1d2d58] bg-[#071633] text-white hover:bg-[#102450] [&_svg]:text-(--color-accent)"
            />
            <StoreDownloadButton
              icon={<GooglePlayLogo className="size-5" />}
              label="Disponible en Google Play"
              className="border-black/15 bg-(--color-accent) text-(--color-accent-contrast) hover:bg-[#a9e96b]"
            />
          </div>

          <p className="text-lg text-black/38">
            {
              "Gratis para siempre \u00b7 Sin tarjeta de crédito \u00b7 Cancela cuando quieras"
            }
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
