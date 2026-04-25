"use client";

import { motion } from "framer-motion";
import { Camera, Mic, TrendingUp } from "lucide-react";
import { StepIconBadge } from "../atoms/StepIconBadge";

type StepIconName = "camera" | "mic" | "trend";

type StepCardProps = {
  step: string;
  title: string;
  description: string;
  icon: StepIconName;
  highlighted?: boolean;
  delay?: number;
};

const iconByName = {
  camera: Camera,
  mic: Mic,
  trend: TrendingUp,
} as const;

export function StepCard({
  step,
  title,
  description,
  icon,
  highlighted = false,
  delay = 0,
}: StepCardProps) {
  const Icon = iconByName[icon];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={`flex h-full flex-col gap-5 rounded-3xl border p-6 transition-colors ${
        highlighted
          ? "border-(--color-accent) bg-(--color-accent-soft)"
          : "border-(--color-border) bg-(--color-surface)"
      }`}
    >
      <span className="text-5xl leading-none font-semibold text-(--color-accent-strong)">
        {step}
      </span>
      <StepIconBadge icon={Icon} highlighted={highlighted} />
      <div className="space-y-2">
        <h3 className="text-3xl font-semibold text-foreground">{title}</h3>
        <p className="text-base leading-7 text-(--color-muted)">{description}</p>
      </div>
    </motion.article>
  );
}
