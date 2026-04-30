"use client";

import { motion } from "framer-motion";
import { Container } from "@/src/components/shared/atoms/Container";
import { PrivacyRichTextBlock } from "../molecules/PrivacyRichTextBlock";

const contentParagraphs = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
];

export function PrivacyBodySection() {
  return (
    <section className="bg-background py-16 md:py-20 dark:bg-[#071633]">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.46, ease: "easeOut" }}
        >
          <PrivacyRichTextBlock
            paragraphs={contentParagraphs}
            className="mx-auto max-w-4xl"
          />
        </motion.div>
      </Container>
    </section>
  );
}
