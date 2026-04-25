"use client";

import { TicketPercent } from "lucide-react";
import { BillingCycleOption } from "../atoms/BillingCycleOption";

export type BillingCycle = "monthly" | "yearly";

type BillingToggleProps = {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
};

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-(--color-border) bg-(--color-surface) p-1.5">
      <BillingCycleOption
        label="Mensual"
        active={value === "monthly"}
        onClick={() => onChange("monthly")}
      />

      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={`inline-flex h-12 items-center cursor-pointer justify-center gap-2 rounded-full px-7 text-lg font-semibold transition-colors ${
          value === "yearly"
            ? "bg-(--color-accent) text-(--color-accent-contrast)"
            : "text-(--color-muted) hover:text-foreground"
        }`}
      >
        Anual
        <span className="inline-flex items-center gap-1 text-base opacity-90">
          <TicketPercent size={15} />
          20% off
        </span>
      </button>
    </div>
  );
}
