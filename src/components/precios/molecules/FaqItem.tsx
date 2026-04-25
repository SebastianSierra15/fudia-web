"use client";

import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

type FaqItemProps = {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
};

export function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  return (
    <article className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 md:p-7">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-start justify-between gap-5 text-left"
      >
        <h3 className="text-3xl leading-tight font-semibold text-foreground md:text-4xl">
          {question}
        </h3>
        <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--color-border) bg-(--color-surface-2) text-(--color-accent)">
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </span>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? 14 : 0,
        }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <p className="text-lg leading-8 text-(--color-muted)">{answer}</p>
      </motion.div>
    </article>
  );
}
