"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type HeroImageCardProps = {
  src: string;
  alt: string;
  title: string;
  backgroundClassName?: string;
  className?: string;
  priority?: boolean;
  delay?: number;
  borderClassName?: string;
};

export function HeroImageCard({
  src,
  alt,
  title,
  backgroundClassName = "bg-black",
  className = "",
  priority = false,
  delay = 0,
  borderClassName = "border-(--color-accent)",
}: HeroImageCardProps) {
  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.52, ease: "easeOut", delay }}
        className={`relative cursor-crosshair aspect-9/16 overflow-hidden rounded-4xl border shadow-[0_22px_50px_rgba(0,0,0,0.2)] ${backgroundClassName} ${borderClassName}`}
      >
        <Image
          src={src}
          alt={alt}
          title={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 44vw, 22vw"
          priority={priority}
        />
      </motion.div>
    </div>
  );
}
