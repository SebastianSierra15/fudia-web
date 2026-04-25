"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";

type ProductModuleCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageTitle: string;
  highlighted?: boolean;
  delay?: number;
};

export function ProductModuleCard({
  icon: Icon,
  title,
  description,
  imageSrc,
  imageAlt,
  imageTitle,
  highlighted = false,
  delay = 0,
}: ProductModuleCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
      className={`flex h-full flex-col gap-4 rounded-3xl border p-6 ${
        highlighted
          ? "border-(--color-accent) bg-white dark:bg-background"
          : "border-(--color-border) bg-white dark:bg-background"
      }`}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-surface-2)">
        <Icon size={21} strokeWidth={2.1} className="text-(--color-accent)" />
      </span>

      <h3 className="text-3xl font-semibold text-foreground">{title}</h3>
      <p className="text-base leading-7 text-(--color-muted)">{description}</p>

      <div className="relative mt-2 aspect-16/7 overflow-hidden rounded-2xl">
        <Image
          src={imageSrc}
          alt={imageAlt}
          title={imageTitle}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 90vw, 31vw"
        />
      </div>
    </motion.article>
  );
}
