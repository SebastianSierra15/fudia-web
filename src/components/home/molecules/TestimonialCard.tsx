"use client";

import { motion } from "framer-motion";
import { RatingStars } from "../atoms/RatingStars";

type TestimonialCardProps = {
  quote: string;
  name: string;
  location: string;
  highlighted?: boolean;
  delay?: number;
  avatarTone?: "accent" | "neutral";
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export function TestimonialCard({
  quote,
  name,
  location,
  highlighted = false,
  delay = 0,
  avatarTone = "neutral",
}: TestimonialCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
      className={`flex h-full min-h-64 flex-col gap-5 rounded-3xl border p-6 ${
        highlighted
          ? "border-(--color-accent) bg-(--color-surface)"
          : "border-(--color-border) bg-(--color-surface)"
      }`}
    >
      <RatingStars />

      <p className="text-base leading-7 text-foreground">
        &ldquo;{quote}&rdquo;
      </p>

      <div className="mt-auto flex items-center gap-3">
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${
            avatarTone === "accent"
              ? "bg-(--color-accent) text-(--color-accent-contrast)"
              : "bg-(--color-surface-2) text-foreground"
          }`}
          aria-hidden="true"
        >
          {getInitial(name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{name}</p>
          <p className="truncate text-sm text-(--color-muted)">{location}</p>
        </div>
      </div>
    </motion.article>
  );
}
