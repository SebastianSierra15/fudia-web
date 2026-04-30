"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";
import { PrivacyRichTextBlock } from "../molecules/PrivacyRichTextBlock";

const heroParagraphs = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
];

export function PrivacyHeroSection() {
  return (
    <section className="border-b border-(--color-border) bg-(--color-surface-2) py-16 md:py-24 dark:border-[#2f4058] dark:bg-[#22324a]">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="mx-auto max-w-5xl space-y-8"
        >
          <SectionTag label="LEGAL" icon={Sparkles} />

          <h1 className="text-balance text-5xl leading-[1.06] font-semibold text-foreground md:text-7xl">
            {"Política de "}
            <span className="text-(--color-accent)">{"Privacidad"}</span>
          </h1>

          <PrivacyRichTextBlock
            paragraphs={heroParagraphs}
            className="max-w-4xl"
          />
        </motion.div>
      </Container>
    </section>
  );
}
