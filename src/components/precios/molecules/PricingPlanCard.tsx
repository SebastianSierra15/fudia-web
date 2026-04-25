"use client";

import type { RefObject } from "react";
import { motion } from "framer-motion";
import { PlanFeatureItem } from "../atoms/PlanFeatureItem";
import { PlanPill } from "../atoms/PlanPill";

type Feature = {
  text: string;
  available?: boolean;
};

type PricingPlanCardProps = {
  pillLabel: string;
  pillTone?: "neutral" | "accent";
  title: string;
  description: string;
  priceMain: string;
  priceSuffix: string;
  ctaLabel: string;
  ctaTone?: "dark" | "accent";
  highlighted?: boolean;
  features: Feature[];
  descriptionRef?: RefObject<HTMLParagraphElement | null>;
  descriptionMinHeight?: number;
  delay?: number;
};

export function PricingPlanCard({
  pillLabel,
  pillTone = "neutral",
  title,
  description,
  priceMain,
  priceSuffix,
  ctaLabel,
  ctaTone = "dark",
  highlighted = false,
  features,
  descriptionRef,
  descriptionMinHeight,
  delay = 0,
}: PricingPlanCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={`flex h-full flex-col rounded-4xl border p-7 md:p-8 ${
        highlighted
          ? "border-(--color-accent) bg-(--color-surface)"
          : "border-(--color-border) bg-(--color-surface)"
      }`}
    >
      <div className="flex flex-1 flex-col">
        <div className="space-y-4">
          <PlanPill label={pillLabel} tone={pillTone} />
          <h3 className="text-5xl font-semibold text-foreground md:text-6xl">
            {title}
          </h3>
          <p
            ref={descriptionRef}
            style={
              descriptionMinHeight ? { minHeight: `${descriptionMinHeight}px` } : undefined
            }
            className="text-lg leading-8 text-(--color-muted)"
          >
            {description}
          </p>
        </div>

        <div className="mt-6 flex items-end gap-2">
          <p className="text-7xl leading-none font-semibold text-foreground md:text-8xl">
            {priceMain}
          </p>
          <p className="mb-1.5 text-3xl text-(--color-muted) md:text-4xl">
            {priceSuffix}
          </p>
        </div>

        <button
          type="button"
          className={`mt-7 inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-2xl border text-xl font-semibold transition-colors md:h-16 md:text-3xl ${
            ctaTone === "accent"
              ? "border-(--color-accent) bg-(--color-accent) text-(--color-accent-contrast) hover:bg-(--color-accent-link)"
              : "border-[#2a3140] bg-[#1b1b1f] text-white hover:bg-[#2a2a31]"
          }`}
        >
          {ctaLabel}
        </button>
      </div>

      <div className="mt-6 h-px bg-(--color-border)" />

      <ul className="mt-7 space-y-2.5">
        {features.map((feature) => (
          <PlanFeatureItem
            key={feature.text}
            text={feature.text}
            available={feature.available}
          />
        ))}
      </ul>
    </motion.article>
  );
}
