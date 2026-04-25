import type { LucideIcon } from "lucide-react";

type StepIconBadgeProps = {
  icon: LucideIcon;
  highlighted?: boolean;
};

export function StepIconBadge({
  icon: Icon,
  highlighted = false,
}: StepIconBadgeProps) {
  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${
        highlighted
          ? "border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)"
          : "border-(--color-border) bg-(--color-surface-2) text-(--color-accent)"
      }`}
    >
      <Icon size={20} strokeWidth={2.1} />
    </span>
  );
}
