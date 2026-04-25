type BillingCycleOptionProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export function BillingCycleOption({
  label,
  active = false,
  onClick,
}: BillingCycleOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-12 cursor-pointer items-center justify-center rounded-full px-8 text-lg font-semibold transition-colors ${
        active
          ? "bg-(--color-accent) text-(--color-accent-contrast)"
          : "text-(--color-muted) hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
