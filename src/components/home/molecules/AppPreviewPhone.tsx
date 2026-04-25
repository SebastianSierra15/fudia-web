"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type AppPreviewPhoneProps = {
  src: string;
  alt: string;
  title: string;
  className?: string;
  borderClassName?: string;
  delay?: number;
  priority?: boolean;
};

export function AppPreviewPhone({
  src,
  alt,
  title,
  className = "",
  borderClassName = "border-(--color-border)",
  delay = 0,
  priority = false,
}: AppPreviewPhoneProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.52, ease: "easeOut", delay }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 5.4,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
          delay,
        }}
        className={`relative aspect-9/16 overflow-hidden rounded-4xl border cursor-crosshair bg-black shadow-[0_18px_44px_rgba(0,0,0,0.24)] ${borderClassName}`}
      >
        <Image
          src={src}
          alt={alt}
          title={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 33vw, 18vw"
          priority={priority}
        />
      </motion.div>
    </motion.div>
  );
}
