type PlanPillProps = {
  label: string;
  tone?: "neutral" | "accent";
};

export function PlanPill({ label, tone = "neutral" }: PlanPillProps) {
  return (
    <span
      className={`inline-flex h-8 items-center rounded-full px-4 text-xs font-semibold tracking-wide ${
        tone === "accent"
          ? "bg-(--color-accent-soft) text-(--color-accent)"
          : "bg-(--color-surface-2) text-(--color-muted)"
      }`}
    >
      {label}
    </span>
  );
}

