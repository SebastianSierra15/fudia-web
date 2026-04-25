type HowItWorksStepBadgeProps = {
  step: string;
  label: string;
  className?: string;
};

export function HowItWorksStepBadge({
  step,
  label,
  className = "",
}: HowItWorksStepBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl bg-(--color-accent) px-3 text-3xl font-semibold text-(--color-accent-contrast)">
        {step}
      </span>
      <span className="text-sm font-semibold tracking-wide text-(--color-accent)">
        {label}
      </span>
    </div>
  );
}

