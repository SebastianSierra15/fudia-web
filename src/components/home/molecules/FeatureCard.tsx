"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";
import { FeatureIconBadge } from "../atoms/FeatureIconBadge";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  highlighted?: boolean;
  imageSrc?: string;
  imageAlt?: string;
  imageTitle?: string;
  className?: string;
  delay?: number;
  children?: ReactNode;
};

export function FeatureCard({
  title,
  description,
  icon,
  highlighted = false,
  imageSrc,
  imageAlt = "",
  imageTitle = "",
  className = "",
  delay = 0,
  children,
}: FeatureCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={`rounded-3xl border p-6 ${
        highlighted
          ? "border-(--color-accent) bg-(--color-accent)"
          : "border-(--color-border) bg-(--color-surface)"
      } ${className}`}
    >
      <div className="space-y-5">
        {imageSrc ? (
          <div className="relative h-36 overflow-hidden rounded-2xl border border-(--color-border)">
            <Image
              src={imageSrc}
              alt={imageAlt}
              title={imageTitle}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          </div>
        ) : null}

        <FeatureIconBadge icon={icon} highlighted={highlighted} />

        <div className="space-y-3">
          <h3
            className={`text-4xl font-semibold ${
              highlighted ? "text-(--color-accent-contrast)" : "text-foreground"
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-base leading-7 ${
              highlighted ? "text-black/65" : "text-(--color-muted)"
            }`}
          >
            {description}
          </p>
        </div>

        {children}
      </div>
    </motion.article>
  );
}
