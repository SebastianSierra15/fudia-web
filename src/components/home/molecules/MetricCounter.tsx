"use client";

import { animate, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type MetricCounterProps = {
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
  valueClassName?: string;
  labelClassName?: string;
};

export function MetricCounter({
  target,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
  delay = 0,
  valueClassName = "",
  labelClassName = "",
}: MetricCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.45 });
  const [value, setValue] = useState("0");

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const controls = animate(0, target, {
      duration: 1.25,
      delay,
      ease: "easeOut",
      onUpdate: (latest) => {
        setValue(latest.toFixed(decimals));
      },
    });

    return () => controls.stop();
  }, [decimals, delay, isInView, target]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.45, delay }}
      className="text-center"
    >
      <p
        className={`text-4xl leading-none font-semibold text-(--color-accent) ${valueClassName}`}
      >
        {prefix}
        {value}
        {suffix}
      </p>
      <p
        className={`mt-3 text-base leading-tight font-medium text-(--color-muted) ${labelClassName}`}
      >
        {label}
      </p>
    </motion.div>
  );
}
